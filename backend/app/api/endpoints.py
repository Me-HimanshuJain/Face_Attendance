from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.database import get_db
from app.db import models
from app.core import security
from app.services import face_service
import numpy as np
import cv2
from pydantic import BaseModel
from typing import Optional
from datetime import timedelta, datetime
import random
import re

router = APIRouter()

def validate_strong_password(password: str):
    """Raise HTTPException if password does not meet strength requirements."""
    errors = []
    if len(password) < 8:
        errors.append("at least 8 characters")
    if not re.search(r'[A-Z]', password):
        errors.append("1 uppercase letter (A–Z)")
    if not re.search(r'[a-z]', password):
        errors.append("1 lowercase letter (a–z)")
    if not re.search(r'[0-9]', password):
        errors.append("1 numeric digit (0–9)")
    if not re.search(r'[^A-Za-z0-9]', password):
        errors.append("1 special character (!@#$…)")
    if errors:
        raise HTTPException(
            status_code=400,
            detail="Password must contain: " + ", ".join(errors)
        )

class LoginRequest(BaseModel):
    identifier: str # Email or Roll Number
    password: str
    role_type: str # "student" or "admin"

@router.post("/auth/login")
def login(request: LoginRequest, db: Session = Depends(get_db)):
    identifier = request.identifier.lower()
    
    if request.role_type == "student":
        user = db.query(models.Student).filter(
            (func.lower(models.Student.email) == identifier) | 
            (func.lower(models.Student.roll_number) == identifier)
        ).first()
    else:
        user = db.query(models.Admin).filter(
            (func.lower(models.Admin.email) == identifier) | 
            (func.lower(models.Admin.admin_id) == identifier)
        ).first()

    if not user or not security.verify_password(request.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
        
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is disabled")

    # In a real app, you would determine role dynamically, but for now we trust role_type
    actual_role = "student" if request.role_type == "student" else "admin"
    if actual_role == "admin" and user.role:
        actual_role = user.role.name # e.g. "Super Admin"
        
    access_token = security.create_access_token(
        data={"sub": str(user.id), "role": actual_role}
    )
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.full_name,
            "email": user.email,
            "role": actual_role
        }
    }

class AdminRegistration(BaseModel):
    full_name: str
    admin_id: str
    email: str
    contact_number: str
    role_id: str
    department_id: Optional[str] = None
    password: str

class AdminRegistrationVerify(AdminRegistration):
    otp_code: str

@router.post("/auth/register/admin")
async def request_admin_registration(
    full_name: str = Form(...),
    admin_id: str = Form(...),
    email: str = Form(...),
    contact_number: str = Form(...),
    role_id: str = Form(...),
    department_id: Optional[str] = Form(None),
    password: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    validate_strong_password(password)
    if db.query(models.Admin).filter(models.Admin.email == email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    if db.query(models.Admin).filter(models.Admin.admin_id == admin_id).first():
        raise HTTPException(status_code=400, detail="Admin ID already registered")
        
    # Process Image to ensure face is detected before sending OTP
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if img is None:
        raise HTTPException(status_code=400, detail="Invalid image file")
        
    is_real = face_service.check_liveness(img)
    if not is_real:
        raise HTTPException(status_code=403, detail="Spoofing detected! Please present a real face.")

    embedding = face_service.generate_embedding(img)
    if embedding is None:
        raise HTTPException(status_code=400, detail="No face detected in the image. Please ensure your face is clearly visible.")

    # Find Super Admin
    super_admin_role = db.query(models.Role).filter(models.Role.name == "Super Admin").first()
    if not super_admin_role:
        raise HTTPException(status_code=400, detail="System not initialized. No Super Admin found.")
        
    super_admin = db.query(models.Admin).filter(models.Admin.role_id == super_admin_role.id).first()
    if not super_admin:
        raise HTTPException(status_code=400, detail="System not initialized. No Super Admin found.")

    # Generate 6-digit OTP
    otp_code = str(random.randint(100000, 999999))
    
    # Store OTP in DB
    new_otp = models.OTPRequest(
        email=email, # using the requesting admin's email as identifier
        otp_code=otp_code,
        expires_at=datetime.utcnow() + timedelta(minutes=10)
    )
    db.add(new_otp)
    db.commit()
    
    # SIMULATE SENDING OTP
    print("*" * 50)
    print(f"ATTENTION SUPER ADMIN ({super_admin.full_name}):")
    print(f"An admin access request was made by {full_name} ({email}).")
    print(f"OTP CODE: {otp_code}")
    print("*" * 50)
    
    return {"message": "OTP sent to Super Admin's contact details", "requires_otp": True}

@router.post("/auth/register/admin/verify")
async def verify_admin_registration(
    full_name: str = Form(...),
    admin_id: str = Form(...),
    email: str = Form(...),
    contact_number: str = Form(...),
    role_id: str = Form(...),
    department_id: Optional[str] = Form(None),
    password: str = Form(...),
    otp_code: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    # Verify OTP
    otp_req = db.query(models.OTPRequest).filter(
        models.OTPRequest.email == email,
        models.OTPRequest.otp_code == otp_code,
        models.OTPRequest.expires_at > datetime.utcnow()
    ).first()
    
    if not otp_req:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP.")
        
    # Process Image
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if img is None:
        raise HTTPException(status_code=400, detail="Invalid image file")
        
    is_real = face_service.check_liveness(img)
    if not is_real:
        raise HTTPException(status_code=403, detail="Spoofing detected! Please present a real face.")

    embedding = face_service.generate_embedding(img)
    if embedding is None:
        raise HTTPException(status_code=400, detail="No face detected in the image.")
        
    # Delete used OTP
    db.delete(otp_req)
    
    # Get or create role
    role = db.query(models.Role).filter(models.Role.name == role_id).first()
    if not role:
        role = models.Role(name=role_id)
        db.add(role)
        db.commit()
        db.refresh(role)
        
    # Get or create department
    dept = None
    if department_id:
        dept = db.query(models.Department).filter(models.Department.name == department_id).first()
        if not dept:
            dept = models.Department(name=department_id)
            db.add(dept)
            db.commit()
            db.refresh(dept)
            
    new_admin = models.Admin(
        full_name=full_name,
        admin_id=admin_id,
        email=email,
        contact_number=contact_number,
        password_hash=security.get_password_hash(password),
        role_id=role.id,
        department_id=dept.id if dept else None
    )
    db.add(new_admin)
    db.commit()
    db.refresh(new_admin)
    
    # Save Embedding
    face_emb = models.FaceEmbedding(
        admin_id=new_admin.id,
        embedding_data=embedding.tobytes(),
        status='active'
    )
    db.add(face_emb)
    db.commit()
    
    return {"message": "Admin registered successfully", "id": new_admin.id}

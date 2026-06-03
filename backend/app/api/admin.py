from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import re
import io
import csv
from datetime import date
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
import numpy as np
import cv2
import secrets
import string

from app.db.database import get_db
from app.db import models
from app.core import security
from app.services import face_service

router = APIRouter()

# ── Schemas ─────────────────────────────────────────────────────────────────
class AdminProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    contact_number: Optional[str] = None
    current_password: Optional[str] = None
    new_password: Optional[str] = None

# ── Profile Endpoints ────────────────────────────────────────────────────────
@router.get("/profile")
def get_admin_profile(current_user = Depends(security.get_current_user), db: Session = Depends(get_db)):
    """Return the logged-in admin's profile data."""
    admin = db.query(models.Admin).filter(models.Admin.id == current_user.id).first()
    if not admin:
        raise HTTPException(status_code=404, detail="Admin not found")
    return {
        "id": admin.id,
        "admin_id": admin.admin_id,
        "full_name": admin.full_name,
        "email": admin.email,
        "contact_number": admin.contact_number,
        "role": admin.role.name if admin.role else None,
        "department": admin.department.name if admin.department else None,
        "is_active": admin.is_active,
        "created_at": admin.created_at,
    }

@router.put("/profile")
def update_admin_profile(
    payload: AdminProfileUpdate,
    current_user = Depends(security.get_current_user),
    db: Session = Depends(get_db)
):
    """Update the logged-in admin's profile (name, email, contact, password)."""
    admin = db.query(models.Admin).filter(models.Admin.id == current_user.id).first()
    if not admin:
        raise HTTPException(status_code=404, detail="Admin not found")

    # Password change requested
    if payload.new_password:
        if not payload.current_password:
            raise HTTPException(status_code=400, detail="Current password is required to set a new password")
        if not security.verify_password(payload.current_password, admin.password_hash):
            raise HTTPException(status_code=400, detail="Current password is incorrect")
        # Enforce strong password rules
        pwd_errors = []
        if len(payload.new_password) < 8:
            pwd_errors.append("at least 8 characters")
        if not re.search(r'[A-Z]', payload.new_password):
            pwd_errors.append("1 uppercase letter (A–Z)")
        if not re.search(r'[a-z]', payload.new_password):
            pwd_errors.append("1 lowercase letter (a–z)")
        if not re.search(r'[0-9]', payload.new_password):
            pwd_errors.append("1 numeric digit (0–9)")
        if not re.search(r'[^A-Za-z0-9]', payload.new_password):
            pwd_errors.append("1 special character (!@#$…)")
        if pwd_errors:
            raise HTTPException(status_code=400, detail="Password must contain: " + ", ".join(pwd_errors))
        admin.password_hash = security.get_password_hash(payload.new_password)

    # Update fields if provided
    if payload.full_name and payload.full_name.strip():
        admin.full_name = payload.full_name.strip()

    if payload.email and payload.email.strip():
        existing = db.query(models.Admin).filter(
            models.Admin.email == payload.email.strip(),
            models.Admin.id != admin.id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email is already in use by another account")
        admin.email = payload.email.strip()

    if payload.contact_number is not None:
        admin.contact_number = payload.contact_number

    db.commit()
    db.refresh(admin)

    # Log audit
    audit = models.AuditLog(
        user_id=admin.id,
        user_type="admin",
        action="Updated own profile",
        ip_address="0.0.0.0"
    )
    db.add(audit)
    db.commit()

    return {
        "message": "Profile updated successfully",
        "full_name": admin.full_name,
        "email": admin.email,
        "contact_number": admin.contact_number,
    }


def require_admin_rights(current_user = Depends(security.require_role(["Super Admin", "Department Admin", "Faculty Admin", "admin", "faculty", "department"]))):
    return current_user

# --- STUDENTS CRUD & SEARCH ---

def generate_credentials():
    # Generate unique roll number / id
    unique_id = "STU" + "".join(secrets.choice(string.digits) for i in range(5))
    # Generate random 8 char password
    password = "".join(secrets.choice(string.ascii_letters + string.digits) for i in range(8))
    return unique_id, password

@router.post("/register-student")
async def register_student(
    full_name: str = Form(...),
    email: str = Form(...),
    contact_number: str = Form(...),
    branch: Optional[str] = Form(None),
    year: Optional[int] = Form(None),
    section: Optional[str] = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    admin = Depends(require_admin_rights)
):
    if db.query(models.Student).filter(models.Student.email == email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
        
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
        
    unique_id, password = generate_credentials()
    # ensure uniqueness
    while db.query(models.Student).filter(models.Student.roll_number == unique_id).first():
        unique_id, password = generate_credentials()
        
    new_student = models.Student(
        full_name=full_name,
        roll_number=unique_id,
        registration_number=unique_id,
        email=email,
        contact_number=contact_number,
        password_hash=security.get_password_hash(password),
        branch=branch,
        year=year,
        section=section
    )
    db.add(new_student)
    db.commit()
    db.refresh(new_student)
    
    new_embedding = models.FaceEmbedding(
        student_id=new_student.id,
        embedding_data=embedding.tobytes(),
        status="active"
    )
    db.add(new_embedding)
    db.commit()
    
    audit = models.AuditLog(
        user_id=admin.id,
        user_type="admin",
        action=f"Registered new student: {new_student.id}",
        ip_address="0.0.0.0"
    )
    db.add(audit)
    db.commit()
    
    return {
        "message": "Student registered successfully", 
        "student_id": new_student.id,
        "credentials": {
            "unique_id": unique_id,
            "password": password
        }
    }

@router.get("/students")
def get_students(
    search: Optional[str] = None,
    branch: Optional[str] = None,
    year: Optional[int] = None,
    section: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    admin = Depends(require_admin_rights)
):
    query = db.query(models.Student)
    
    if search:
        query = query.filter(
            or_(
                models.Student.full_name.ilike(f"%{search}%"),
                models.Student.roll_number.ilike(f"%{search}%"),
                models.Student.email.ilike(f"%{search}%")
            )
        )
    if branch:
        query = query.filter(models.Student.branch == branch)
    if year:
        query = query.filter(models.Student.year == year)
    if section:
        query = query.filter(models.Student.section == section)
        
    students = query.offset(skip).limit(limit).all()
    total = query.count()
    
    return {
        "total": total,
        "items": [{
            "id": s.id,
            "full_name": s.full_name,
            "roll_number": s.roll_number,
            "email": s.email,
            "branch": s.branch,
            "year": s.year,
            "section": s.section,
            "is_active": s.is_active,
            "has_face_registered": any(e.status == 'active' for e in s.face_embeddings)
        } for s in students]
    }

@router.get("/students/{student_id}")
def get_student(student_id: int, db: Session = Depends(get_db), admin = Depends(require_admin_rights)):
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    return {
        "id": student.id,
        "full_name": student.full_name,
        "roll_number": student.roll_number,
        "registration_number": student.registration_number,
        "email": student.email,
        "contact_number": student.contact_number,
        "branch": student.branch,
        "year": student.year,
        "semester": student.semester,
        "section": student.section,
        "gender": student.gender,
        "address": student.address,
        "emergency_contact": student.emergency_contact,
        "is_active": student.is_active,
        "created_at": student.created_at
    }

@router.delete("/students/{student_id}")
def delete_student(student_id: int, db: Session = Depends(get_db), admin = Depends(security.require_role(["Super Admin", "admin"]))):
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    # Soft delete
    student.is_active = False
    
    # Log Audit
    audit = models.AuditLog(
        user_id=admin.id,
        user_type="admin",
        action=f"Soft deleted student {student.id}",
        ip_address="0.0.0.0"
    )
    db.add(audit)
    db.commit()
    
    return {"message": "Student deactivated successfully"}

# --- ADMINS CRUD ---

@router.get("/admins")
def get_admins(db: Session = Depends(get_db), admin = Depends(security.require_role(["Super Admin", "admin"]))):
    admins = db.query(models.Admin).all()
    return [{
        "id": a.id,
        "full_name": a.full_name,
        "admin_id": a.admin_id,
        "email": a.email,
        "role": a.role.name if a.role else "Pending",
        "department": a.department.name if a.department else None,
        "is_active": a.is_active
    } for a in admins]

@router.delete("/admins/{target_id}")
def delete_admin(target_id: int, db: Session = Depends(get_db), admin = Depends(security.require_role(["Super Admin", "admin"]))):
    target = db.query(models.Admin).filter(models.Admin.id == target_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Admin not found")
    
    target.is_active = False
    
    audit = models.AuditLog(
        user_id=admin.id,
        user_type="admin",
        action=f"Deactivated admin {target.id}",
        ip_address="0.0.0.0"
    )
    db.add(audit)
    db.commit()
    return {"message": "Admin deactivated"}

# --- DEPARTMENTS & ROLES ---

@router.get("/departments")
def get_departments(db: Session = Depends(get_db)):
    return db.query(models.Department).all()

@router.get("/roles")
def get_roles(db: Session = Depends(get_db)):
    return db.query(models.Role).all()

# --- AUDIT LOGS ---
@router.get("/audit-logs")
def get_audit_logs(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), admin = Depends(security.require_role(["Super Admin", "admin"]))):
    logs = db.query(models.AuditLog).order_by(models.AuditLog.timestamp.desc()).offset(skip).limit(limit).all()
    return logs

# --- REPORTS ---
@router.get("/export-attendance")
def export_attendance(db: Session = Depends(get_db), admin = Depends(require_admin_rights)):
    today = date.today()
    records = db.query(models.AttendanceRecord, models.Student).join(models.Student).filter(
        models.AttendanceRecord.date == today
    ).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Student ID", "Roll Number", "Name", "Branch", "Year", "Section", "Status", "Time"])

    for record, student in records:
        writer.writerow([
            student.id,
            student.roll_number,
            student.full_name,
            student.branch,
            student.year,
            student.section,
            record.status,
            record.time.strftime("%H:%M:%S") if record.time else ""
        ])

    output.seek(0)
    filename = f"attendance_{today.strftime('%Y-%m-%d')}.csv"
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

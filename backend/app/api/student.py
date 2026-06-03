from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
import numpy as np
import cv2

from app.db.database import get_db
from app.db import models
from app.core import security
from app.services import face_service

router = APIRouter()

def require_student_role(current_user = Depends(security.require_role(["student"]))):
    return current_user

class StudentProfileUpdate(BaseModel):
    email: Optional[str] = None
    address: Optional[str] = None
    section: Optional[str] = None
    emergency_contact: Optional[str] = None

@router.get("/profile")
def get_profile(db: Session = Depends(get_db), current_user = Depends(require_student_role)):
    student = db.query(models.Student).filter(models.Student.id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Check if they have an active face embedding
    has_face = db.query(models.FaceEmbedding).filter(
        models.FaceEmbedding.student_id == student.id,
        models.FaceEmbedding.status == "active"
    ).first() is not None

    return {
        "full_name": student.full_name,
        "roll_number": student.roll_number,
        "registration_number": student.registration_number,
        "contact_number": student.contact_number,
        "branch": student.branch,
        "year": student.year,
        "email": student.email,
        "address": student.address,
        "section": student.section,
        "emergency_contact": student.emergency_contact,
        "gender": student.gender,
        "face_registered": has_face
    }

@router.put("/profile")
def update_profile(
    profile_data: StudentProfileUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(require_student_role)
):
    student = db.query(models.Student).filter(models.Student.id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    if profile_data.email is not None:
        student.email = profile_data.email
    if profile_data.address is not None:
        student.address = profile_data.address
    if profile_data.section is not None:
        student.section = profile_data.section
    if profile_data.emergency_contact is not None:
        student.emergency_contact = profile_data.emergency_contact
        
    db.commit()
    return {"message": "Profile updated successfully"}

@router.post("/face-register")
async def register_face(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    student = Depends(require_student_role)
):
    """
    Receives an image from the webcam during onboarding.
    Checks for liveness (anti-spoofing) and then generates and stores the facial embedding.
    """
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if img is None:
        raise HTTPException(status_code=400, detail="Invalid image file")
        
    # Anti-Spoofing Check
    is_real = face_service.check_liveness(img)
    if not is_real:
        raise HTTPException(status_code=403, detail="Spoofing detected! Please present a real face.")

    # Generate Embedding
    embedding = face_service.generate_embedding(img)
    if embedding is None:
        raise HTTPException(status_code=400, detail="No face detected in the image. Please ensure good lighting.")
        
    # Deactivate old embeddings if any
    old_embeddings = db.query(models.FaceEmbedding).filter(
        models.FaceEmbedding.student_id == student.id, 
        models.FaceEmbedding.status == "active"
    ).all()
    for oe in old_embeddings:
        oe.status = "archived"

    # Store new embedding
    new_embedding = models.FaceEmbedding(
        student_id=student.id,
        embedding_data=embedding.tobytes(),
        status="active"
    )
    db.add(new_embedding)
    
    # Audit log
    audit = models.AuditLog(
        user_id=student.id,
        user_type="student",
        action="Registered new face embedding",
        ip_address="0.0.0.0" # In a real app, grab from Request
    )
    db.add(audit)
    
    db.commit()
    
    return {"message": "Face registered successfully! You can now use Face ID for attendance."}

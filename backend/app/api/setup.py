from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import numpy as np
import cv2

from app.db.database import get_db
from app.db import models
from app.core import security
from app.services import face_service

router = APIRouter()

@router.get("/status")
def get_setup_status(db: Session = Depends(get_db)):
    super_admin_role = db.query(models.Role).filter(models.Role.name == "Super Admin").first()
    if not super_admin_role:
        return {"initialized": False}
    
    super_admin = db.query(models.Admin).filter(models.Admin.role_id == super_admin_role.id).first()
    return {"initialized": super_admin is not None}

@router.post("/initialize")
async def initialize_system(
    full_name: str = Form(...),
    admin_id: str = Form(...),
    email: str = Form(...),
    contact_number: str = Form(...),
    password: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    # Check if already initialized
    super_admin_role = db.query(models.Role).filter(models.Role.name == "Super Admin").first()
    if super_admin_role:
        super_admin = db.query(models.Admin).filter(models.Admin.role_id == super_admin_role.id).first()
        if super_admin:
            raise HTTPException(status_code=400, detail="System is already initialized.")
            
    # Check if email or admin_id is already in use by a regular admin
    if db.query(models.Admin).filter(models.Admin.email == email).first():
        raise HTTPException(status_code=400, detail="Email is already registered in the system.")
    if db.query(models.Admin).filter(models.Admin.admin_id == admin_id).first():
        raise HTTPException(status_code=400, detail="Admin ID is already taken.")
            
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

    if not super_admin_role:
        super_admin_role = models.Role(name="Super Admin", description="System Super Administrator")
        db.add(super_admin_role)
        db.commit()
        db.refresh(super_admin_role)
        
    new_admin = models.Admin(
        full_name=full_name,
        admin_id=admin_id,
        email=email,
        contact_number=contact_number,
        password_hash=security.get_password_hash(password),
        role_id=super_admin_role.id
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
    
    return {"message": "System successfully initialized with Super Admin."}

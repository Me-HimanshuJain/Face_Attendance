from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional
from pydantic import BaseModel

from app.db.database import get_db
from app.db import models
from app.core import security

router = APIRouter()

class LeaveRequestCreate(BaseModel):
    start_date: str
    end_date: str
    leave_type: str
    reason: str

@router.post("/requests")
def create_leave_request(
    request: LeaveRequestCreate, 
    db: Session = Depends(get_db), 
    student = Depends(security.require_role(["student"]))
):
    try:
        start_date = datetime.strptime(request.start_date, "%Y-%m-%d")
        end_date = datetime.strptime(request.end_date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
        
    leave = models.LeaveRequest(
        student_id=student.id,
        start_date=start_date,
        end_date=end_date,
        leave_type=request.leave_type,
        reason=request.reason,
        status="pending"
    )
    db.add(leave)
    db.commit()
    db.refresh(leave)
    
    return {"message": "Leave request submitted successfully", "id": leave.id}

@router.get("/requests/student")
def get_student_leaves(db: Session = Depends(get_db), student = Depends(security.require_role(["student"]))):
    leaves = db.query(models.LeaveRequest).filter(models.LeaveRequest.student_id == student.id).order_by(models.LeaveRequest.created_at.desc()).all()
    return leaves

@router.get("/requests/admin")
def get_all_leaves(db: Session = Depends(get_db), admin = Depends(security.require_role(["admin", "Super Admin", "Department Admin", "Faculty Admin"]))):
    leaves = db.query(models.LeaveRequest).order_by(models.LeaveRequest.created_at.desc()).all()
    return [{
        "id": l.id,
        "student_name": l.student.full_name,
        "roll_number": l.student.roll_number,
        "start_date": l.start_date.strftime("%Y-%m-%d"),
        "end_date": l.end_date.strftime("%Y-%m-%d"),
        "leave_type": l.leave_type,
        "reason": l.reason,
        "status": l.status,
        "created_at": l.created_at.strftime("%Y-%m-%d %H:%M")
    } for l in leaves if l.student]

class LeaveStatusUpdate(BaseModel):
    status: str # "approved" or "rejected"
    admin_comments: Optional[str] = None

@router.put("/requests/{leave_id}")
def update_leave_status(
    leave_id: int, 
    update: LeaveStatusUpdate, 
    db: Session = Depends(get_db), 
    admin = Depends(security.require_role(["admin", "Super Admin", "Department Admin", "Faculty Admin"]))
):
    leave = db.query(models.LeaveRequest).filter(models.LeaveRequest.id == leave_id).first()
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found")
        
    leave.status = update.status
    if update.admin_comments:
        leave.admin_comments = update.admin_comments
    leave.admin_id = admin.id
    
    # Create a notification for the student
    notification = models.Notification(
        title=f"Leave Request {update.status.capitalize()}",
        message=f"Your leave request from {leave.start_date.strftime('%Y-%m-%d')} to {leave.end_date.strftime('%Y-%m-%d')} has been {update.status}.",
        target_type="individual",
        target_id=str(leave.student_id)
    )
    db.add(notification)
    db.commit()
    
    return {"message": f"Leave request marked as {update.status}"}

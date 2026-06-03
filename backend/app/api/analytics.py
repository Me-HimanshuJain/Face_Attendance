from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, date, timedelta

from app.db.database import get_db
from app.db import models
from app.core import security

router = APIRouter()

@router.get("/dashboard-stats")
def get_admin_dashboard_stats(db: Session = Depends(get_db), admin = Depends(security.require_role(["admin", "Super Admin", "Department Admin", "Faculty Admin"]))):
    today = date.today()
    
    # Total Students
    total_students = db.query(models.Student).filter(models.Student.is_active == True).count()
    
    # Present Today
    present_today = db.query(models.AttendanceRecord).filter(
        models.AttendanceRecord.date == today,
        models.AttendanceRecord.status == "Present"
    ).count()
    
    # Pending Leaves
    pending_leaves = db.query(models.LeaveRequest).filter(models.LeaveRequest.status == "pending").count()
    
    # Weekly attendance trend (last 7 days)
    weekly_trend = []
    for i in range(6, -1, -1):
        d = today - timedelta(days=i)
        count = db.query(models.AttendanceRecord).filter(
            models.AttendanceRecord.date == d,
            models.AttendanceRecord.status == "Present"
        ).count()
        weekly_trend.append({"date": d.strftime("%m-%d"), "present": count})
        
    # Department breakdown
    dept_stats = []
    departments = db.query(models.Department).all()
    for d in departments:
        dept_total = db.query(models.Student).filter(models.Student.department_id == d.id).count()
        dept_stats.append({"department": d.name, "students": dept_total})
        
    return {
        "total_students": total_students,
        "present_today": present_today,
        "pending_leaves": pending_leaves,
        "weekly_trend": weekly_trend,
        "department_breakdown": dept_stats
    }

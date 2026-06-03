import os
import sys
from sqlalchemy import text

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.database import SessionLocal, engine
from app.db import models

def reset_data():
    db = SessionLocal()
    try:
        # Tables to clear in reverse dependency order
        tables = [
            models.OTPRequest.__tablename__,
            models.SystemSetting.__tablename__,
            models.AuditLog.__tablename__,
            models.Notification.__tablename__,
            models.LeaveRequest.__tablename__,
            models.AttendanceRequest.__tablename__,
            models.AttendanceRecord.__tablename__,
            models.FaceEmbedding.__tablename__,
            models.Student.__tablename__,
            models.Admin.__tablename__,
            models.Department.__tablename__,
            models.Role.__tablename__,
        ]
        
        for table in tables:
            db.execute(text(f"DELETE FROM {table}"))
        
        db.commit()
        print("Successfully deleted all data from all tables.")
    except Exception as e:
        db.rollback()
        print(f"Error resetting data: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    reset_data()

from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey, LargeBinary, Boolean, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base
import enum

class Role(Base):
    __tablename__ = "roles"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, index=True) # Super Admin, Department Admin, Faculty Admin
    description = Column(String(255))
    admins = relationship("Admin", back_populates="role")

class Department(Base):
    __tablename__ = "departments"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True)
    admins = relationship("Admin", back_populates="department")
    students = relationship("Student", back_populates="department")

class Admin(Base):
    __tablename__ = "admins"
    id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(String(50), unique=True, index=True)
    full_name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True)
    contact_number = Column(String(20))
    password_hash = Column(String(255), nullable=False)
    
    role_id = Column(Integer, ForeignKey("roles.id"))
    role = relationship("Role", back_populates="admins")
    
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    department = relationship("Department", back_populates="admins")
    
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    face_embeddings = relationship("FaceEmbedding", back_populates="admin")

class Student(Base):
    __tablename__ = "students"
    id = Column(Integer, primary_key=True, index=True)
    roll_number = Column(String(50), unique=True, index=True)
    registration_number = Column(String(50), unique=True, index=True)
    full_name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True)
    contact_number = Column(String(20))
    address = Column(Text)
    
    # Academic Info
    branch = Column(String(50))
    year = Column(Integer)
    semester = Column(Integer)
    section = Column(String(10))
    
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    department = relationship("Department", back_populates="students")
    
    gender = Column(String(10))
    emergency_contact = Column(String(20))
    password_hash = Column(String(255), nullable=False)
    
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    face_embeddings = relationship("FaceEmbedding", back_populates="student")
    attendance_records = relationship("AttendanceRecord", back_populates="student")

class FaceEmbedding(Base):
    __tablename__ = "face_embeddings"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=True)
    admin_id = Column(Integer, ForeignKey("admins.id"), nullable=True)
    embedding_data = Column(LargeBinary) # Serialized numpy array
    status = Column(String(20), default="active") # active, archived
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    student = relationship("Student", back_populates="face_embeddings")
    admin = relationship("Admin", back_populates="face_embeddings")

class AttendanceRecord(Base):
    __tablename__ = "attendance_records"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"))
    date = Column(DateTime, default=func.current_date())
    check_in_time = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(String(20)) # Present, Late, Absent
    confidence_score = Column(Float)
    marked_by_admin_id = Column(Integer, ForeignKey("admins.id"), nullable=True) # If manually marked
    
    student = relationship("Student", back_populates="attendance_records")

class AttendanceRequest(Base):
    __tablename__ = "attendance_requests"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"))
    date = Column(DateTime)
    requested_status = Column(String(20))
    reason = Column(Text)
    admin_id = Column(Integer, ForeignKey("admins.id"), nullable=True)
    status = Column(String(20), default="pending") # pending, approved, rejected
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class LeaveRequest(Base):
    __tablename__ = "leave_requests"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"))
    start_date = Column(DateTime)
    end_date = Column(DateTime)
    leave_type = Column(String(50)) # Medical, Emergency, etc.
    reason = Column(Text)
    document_url = Column(String(255), nullable=True)
    admin_id = Column(Integer, ForeignKey("admins.id"), nullable=True)
    status = Column(String(20), default="pending")
    admin_comments = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(100))
    message = Column(Text)
    target_type = Column(String(50)) # global, branch, year, department, individual
    target_id = Column(String(50), nullable=True) # specific ID if applicable
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer) # Can be admin_id or student_id
    user_type = Column(String(20)) # admin, student
    action = Column(String(255))
    ip_address = Column(String(50))
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

class SystemSetting(Base):
    __tablename__ = "system_settings"
    id = Column(Integer, primary_key=True, index=True)
    setting_key = Column(String(100), unique=True, index=True)
    setting_value = Column(String(255))

class OTPRequest(Base):
    __tablename__ = "otp_requests"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(100), index=True)
    otp_code = Column(String(10))
    expires_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

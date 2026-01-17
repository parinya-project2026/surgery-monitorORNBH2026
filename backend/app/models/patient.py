from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date, Time, Text, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum

class PatientType(str, enum.Enum):
    elective = "elective"      # ผู้ป่วยในเวลา
    emergency = "emergency"    # ผู้ป่วยนอกเวลา (ฉุกเฉิน)

class SurgeryStatus(str, enum.Enum):
    waiting = "waiting"           # รอผ่าตัด
    in_surgery = "in_surgery"     # กำลังผ่าตัด
    recovering = "recovering"     # กำลังพักฟื้น
    postponed = "postponed"       # เลื่อนการผ่าตัด
    returning = "returning"       # กำลังส่งกลับตึก

class Gender(str, enum.Enum):
    male = "male"
    female = "female"
    other = "other"

class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    hn = Column(String(20), nullable=False, index=True)  # Hospital Number
    full_name = Column(String(100), nullable=False)
    age = Column(Integer)
    gender = Column(SQLEnum(Gender))
    
    # ข้อมูลการผ่าตัด
    diagnosis = Column(String(255))           # การวินิจฉัย
    operation = Column(String(255))           # ประเภทการผ่าตัด
    surgeon = Column(String(100))             # ศัลยแพทย์
    anesthesiologist = Column(String(100))    # วิสัญญีแพทย์
    or_room = Column(String(20))              # ห้องผ่าตัด (OR1, OR2, etc.)
    
    # ประเภทและสถานะ
    patient_type = Column(SQLEnum(PatientType), nullable=False, default=PatientType.elective)
    status = Column(SQLEnum(SurgeryStatus), default=SurgeryStatus.waiting)
    
    # เวลา
    scheduled_date = Column(Date)             # วันที่นัดผ่าตัด
    scheduled_time = Column(Time)             # เวลานัด
    actual_start_time = Column(DateTime)      # เวลาเริ่มจริง
    actual_end_time = Column(DateTime)        # เวลาเสร็จจริง
    
    # หมายเหตุ
    notes = Column(Text)
    
    # Audit
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"<Patient(id={self.id}, hn='{self.hn}', name='{self.full_name}', status='{self.status}')>"


class StatusHistory(Base):
    """Log การเปลี่ยนสถานะ (สำหรับ PDPA Audit Trail)"""
    __tablename__ = "status_history"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    old_status = Column(String(20))
    new_status = Column(String(20), nullable=False)
    changed_by = Column(Integer, ForeignKey("users.id"))
    changed_at = Column(DateTime(timezone=True), server_default=func.now())
    notes = Column(Text)

    def __repr__(self):
        return f"<StatusHistory(patient_id={self.patient_id}, {self.old_status} -> {self.new_status})>"

from sqlalchemy import Column, Integer, String, Date, DateTime, Enum as SAEnum
from datetime import datetime
from app.database import Base
import enum


class ShiftType(enum.Enum):
    afternoon = "afternoon"  # เวรบ่าย
    night = "night"          # เวรดึก


class WorkSchedule(Base):
    """ตารางปฏิบัติงานประจำวัน (เวรบ่าย/ดึก)"""
    __tablename__ = "work_schedules"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False, index=True)
    shift_type = Column(SAEnum(ShiftType), nullable=False)
    
    # หัวหน้าเวร (Incharge) - 1 คน
    incharge = Column(String(100), nullable=True)
    
    # พยาบาลวิชาชีพ - 6 คน
    nurse_1 = Column(String(100), nullable=True)
    nurse_2 = Column(String(100), nullable=True)
    nurse_3 = Column(String(100), nullable=True)
    nurse_4 = Column(String(100), nullable=True)
    nurse_5 = Column(String(100), nullable=True)
    nurse_6 = Column(String(100), nullable=True)
    
    # พนักงานผู้ช่วย - 2 คน
    assistant_1 = Column(String(100), nullable=True)
    assistant_2 = Column(String(100), nullable=True)
    
    # คนงาน - 3 คน
    worker_1 = Column(String(100), nullable=True)
    worker_2 = Column(String(100), nullable=True)
    worker_3 = Column(String(100), nullable=True)
    
    # เวร Key (ใช้รายชื่อเดียวกับพนักงานผู้ช่วย)
    key_person = Column(String(100), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

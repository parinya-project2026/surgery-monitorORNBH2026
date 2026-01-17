from sqlalchemy import Column, Integer, String, Text, Date, Time, Enum, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.database import Base
import enum


class SurgeryTypeEnum(str, enum.Enum):
    ELECTIVE = "elective"
    EMERGENCY = "emergency"


class CaseSizeEnum(str, enum.Enum):
    MAJOR = "Major"
    MINOR = "Minor"


class SurgeryStatusEnum(str, enum.Enum):
    REGISTERED = "registered"
    WAITING = "waiting"
    IN_SURGERY = "in_surgery"
    RECOVERY = "recovery"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    NOT_READY = "not_ready"


class SurgeryRegistration(Base):
    __tablename__ = "surgery_registrations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    
    # Patient Information
    hn = Column(String(20), nullable=False, comment="Hospital Number")
    patient_name = Column(String(255), nullable=False, comment="ชื่อ-สกุล")
    age = Column(Integer, nullable=True, default=0, comment="อายุ (ปี)")
    
    # Surgery Schedule - now nullable to allow import with incomplete data
    surgery_date = Column(Date, nullable=True, comment="วันที่ผ่าตัด")
    scheduled_time = Column(Time, nullable=True, comment="เวลาสั่งผ่าตัด")
    surgery_type = Column(
        Enum(SurgeryTypeEnum, values_callable=lambda x: [e.value for e in x]),
        nullable=True,
        default=SurgeryTypeEnum.ELECTIVE,
        comment="ประเภท: elective=ในเวลา, emergency=นอกเวลา"
    )
    or_room = Column(String(20), nullable=True, comment="ห้องผ่าตัด")
    
    # Medical Information - now nullable to allow import with incomplete data
    department = Column(String(50), nullable=True, comment="แผนก")
    surgeon = Column(String(100), nullable=True, comment="แพทย์ผู้สั่ง")
    diagnosis = Column(Text, nullable=True, comment="การวินิจฉัยเบื้องต้น")
    operation = Column(Text, nullable=True, comment="ชื่อการผ่าตัด")
    ward = Column(String(100), nullable=True, comment="หอผู้ป่วย")
    case_size = Column(
        Enum(CaseSizeEnum, values_callable=lambda x: [e.value for e in x]),
        nullable=True,
        comment="ขนาดเคส"
    )
    
    # Actual Surgery Times (Optional)
    start_time = Column(Time, nullable=True, comment="เวลาเริ่มผ่าตัดจริง")
    end_time = Column(Time, nullable=True, comment="เวลาเสร็จผ่าตัด")
    
    # Nursing Staff (Optional)
    assist1 = Column(String(100), nullable=True, comment="พยาบาล Assist 1")
    assist2 = Column(String(100), nullable=True, comment="พยาบาล Assist 2")
    scrub_nurse = Column(String(100), nullable=True, comment="Scrub Nurse")
    circulate_nurse = Column(String(100), nullable=True, comment="Circulate Nurse")
    
    # Queue Management
    queue_order = Column(Integer, nullable=True, comment="ลำดับคิว")
    selected_or = Column(String(20), nullable=True, comment="ห้องผ่าตัดที่เลือก (Emergency)")
    
    # Status
    status = Column(
        Enum(SurgeryStatusEnum, values_callable=lambda x: [e.value for e in x]),
        default=SurgeryStatusEnum.REGISTERED,
        comment="สถานะ"
    )
    not_ready_reason = Column(String(100), nullable=True, comment="สาเหตุไม่พร้อม")
    
    # Metadata
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

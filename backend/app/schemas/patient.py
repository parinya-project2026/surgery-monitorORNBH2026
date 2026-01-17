from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, date, time
from app.models.patient import PatientType, SurgeryStatus, Gender

# Base schema for Patient
class PatientBase(BaseModel):
    hn: str = Field(..., min_length=1, max_length=20, description="Hospital Number")
    full_name: str = Field(..., min_length=1, max_length=100)
    age: Optional[int] = Field(None, ge=0, le=150)
    gender: Optional[Gender] = None
    diagnosis: Optional[str] = Field(None, max_length=255)
    operation: Optional[str] = Field(None, max_length=255)
    surgeon: Optional[str] = Field(None, max_length=100)
    anesthesiologist: Optional[str] = Field(None, max_length=100)
    or_room: Optional[str] = Field(None, max_length=20)
    patient_type: PatientType = PatientType.elective
    scheduled_date: Optional[date] = None
    scheduled_time: Optional[time] = None
    notes: Optional[str] = None

# Schema for creating a new patient
class PatientCreate(PatientBase):
    pass

# Schema for updating a patient
class PatientUpdate(BaseModel):
    hn: Optional[str] = None
    full_name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[Gender] = None
    diagnosis: Optional[str] = None
    operation: Optional[str] = None
    surgeon: Optional[str] = None
    anesthesiologist: Optional[str] = None
    or_room: Optional[str] = None
    patient_type: Optional[PatientType] = None
    scheduled_date: Optional[date] = None
    scheduled_time: Optional[time] = None
    notes: Optional[str] = None

# Schema for updating status only
class PatientStatusUpdate(BaseModel):
    status: SurgeryStatus
    notes: Optional[str] = None

# Schema for returning patient data
class PatientResponse(PatientBase):
    id: int
    status: SurgeryStatus
    actual_start_time: Optional[datetime] = None
    actual_end_time: Optional[datetime] = None
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Schema for public display (masked data for PDPA)
class PatientPublicDisplay(BaseModel):
    or_room: Optional[str]
    hn_masked: str  # แสดงแค่ 3 ตัวท้าย เช่น ***123
    name_masked: str  # แสดงแค่นามสกุล เช่น นาย***
    status: SurgeryStatus
    status_thai: str  # สถานะภาษาไทย

    class Config:
        from_attributes = True

# Schema for status history
class StatusHistoryResponse(BaseModel):
    id: int
    patient_id: int
    old_status: Optional[str]
    new_status: str
    changed_by: Optional[int]
    changed_at: datetime
    notes: Optional[str]

    class Config:
        from_attributes = True

# Schema for statistics
class DashboardStats(BaseModel):
    total_today: int = 0
    waiting: int = 0
    in_surgery: int = 0
    recovering: int = 0
    postponed: int = 0
    returning: int = 0
    elective_count: int = 0
    emergency_count: int = 0

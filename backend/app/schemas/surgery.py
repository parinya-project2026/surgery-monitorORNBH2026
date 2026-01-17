from pydantic import BaseModel, Field
from typing import Optional
from datetime import date, time, datetime
from enum import Enum


class SurgeryTypeSchema(str, Enum):
    elective = "elective"
    emergency = "emergency"


class CaseSizeSchema(str, Enum):
    Major = "Major"
    Minor = "Minor"


class SurgeryStatusSchema(str, Enum):
    registered = "registered"
    waiting = "waiting"
    in_surgery = "in_surgery"
    recovery = "recovery"
    completed = "completed"
    cancelled = "cancelled"
    not_ready = "not_ready"


class SurgeryCreate(BaseModel):
    hn: str = Field(..., max_length=9, description="Hospital Number (9 digits)")
    patient_name: str = Field(..., max_length=255)
    age: Optional[int] = Field(None, ge=0, le=150)
    surgery_date: Optional[date] = None
    scheduled_time: Optional[str] = Field(None, description="Time in HH:MM format")
    surgery_type: Optional[SurgeryTypeSchema] = SurgeryTypeSchema.elective
    or_room: Optional[str] = None
    department: Optional[str] = None
    surgeon: Optional[str] = None
    diagnosis: Optional[str] = None
    operation: Optional[str] = None
    ward: Optional[str] = None
    case_size: Optional[CaseSizeSchema] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    assist1: Optional[str] = None
    assist2: Optional[str] = None
    scrub_nurse: Optional[str] = None
    circulate_nurse: Optional[str] = None


class SurgeryUpdate(BaseModel):
    or_room: Optional[str] = None
    status: Optional[SurgeryStatusSchema] = None
    not_ready_reason: Optional[str] = None
    queue_order: Optional[int] = None
    selected_or: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None


class SurgeryResponse(BaseModel):
    id: int
    hn: str
    patient_name: str
    age: int
    surgery_date: date
    scheduled_time: str
    surgery_type: str
    or_room: str
    department: str
    surgeon: str
    diagnosis: str
    operation: str
    ward: str
    case_size: str
    start_time: Optional[str]
    end_time: Optional[str]
    assist1: Optional[str]
    assist2: Optional[str]
    scrub_nurse: Optional[str]
    circulate_nurse: Optional[str]
    queue_order: Optional[int]
    selected_or: Optional[str]
    status: str
    not_ready_reason: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class SurgeryBulkCreate(BaseModel):
    registrations: list[SurgeryCreate]

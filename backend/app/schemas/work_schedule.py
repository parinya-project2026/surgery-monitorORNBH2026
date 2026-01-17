from pydantic import BaseModel
from typing import Optional
from datetime import date
from enum import Enum


class ShiftTypeEnum(str, Enum):
    afternoon = "afternoon"
    night = "night"


class WorkScheduleCreate(BaseModel):
    date: date
    shift_type: ShiftTypeEnum
    incharge: Optional[str] = None
    nurse_1: Optional[str] = None
    nurse_2: Optional[str] = None
    nurse_3: Optional[str] = None
    nurse_4: Optional[str] = None
    nurse_5: Optional[str] = None
    nurse_6: Optional[str] = None
    assistant_1: Optional[str] = None
    assistant_2: Optional[str] = None
    worker_1: Optional[str] = None
    worker_2: Optional[str] = None
    worker_3: Optional[str] = None
    key_person: Optional[str] = None


class WorkScheduleResponse(BaseModel):
    id: int
    date: date
    shift_type: ShiftTypeEnum
    incharge: Optional[str] = None
    nurse_1: Optional[str] = None
    nurse_2: Optional[str] = None
    nurse_3: Optional[str] = None
    nurse_4: Optional[str] = None
    nurse_5: Optional[str] = None
    nurse_6: Optional[str] = None
    assistant_1: Optional[str] = None
    assistant_2: Optional[str] = None
    worker_1: Optional[str] = None
    worker_2: Optional[str] = None
    worker_3: Optional[str] = None
    key_person: Optional[str] = None

    class Config:
        from_attributes = True

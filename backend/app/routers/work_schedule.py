from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, extract
from datetime import date
from typing import List

from app.database import get_db
from app.models.work_schedule import WorkSchedule, ShiftType
from app.schemas.work_schedule import WorkScheduleCreate, WorkScheduleResponse, ShiftTypeEnum

router = APIRouter(prefix="/api/work-schedule", tags=["Work Schedule"])


@router.post("/", response_model=WorkScheduleResponse, status_code=status.HTTP_201_CREATED)
async def create_or_update_work_schedule(data: WorkScheduleCreate, db: Session = Depends(get_db)):
    """
    สร้างหรืออัปเดตตารางเวร (ถ้ามีเวรซ้ำในวันเดียวกันจะอัปเดตแทน)
    """
    # Check for existing schedule on the same date and shift
    existing = db.query(WorkSchedule).filter(
        and_(
            WorkSchedule.date == data.date,
            WorkSchedule.shift_type == ShiftType(data.shift_type.value)
        )
    ).first()
    
    if existing:
        # Update existing record
        for field, value in data.model_dump(exclude={'date', 'shift_type'}).items():
            setattr(existing, field, value)
        db.commit()
        db.refresh(existing)
        return existing
    else:
        # Create new record
        new_schedule = WorkSchedule(
            date=data.date,
            shift_type=ShiftType(data.shift_type.value),
            incharge=data.incharge,
            nurse_1=data.nurse_1,
            nurse_2=data.nurse_2,
            nurse_3=data.nurse_3,
            nurse_4=data.nurse_4,
            nurse_5=data.nurse_5,
            nurse_6=data.nurse_6,
            assistant_1=data.assistant_1,
            assistant_2=data.assistant_2,
            worker_1=data.worker_1,
            worker_2=data.worker_2,
            key_person=data.key_person,
        )
        db.add(new_schedule)
        db.commit()
        db.refresh(new_schedule)
        return new_schedule


@router.get("/{schedule_date}", response_model=List[WorkScheduleResponse])
async def get_schedules_by_date(schedule_date: date, db: Session = Depends(get_db)):
    """
    ดึงตารางเวรตามวันที่ (ทั้งเวรบ่ายและดึก)
    """
    schedules = db.query(WorkSchedule).filter(
        WorkSchedule.date == schedule_date
    ).all()
    return schedules


@router.get("/{schedule_date}/{shift_type}", response_model=WorkScheduleResponse)
async def get_schedule_by_date_and_shift(
    schedule_date: date, 
    shift_type: ShiftTypeEnum, 
    db: Session = Depends(get_db)
):
    """
    ดึงตารางเวรตามวันที่และประเภทเวร
    """
    schedule = db.query(WorkSchedule).filter(
        and_(
            WorkSchedule.date == schedule_date,
            WorkSchedule.shift_type == ShiftType(shift_type.value)
        )
    ).first()
    
    if not schedule:
        raise HTTPException(status_code=404, detail="ไม่พบข้อมูลเวรในวันที่กำหนด")
    return schedule


@router.get("/month/{year}/{month}", response_model=List[WorkScheduleResponse])
async def get_schedules_by_month(year: int, month: int, db: Session = Depends(get_db)):
    """
    ดึงตารางเวรทั้งเดือน (สำหรับแสดงปฏิทิน)
    """
    schedules = db.query(WorkSchedule).filter(
        and_(
            extract('year', WorkSchedule.date) == year,
            extract('month', WorkSchedule.date) == month
        )
    ).order_by(WorkSchedule.date).all()
    return schedules


@router.delete("/{schedule_id}", status_code=status.HTTP_200_OK)
async def delete_schedule(schedule_id: int, db: Session = Depends(get_db)):
    """
    ลบตารางเวร
    """
    schedule = db.query(WorkSchedule).filter(WorkSchedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="ไม่พบข้อมูลเวร")
    
    db.delete(schedule)
    db.commit()
    return {"message": "ลบข้อมูลเวรเรียบร้อยแล้ว"}

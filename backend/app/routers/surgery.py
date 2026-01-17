from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List
from datetime import date, datetime, time

from app.database import get_db
from app.models.surgery import SurgeryRegistration, SurgeryTypeEnum, SurgeryStatusEnum
from app.schemas.surgery import (
    SurgeryCreate,
    SurgeryUpdate,
    SurgeryResponse,
    SurgeryBulkCreate,
)

router = APIRouter(prefix="/api/surgery", tags=["surgery"])


def time_str_to_time(time_str: str) -> time:
    """Convert time string (HH:MM or HH:MM:SS) to time object"""
    if not time_str:
        return None
    parts = time_str.split(":")
    if len(parts) == 2:
        return time(int(parts[0]), int(parts[1]))
    elif len(parts) == 3:
        return time(int(parts[0]), int(parts[1]), int(parts[2]))
    return None


def time_to_str(t: time) -> str:
    """Convert time object to string"""
    if not t:
        return None
    return t.strftime("%H:%M")


def get_enum_value_safe(val):
    """Safely get value from enum or return string as-is"""
    if val is None:
        return None
    if hasattr(val, 'value'):
        return val.value
    return str(val)


def surgery_to_response(surgery: SurgeryRegistration) -> dict:
    """Convert SurgeryRegistration model to response dict"""
    return {
        "id": surgery.id,
        "hn": surgery.hn,
        "patient_name": surgery.patient_name,
        "age": surgery.age,
        "surgery_date": surgery.surgery_date.isoformat() if surgery.surgery_date else None,
        "scheduled_time": time_to_str(surgery.scheduled_time),
        "surgery_type": get_enum_value_safe(surgery.surgery_type),
        "or_room": surgery.or_room,
        "department": surgery.department,
        "surgeon": surgery.surgeon,
        "diagnosis": surgery.diagnosis,
        "operation": surgery.operation,
        "ward": surgery.ward,
        "case_size": get_enum_value_safe(surgery.case_size),
        "start_time": time_to_str(surgery.start_time),
        "end_time": time_to_str(surgery.end_time),
        "assist1": surgery.assist1,
        "assist2": surgery.assist2,
        "scrub_nurse": surgery.scrub_nurse,
        "circulate_nurse": surgery.circulate_nurse,
        "queue_order": surgery.queue_order,
        "selected_or": surgery.selected_or,
        "status": get_enum_value_safe(surgery.status),
        "not_ready_reason": surgery.not_ready_reason,
        "created_at": surgery.created_at.isoformat() if surgery.created_at else None,
    }


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def create_surgery(surgery: SurgeryCreate, db: Session = Depends(get_db)):
    """Register a new surgery"""
    try:
        new_surgery = SurgeryRegistration(
            hn=surgery.hn,
            patient_name=surgery.patient_name,
            age=surgery.age,
            surgery_date=surgery.surgery_date,
            scheduled_time=time_str_to_time(surgery.scheduled_time),
            surgery_type=SurgeryTypeEnum(surgery.surgery_type.value),
            or_room=surgery.or_room,
            department=surgery.department,
            surgeon=surgery.surgeon,
            diagnosis=surgery.diagnosis,
            operation=surgery.operation,
            ward=surgery.ward,
            case_size=surgery.case_size.value,
            start_time=time_str_to_time(surgery.start_time) if surgery.start_time else None,
            end_time=time_str_to_time(surgery.end_time) if surgery.end_time else None,
            assist1=surgery.assist1,
            assist2=surgery.assist2,
            scrub_nurse=surgery.scrub_nurse,
            circulate_nurse=surgery.circulate_nurse,
            status=SurgeryStatusEnum.REGISTERED,
        )
        db.add(new_surgery)
        db.commit()
        db.refresh(new_surgery)
        return surgery_to_response(new_surgery)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/register/bulk", status_code=status.HTTP_201_CREATED)
async def create_surgeries_bulk(data: SurgeryBulkCreate, db: Session = Depends(get_db)):
    """Register multiple surgeries at once"""
    created = []
    try:
        for surgery in data.registrations:
            # Handle optional surgery_type with default
            surgery_type_val = SurgeryTypeEnum.ELECTIVE
            if surgery.surgery_type:
                surgery_type_val = SurgeryTypeEnum(surgery.surgery_type.value)
            
            # Handle optional case_size
            case_size_val = None
            if surgery.case_size:
                case_size_val = surgery.case_size.value
            
            # Use today's date if not provided
            surgery_date_val = surgery.surgery_date or date.today()
            
            new_surgery = SurgeryRegistration(
                hn=surgery.hn,
                patient_name=surgery.patient_name,
                age=surgery.age or 0,
                surgery_date=surgery_date_val,
                scheduled_time=time_str_to_time(surgery.scheduled_time) if surgery.scheduled_time else None,
                surgery_type=surgery_type_val,
                or_room=surgery.or_room or '',
                department=surgery.department or '',
                surgeon=surgery.surgeon or '',
                diagnosis=surgery.diagnosis or '',
                operation=surgery.operation or '',
                ward=surgery.ward or '',
                case_size=case_size_val,
                start_time=time_str_to_time(surgery.start_time) if surgery.start_time else None,
                end_time=time_str_to_time(surgery.end_time) if surgery.end_time else None,
                assist1=surgery.assist1,
                assist2=surgery.assist2,
                scrub_nurse=surgery.scrub_nurse,
                circulate_nurse=surgery.circulate_nurse,
                status=SurgeryStatusEnum.REGISTERED,
            )
            db.add(new_surgery)
            created.append(new_surgery)
        
        db.commit()
        
        for s in created:
            db.refresh(s)
        
        return {
            "message": f"สร้างรายการผ่าตัดสำเร็จ {len(created)} รายการ",
            "count": len(created),
            "registrations": [surgery_to_response(s) for s in created]
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/check-hn/{hn}")
async def check_patient_by_hn(hn: str, db: Session = Depends(get_db)):
    """
    Check if patient exists by HN and return surgery history.
    Used for duplicate patient detection during registration.
    """
    try:
        surgeries = db.query(SurgeryRegistration).filter(
            SurgeryRegistration.hn == hn
        ).order_by(SurgeryRegistration.surgery_date.desc()).all()
        
        if not surgeries:
            return {
                "exists": False,
                "patient": None,
                "history": []
            }
        
        # Get latest patient info
        latest = surgeries[0]
        
        # Convert each surgery to response format
        history = []
        for s in surgeries:
            try:
                history.append(surgery_to_response(s))
            except Exception as e:
                print(f"Error converting surgery {s.id}: {str(e)}")
                # Add minimal info if conversion fails
                history.append({
                    "id": s.id,
                    "surgery_date": s.surgery_date.isoformat() if s.surgery_date else None,
                    "operation": s.operation,
                    "surgeon": s.surgeon,
                    "status": s.status.value if s.status else None
                })
        
        return {
            "exists": True,
            "patient": {
                "hn": latest.hn,
                "patient_name": latest.patient_name,
                "age": latest.age
            },
            "history": history
        }
    except Exception as e:
        print(f"Error in check_patient_by_hn: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/today")
async def get_today_surgeries(db: Session = Depends(get_db)):
    """Get all surgeries for today"""
    today = date.today()
    surgeries = db.query(SurgeryRegistration).filter(
        SurgeryRegistration.surgery_date == today
    ).order_by(SurgeryRegistration.scheduled_time).all()
    
    return [surgery_to_response(s) for s in surgeries]


@router.get("/date/{surgery_date}")
async def get_surgeries_by_date(surgery_date: date, db: Session = Depends(get_db)):
    """Get all surgeries for a specific date"""
    surgeries = db.query(SurgeryRegistration).filter(
        SurgeryRegistration.surgery_date == surgery_date
    ).order_by(SurgeryRegistration.scheduled_time).all()
    
    return [surgery_to_response(s) for s in surgeries]


@router.get("/elective/{surgery_date}")
async def get_elective_surgeries(surgery_date: date, db: Session = Depends(get_db)):
    """Get elective surgeries for a specific date"""
    surgeries = db.query(SurgeryRegistration).filter(
        and_(
            SurgeryRegistration.surgery_date == surgery_date,
            SurgeryRegistration.surgery_type == SurgeryTypeEnum.ELECTIVE
        )
    ).order_by(SurgeryRegistration.scheduled_time).all()
    
    return [surgery_to_response(s) for s in surgeries]


@router.get("/emergency/{surgery_date}")
async def get_emergency_surgeries(surgery_date: date, db: Session = Depends(get_db)):
    """Get emergency surgeries for a specific date"""
    surgeries = db.query(SurgeryRegistration).filter(
        and_(
            SurgeryRegistration.surgery_date == surgery_date,
            SurgeryRegistration.surgery_type == SurgeryTypeEnum.EMERGENCY
        )
    ).order_by(SurgeryRegistration.scheduled_time).all()
    
    return [surgery_to_response(s) for s in surgeries]


@router.get("/{surgery_id}")
async def get_surgery(surgery_id: int, db: Session = Depends(get_db)):
    """Get a specific surgery by ID"""
    surgery = db.query(SurgeryRegistration).filter(
        SurgeryRegistration.id == surgery_id
    ).first()
    
    if not surgery:
        raise HTTPException(status_code=404, detail="Surgery not found")
    
    return surgery_to_response(surgery)


@router.patch("/{surgery_id}")
async def update_surgery(surgery_id: int, data: SurgeryUpdate, db: Session = Depends(get_db)):
    """Update a surgery (status, queue order, OR room, etc.)"""
    surgery = db.query(SurgeryRegistration).filter(
        SurgeryRegistration.id == surgery_id
    ).first()
    
    if not surgery:
        raise HTTPException(status_code=404, detail="Surgery not found")
    
    try:
        if data.or_room is not None:
            surgery.or_room = data.or_room
        if data.status is not None:
            surgery.status = SurgeryStatusEnum(data.status.value)
        if data.not_ready_reason is not None:
            surgery.not_ready_reason = data.not_ready_reason
        if data.queue_order is not None:
            surgery.queue_order = data.queue_order
        if data.selected_or is not None:
            surgery.selected_or = data.selected_or
        if data.start_time is not None:
            surgery.start_time = time_str_to_time(data.start_time)
        if data.end_time is not None:
            surgery.end_time = time_str_to_time(data.end_time)
        
        db.commit()
        db.refresh(surgery)
        return surgery_to_response(surgery)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{surgery_id}")
async def delete_surgery(surgery_id: int, db: Session = Depends(get_db)):
    """Delete a surgery"""
    surgery = db.query(SurgeryRegistration).filter(
        SurgeryRegistration.id == surgery_id
    ).first()
    
    if not surgery:
        raise HTTPException(status_code=404, detail="Surgery not found")
    
    try:
        db.delete(surgery)
        db.commit()
        return {"message": "Surgery deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/reset/all", status_code=status.HTTP_200_OK)
async def reset_all_data(db: Session = Depends(get_db)):
    """
    [DEV ONLY] Delete ALL surgery registrations.
    Used for resetting the system during testing.
    """
    try:
        # Delete all records
        db.query(SurgeryRegistration).delete()
        db.commit()
        return {"message": "All surgery data has been reset successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

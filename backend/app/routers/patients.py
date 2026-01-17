from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, datetime
from app.database import get_db
from app.models.user import User
from app.models.patient import Patient, StatusHistory, SurgeryStatus, PatientType
from app.schemas.patient import (
    PatientCreate,
    PatientUpdate,
    PatientStatusUpdate,
    PatientResponse,
    PatientPublicDisplay,
    DashboardStats,
)
from app.utils.security import get_current_user

router = APIRouter(prefix="/patients", tags=["Patients"])

# Helper function to convert status to Thai
def status_to_thai(status: SurgeryStatus) -> str:
    status_map = {
        SurgeryStatus.waiting: "รอผ่าตัด",
        SurgeryStatus.in_surgery: "กำลังผ่าตัด",
        SurgeryStatus.recovering: "กำลังพักฟื้น",
        SurgeryStatus.postponed: "เลื่อนการผ่าตัด",
        SurgeryStatus.returning: "กำลังส่งกลับตึก",
    }
    return status_map.get(status, str(status))

# Helper function to mask HN for public display
def mask_hn(hn: str) -> str:
    if len(hn) <= 3:
        return "***" + hn
    return "***" + hn[-3:]

# Helper function to mask name for public display
def mask_name(full_name: str) -> str:
    parts = full_name.split()
    if len(parts) >= 2:
        return parts[0][:3] + "***"
    return full_name[:3] + "***" if len(full_name) > 3 else full_name

@router.get("/", response_model=List[PatientResponse])
async def get_patients(
    patient_type: Optional[PatientType] = None,
    status: Optional[SurgeryStatus] = None,
    scheduled_date: Optional[date] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all patients with optional filters"""
    query = db.query(Patient)
    
    if patient_type:
        query = query.filter(Patient.patient_type == patient_type)
    if status:
        query = query.filter(Patient.status == status)
    if scheduled_date:
        query = query.filter(Patient.scheduled_date == scheduled_date)
    
    patients = query.order_by(Patient.scheduled_date.desc(), Patient.scheduled_time).offset(skip).limit(limit).all()
    return patients

@router.get("/today", response_model=List[PatientResponse])
async def get_today_patients(
    patient_type: Optional[PatientType] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all patients scheduled for today"""
    today = date.today()
    query = db.query(Patient).filter(Patient.scheduled_date == today)
    
    if patient_type:
        query = query.filter(Patient.patient_type == patient_type)
    
    patients = query.order_by(Patient.scheduled_time).all()
    return patients

@router.get("/public", response_model=List[PatientPublicDisplay])
async def get_public_display(db: Session = Depends(get_db)):
    """Get patients for public TV display (masked data for PDPA)"""
    today = date.today()
    patients = db.query(Patient).filter(
        Patient.scheduled_date == today,
        Patient.status.in_([
            SurgeryStatus.waiting,
            SurgeryStatus.in_surgery,
            SurgeryStatus.recovering,
            SurgeryStatus.returning
        ])
    ).order_by(Patient.or_room).all()
    
    result = []
    for p in patients:
        result.append(PatientPublicDisplay(
            or_room=p.or_room,
            hn_masked=mask_hn(p.hn),
            name_masked=mask_name(p.full_name),
            status=p.status,
            status_thai=status_to_thai(p.status)
        ))
    return result

@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get dashboard statistics for today"""
    today = date.today()
    
    # Count by status
    stats = DashboardStats(
        total_today=db.query(Patient).filter(Patient.scheduled_date == today).count(),
        waiting=db.query(Patient).filter(Patient.scheduled_date == today, Patient.status == SurgeryStatus.waiting).count(),
        in_surgery=db.query(Patient).filter(Patient.scheduled_date == today, Patient.status == SurgeryStatus.in_surgery).count(),
        recovering=db.query(Patient).filter(Patient.scheduled_date == today, Patient.status == SurgeryStatus.recovering).count(),
        postponed=db.query(Patient).filter(Patient.scheduled_date == today, Patient.status == SurgeryStatus.postponed).count(),
        returning=db.query(Patient).filter(Patient.scheduled_date == today, Patient.status == SurgeryStatus.returning).count(),
        elective_count=db.query(Patient).filter(Patient.scheduled_date == today, Patient.patient_type == PatientType.elective).count(),
        emergency_count=db.query(Patient).filter(Patient.scheduled_date == today, Patient.patient_type == PatientType.emergency).count(),
    )
    return stats

@router.get("/{patient_id}", response_model=PatientResponse)
async def get_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific patient by ID"""
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient

@router.post("/", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
async def create_patient(
    patient_data: PatientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new patient"""
    db_patient = Patient(
        **patient_data.model_dump(),
        created_by=current_user.id
    )
    db.add(db_patient)
    db.commit()
    db.refresh(db_patient)
    return db_patient

@router.put("/{patient_id}", response_model=PatientResponse)
async def update_patient(
    patient_id: int,
    patient_data: PatientUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a patient"""
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    update_data = patient_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(patient, field, value)
    
    db.commit()
    db.refresh(patient)
    return patient

@router.patch("/{patient_id}/status", response_model=PatientResponse)
async def update_patient_status(
    patient_id: int,
    status_data: PatientStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update only the status of a patient (for quick status changes)"""
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    old_status = patient.status
    new_status = status_data.status
    
    # Update timestamps based on status
    if new_status == SurgeryStatus.in_surgery and patient.actual_start_time is None:
        patient.actual_start_time = datetime.now()
    elif new_status in [SurgeryStatus.recovering, SurgeryStatus.returning] and patient.actual_end_time is None:
        patient.actual_end_time = datetime.now()
    
    patient.status = new_status
    
    # Log status change for PDPA audit
    status_log = StatusHistory(
        patient_id=patient_id,
        old_status=old_status.value if old_status else None,
        new_status=new_status.value,
        changed_by=current_user.id,
        notes=status_data.notes
    )
    db.add(status_log)
    
    db.commit()
    db.refresh(patient)
    return patient

@router.delete("/{patient_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a patient"""
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Delete related status history first
    db.query(StatusHistory).filter(StatusHistory.patient_id == patient_id).delete()
    
    db.delete(patient)
    db.commit()
    return None

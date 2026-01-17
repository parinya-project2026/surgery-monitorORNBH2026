from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import pandas as pd
import io
from datetime import datetime
from app.database import get_db
from app.models.user import User
from app.models.patient import Patient, PatientType
from app.schemas.patient import PatientResponse
from app.utils.security import get_current_user

router = APIRouter(prefix="/import", tags=["Import/Export"])

@router.post("/excel", response_model=List[PatientResponse])
async def import_from_excel(
    file: UploadFile = File(...),
    patient_type: PatientType = PatientType.elective,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Import patients from Excel or CSV file"""
    
    # Check file extension
    filename = file.filename.lower()
    if not (filename.endswith('.xlsx') or filename.endswith('.xls') or filename.endswith('.csv')):
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Please upload .xlsx, .xls, or .csv file"
        )
    
    try:
        contents = await file.read()
        
        # Read file based on type
        if filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(contents))
        else:
            df = pd.read_excel(io.BytesIO(contents))
        
        # Expected columns (case-insensitive)
        df.columns = df.columns.str.lower().str.strip()
        
        # Column mapping (Thai to English)
        column_mapping = {
            'hn': 'hn',
            'รหัส': 'hn',
            'รหัสผู้ป่วย': 'hn',
            'ชื่อ': 'full_name',
            'ชื่อ-สกุล': 'full_name',
            'full_name': 'full_name',
            'name': 'full_name',
            'อายุ': 'age',
            'age': 'age',
            'เพศ': 'gender',
            'gender': 'gender',
            'การวินิจฉัย': 'diagnosis',
            'diagnosis': 'diagnosis',
            'การผ่าตัด': 'operation',
            'operation': 'operation',
            'ศัลยแพทย์': 'surgeon',
            'surgeon': 'surgeon',
            'วิสัญญี': 'anesthesiologist',
            'anesthesiologist': 'anesthesiologist',
            'ห้องผ่าตัด': 'or_room',
            'or_room': 'or_room',
            'or': 'or_room',
            'วันที่': 'scheduled_date',
            'scheduled_date': 'scheduled_date',
            'date': 'scheduled_date',
            'เวลา': 'scheduled_time',
            'scheduled_time': 'scheduled_time',
            'time': 'scheduled_time',
            'หมายเหตุ': 'notes',
            'notes': 'notes',
        }
        
        # Rename columns based on mapping
        df = df.rename(columns={k: v for k, v in column_mapping.items() if k in df.columns})
        
        # Validate required columns
        required_columns = ['hn', 'full_name']
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            raise HTTPException(
                status_code=400,
                detail=f"Missing required columns: {', '.join(missing_columns)}. Please check your file."
            )
        
        imported_patients = []
        
        for _, row in df.iterrows():
            # Skip empty rows
            if pd.isna(row.get('hn')) or pd.isna(row.get('full_name')):
                continue
            
            # Parse date if present
            scheduled_date = None
            if 'scheduled_date' in row and pd.notna(row['scheduled_date']):
                try:
                    if isinstance(row['scheduled_date'], str):
                        scheduled_date = datetime.strptime(row['scheduled_date'], '%Y-%m-%d').date()
                    else:
                        scheduled_date = pd.to_datetime(row['scheduled_date']).date()
                except:
                    pass
            
            # Parse time if present
            scheduled_time = None
            if 'scheduled_time' in row and pd.notna(row['scheduled_time']):
                try:
                    if isinstance(row['scheduled_time'], str):
                        scheduled_time = datetime.strptime(row['scheduled_time'], '%H:%M').time()
                    else:
                        scheduled_time = pd.to_datetime(row['scheduled_time']).time()
                except:
                    pass
            
            # Parse gender
            gender = None
            if 'gender' in row and pd.notna(row['gender']):
                gender_str = str(row['gender']).lower()
                if gender_str in ['male', 'ชาย', 'm']:
                    gender = 'male'
                elif gender_str in ['female', 'หญิง', 'f']:
                    gender = 'female'
            
            patient = Patient(
                hn=str(row['hn']).strip(),
                full_name=str(row['full_name']).strip(),
                age=int(row['age']) if 'age' in row and pd.notna(row['age']) else None,
                gender=gender,
                diagnosis=str(row['diagnosis']).strip() if 'diagnosis' in row and pd.notna(row['diagnosis']) else None,
                operation=str(row['operation']).strip() if 'operation' in row and pd.notna(row['operation']) else None,
                surgeon=str(row['surgeon']).strip() if 'surgeon' in row and pd.notna(row['surgeon']) else None,
                anesthesiologist=str(row['anesthesiologist']).strip() if 'anesthesiologist' in row and pd.notna(row['anesthesiologist']) else None,
                or_room=str(row['or_room']).strip() if 'or_room' in row and pd.notna(row['or_room']) else None,
                patient_type=patient_type,
                scheduled_date=scheduled_date,
                scheduled_time=scheduled_time,
                notes=str(row['notes']).strip() if 'notes' in row and pd.notna(row['notes']) else None,
                created_by=current_user.id
            )
            
            db.add(patient)
            imported_patients.append(patient)
        
        db.commit()
        
        # Refresh all to get IDs
        for p in imported_patients:
            db.refresh(p)
        
        return imported_patients
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")

@router.get("/template")
async def download_template():
    """Download Excel template for importing patients"""
    
    # Create template dataframe
    template_data = {
        'HN': ['OR12345', 'OR12346'],
        'ชื่อ-สกุล': ['นายสมชาย ใจดี', 'นางสาวสมหญิง รักดี'],
        'อายุ': [45, 32],
        'เพศ': ['ชาย', 'หญิง'],
        'การวินิจฉัย': ['Cholecystitis', 'Thyroid nodule'],
        'การผ่าตัด': ['Lap Cholecystectomy', 'Thyroidectomy'],
        'ศัลยแพทย์': ['นพ.สมศักดิ์', 'พญ.สมหญิง'],
        'วิสัญญี': ['นพ.วิสัญญี', 'พญ.วิสัญญี'],
        'ห้องผ่าตัด': ['OR1', 'OR2'],
        'วันที่': ['2024-12-21', '2024-12-21'],
        'เวลา': ['08:00', '10:00'],
        'หมายเหตุ': ['', 'NPO หลัง 6 โมงเช้า'],
    }
    
    df = pd.DataFrame(template_data)
    
    # Create Excel file in memory
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Patients')
    output.seek(0)
    
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=patient_import_template.xlsx"}
    )

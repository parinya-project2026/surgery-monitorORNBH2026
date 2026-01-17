# SurgiTrack - Real-time Surgery Status Web Application

🏥 ระบบแจ้งเตือนสถานะการผ่าตัดแบบ Real-time สำหรับห้องผ่าตัดภายในองค์กร

## Features
- ✅ Login ด้วย JWT Authentication
- ✅ ทะเบียนผู้ป่วยในเวลา (Elective) / นอกเวลา (Emergency)
- ✅ สถานะการผ่าตัด 5 สถานะ: รอผ่าตัด, กำลังผ่าตัด, พักฟื้น, เลื่อน, ส่งกลับตึก
- ✅ Public Display สำหรับญาติ (ปกปิดข้อมูลตาม PDPA)
- ✅ Import ข้อมูลจาก Excel/CSV
- ✅ Dashboard สถิติ
- ✅ Admin Panel

## Tech Stack
- **Backend**: Python FastAPI + SQLAlchemy
- **Database**: MySQL 8.0
- **Frontend**: Next.js + Tailwind CSS (Coming soon)

## Quick Start

### 1. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Setup Database
- เปิด MySQL Workbench
- รัน SQL script ใน `data/setup_database.sql`

### 3. Configure Database Password
แก้ไขไฟล์ `backend/app/config.py`:
```python
DATABASE_URL: str = "mysql+pymysql://root:YOUR_PASSWORD@localhost:3306/surgitrack"
```

### 4. Run Backend
```bash
cd backend
python run.py
```

### 5. Open API Docs
เปิด Browser ไปที่: http://localhost:8000/docs

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/register` | Register first admin |
| GET | `/api/patients` | Get all patients |
| POST | `/api/patients` | Create patient |
| PATCH | `/api/patients/{id}/status` | Update status |
| GET | `/api/patients/public` | Public display (masked) |
| GET | `/api/patients/stats` | Dashboard stats |
| POST | `/api/import/excel` | Import from Excel |

## Surgery Statuses

| Status | Thai | Color |
|--------|------|-------|
| waiting | รอผ่าตัด | 🟡 |
| in_surgery | กำลังผ่าตัด | 🔴 |
| recovering | กำลังพักฟื้น | 🟢 |
| postponed | เลื่อนการผ่าตัด | ⚪ |
| returning | กำลังส่งกลับตึก | 🔵 |

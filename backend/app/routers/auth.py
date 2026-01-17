from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.user import User
from app.models.session_log import SessionLog
from app.schemas.user import Token, LoginRequest, UserResponse, UserCreate
from app.utils.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    get_current_user,
    get_current_admin_user,
)
from app.config import settings

router = APIRouter(prefix="/auth", tags=["Authentication"])

def log_session(db: Session, user_id: int, username: str, action: str, 
                ip_address: str = None, user_agent: str = None, 
                success: bool = True, failure_reason: str = None):
    """บันทึก Session Log สำหรับ PDPA Audit"""
    # Use None instead of 0 for foreign key constraint
    actual_user_id = user_id if user_id > 0 else None
    
    session_log = SessionLog(
        user_id=actual_user_id,
        username=username,
        action=action,
        ip_address=ip_address,
        user_agent=user_agent,
        success=success,
        failure_reason=failure_reason
    )
    db.add(session_log)
    db.commit()

@router.post("/login", response_model=Token)
async def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(), 
    db: Session = Depends(get_db)
):
    """Login and get JWT token"""
    # Get client info for logging
    client_ip = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "unknown")
    
    user = db.query(User).filter(User.username == form_data.username).first()
    
    # Log failed login attempt - user not found
    if not user:
        log_session(
            db, user_id=0, username=form_data.username, action="failed_login",
            ip_address=client_ip, user_agent=user_agent,
            success=False, failure_reason="User not found"
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Log failed login attempt - wrong password
    if not verify_password(form_data.password, user.password_hash):
        log_session(
            db, user_id=user.id, username=user.username, action="failed_login",
            ip_address=client_ip, user_agent=user_agent,
            success=False, failure_reason="Invalid password"
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        log_session(
            db, user_id=user.id, username=user.username, action="failed_login",
            ip_address=client_ip, user_agent=user_agent,
            success=False, failure_reason="User inactive"
        )
        raise HTTPException(status_code=400, detail="Inactive user")
    
    # Log successful login
    log_session(
        db, user_id=user.id, username=user.username, action="login",
        ip_address=client_ip, user_agent=user_agent,
        success=True
    )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={
            "sub": user.username,
            "user_id": user.id,
            "role": user.role.value
        },
        expires_delta=access_token_expires,
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/logout")
async def logout(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Logout - record session end"""
    client_ip = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "unknown")
    
    log_session(
        db, user_id=current_user.id, username=current_user.username, action="logout",
        ip_address=client_ip, user_agent=user_agent,
        success=True
    )
    
    return {"message": "Logged out successfully"}

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current logged-in user info"""
    return current_user

@router.get("/sessions")
async def get_session_logs(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Get session logs (Admin only) - สำหรับตรวจสอบว่าใครเข้าระบบบ้าง"""
    logs = db.query(SessionLog).order_by(SessionLog.created_at.desc()).offset(skip).limit(limit).all()
    return [
        {
            "id": log.id,
            "user_id": log.user_id,
            "username": log.username,
            "action": log.action,
            "ip_address": log.ip_address,
            "success": log.success,
            "failure_reason": log.failure_reason,
            "created_at": log.created_at.isoformat() if log.created_at else None
        }
        for log in logs
    ]

@router.post("/register", response_model=UserResponse)
async def register_first_admin(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register the first admin user (only works if no users exist)"""
    existing_users = db.query(User).count()
    if existing_users > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Registration is closed. Please contact admin."
        )
    
    # Create the first admin user
    hashed_password = get_password_hash(user_data.password)
    db_user = User(
        username=user_data.username,
        password_hash=hashed_password,
        full_name=user_data.full_name,
        role="admin",
        is_active=True
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

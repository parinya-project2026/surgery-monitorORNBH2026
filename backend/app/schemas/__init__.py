# Import all schemas here for easy access
from app.schemas.user import (
    UserBase,
    UserCreate,
    UserUpdate,
    UserResponse,
    LoginRequest,
    Token,
    TokenData,
)
from app.schemas.patient import (
    PatientBase,
    PatientCreate,
    PatientUpdate,
    PatientStatusUpdate,
    PatientResponse,
    PatientPublicDisplay,
    StatusHistoryResponse,
    DashboardStats,
)

__all__ = [
    "UserBase",
    "UserCreate",
    "UserUpdate",
    "UserResponse",
    "LoginRequest",
    "Token",
    "TokenData",
    "PatientBase",
    "PatientCreate",
    "PatientUpdate",
    "PatientStatusUpdate",
    "PatientResponse",
    "PatientPublicDisplay",
    "StatusHistoryResponse",
    "DashboardStats",
]

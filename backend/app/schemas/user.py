from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from app.models.user import UserRole

# Base schema for User
class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    full_name: str = Field(..., min_length=1, max_length=100)
    role: UserRole = UserRole.nurse

# Schema for creating a new user
class UserCreate(UserBase):
    password: str = Field(..., min_length=6)

# Schema for updating a user
class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None

# Schema for returning user data (without password)
class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Schema for login
class LoginRequest(BaseModel):
    username: str
    password: str

# Schema for JWT token
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    username: Optional[str] = None
    user_id: Optional[int] = None
    role: Optional[str] = None

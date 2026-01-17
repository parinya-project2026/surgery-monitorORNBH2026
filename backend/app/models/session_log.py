from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.sql import func
from app.database import Base

class SessionLog(Base):
    """บันทึกการเข้าสู่ระบบ (สำหรับ PDPA Audit Trail)"""
    __tablename__ = "session_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    username = Column(String(50), nullable=False)
    action = Column(String(20), nullable=False)  # 'login', 'logout', 'failed_login'
    ip_address = Column(String(50))
    user_agent = Column(Text)
    success = Column(Boolean, default=True)
    failure_reason = Column(String(255))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<SessionLog(user={self.username}, action={self.action}, time={self.created_at})>"

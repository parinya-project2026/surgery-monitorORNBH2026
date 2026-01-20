import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # App Config
    APP_NAME: str = "SurgiTrack"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = "YOUR_SECRET_KEY_HERE_CHANGE_THIS_IN_PROD"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # Database Config (MySQL)
    # Format: mysql+pymysql://user:password@host:port/database_name
    DATABASE_URL: str = "mysql+pymysql://root:admin1234@localhost:3306/surgitrack"

    class Config:
        env_file = ".env"

settings = Settings()

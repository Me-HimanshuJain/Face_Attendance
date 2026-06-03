import os

class Settings:
    PROJECT_NAME: str = "Face Recognition Attendance System"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./attendance.db") # Default to sqlite for local dev
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-super-secret-key")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

settings = Settings()

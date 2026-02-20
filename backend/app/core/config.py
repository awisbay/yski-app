"""
Application Configuration Settings
"""

import json
from typing import List
from pydantic_settings import BaseSettings
from pydantic import validator


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # App
    APP_ENV: str = "development"
    APP_DEBUG: bool = False

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://yski:changeme@localhost:5432/yski_db"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # JWT
    JWT_SECRET_KEY: str = ""
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Password reset
    PASSWORD_RESET_TOKEN_EXPIRE_MINUTES: int = 30
    PASSWORD_RESET_URL_BASE: str = "yski://auth/reset-password"

    # Email (optional SMTP)
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_USE_TLS: bool = True
    EMAIL_FROM: str = "no-reply@yski.local"

    # Security hardening
    DONATION_WEBHOOK_SECRET: str = ""
    PASSWORD_RESET_DEBUG_EXPOSE: bool = False

    @validator("JWT_SECRET_KEY")
    def jwt_secret_must_be_set(cls, v, values):
        if not v and values.get("APP_ENV") != "development":
            raise ValueError("JWT_SECRET_KEY must be set in non-development environments")
        if not v:
            # Provide a dev-only default so local dev still works
            return "dev-only-insecure-key-do-not-use-in-prod"
        return v
    
    # MinIO
    MINIO_ENDPOINT: str = "localhost:9000"
    MINIO_ROOT_USER: str = "minioadmin"
    MINIO_ROOT_PASSWORD: str = "minioadmin"
    MINIO_BUCKET: str = "yski-uploads"

    # Local media storage
    MEDIA_ROOT: str = "media"
    MEDIA_URL_PREFIX: str = "/media"
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:8081", "http://localhost:3000"]
    
    @validator("BACKEND_CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v):
        if isinstance(v, str):
            try:
                import json
                return json.loads(v)
            except (json.JSONDecodeError, ValueError):
                return [i.strip() for i in v.split(",")]
        return v
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()

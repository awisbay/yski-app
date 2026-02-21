"""
Authentication Routes
"""

import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.rate_limit import enforce_rate_limit
from app.core.security import (
    create_access_token,
    create_refresh_token,
    generate_token_id,
    verify_password,
)
from app.models.user import User
from app.schemas.auth import (
    Token,
    LoginRequest,
    RefreshRequest,
    PasswordResetRequest,
    PasswordResetConfirm,
    ChangePasswordRequest,
)
from app.schemas.user import UserCreate, UserResponse
from app.services.password_reset import PasswordResetService, send_password_reset_email
from app.services.user import UserService

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db)
):
    """Register a new user (Sahabat role by default)."""
    service = UserService(db)
    
    # Check if email exists
    existing = await service.get_by_email(user_data.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered"
        )
    
    # Create user with default 'sahabat' role
    user = await service.create(user_data, role="sahabat")
    return user


@router.post("/login", response_model=Token)
async def login(
    login_data: LoginRequest,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Login with email and password."""
    client_ip = request.client.host if request.client else "unknown"
    enforce_rate_limit(f"auth:login:ip:{client_ip}", max_requests=20, window_seconds=60)
    enforce_rate_limit(f"auth:login:email:{login_data.email.lower()}", max_requests=10, window_seconds=60)

    service = UserService(db)
    
    user = await service.get_by_email(login_data.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User tidak terdaftar",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Password salah",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated"
        )
    
    # Create tokens
    token_data = {"sub": str(user.id), "email": user.email, "role": user.role}
    access_token = create_access_token(token_data)
    refresh_jti = generate_token_id()
    refresh_token = create_refresh_token(token_data, jti=refresh_jti)
    user.current_refresh_jti = refresh_jti
    user.last_login_at = datetime.now(timezone.utc)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": 900  # 15 minutes
    }


@router.post("/refresh", response_model=Token)
async def refresh(
    refresh_data: RefreshRequest,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Refresh access token."""
    client_ip = request.client.host if request.client else "unknown"
    enforce_rate_limit(f"auth:refresh:ip:{client_ip}", max_requests=30, window_seconds=60)

    from app.core.security import decode_token
    
    payload = decode_token(refresh_data.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    user_id = payload.get("sub")
    token_jti = payload.get("jti")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )
    
    service = UserService(db)
    user = await service.get_by_id(user_id)
    
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )

    if not token_jti or user.current_refresh_jti != token_jti:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token revoked or rotated"
        )
    
    # Create new tokens (token rotation)
    token_data = {"sub": str(user.id), "email": user.email, "role": user.role}
    access_token = create_access_token(token_data)
    new_refresh_jti = generate_token_id()
    refresh_token = create_refresh_token(token_data, jti=new_refresh_jti)
    user.current_refresh_jti = new_refresh_jti
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": 900
    }


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user = Depends(get_current_user)
):
    """Get current authenticated user info."""
    return current_user


@router.post("/forgot-password")
async def forgot_password(
    payload: PasswordResetRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Request password reset.
    Always returns success to avoid email enumeration.
    """
    client_ip = request.client.host if request.client else "unknown"
    enforce_rate_limit(f"auth:forgot:ip:{client_ip}", max_requests=10, window_seconds=60)
    enforce_rate_limit(f"auth:forgot:email:{payload.email.lower()}", max_requests=5, window_seconds=60)

    user_service = UserService(db)
    reset_service = PasswordResetService(db)

    user = await user_service.get_by_email(payload.email)
    response = {
        "message": "Jika email terdaftar, instruksi reset password akan dikirim."
    }

    if user and user.is_active:
        raw_token, reset_url = await reset_service.issue_token(user)
        email_sent = False
        try:
            email_sent = send_password_reset_email(user.email, reset_url)
        except Exception:
            logger.exception("Failed sending password-reset email to %s", user.email)

        # Dev fallback when email provider is not configured.
        if (settings.APP_ENV == "development" or settings.APP_DEBUG) and settings.PASSWORD_RESET_DEBUG_EXPOSE:
            response["debug_reset_url"] = reset_url
            if not email_sent:
                response["debug_reset_token"] = raw_token

        logger.info("Password reset requested for user_id=%s", user.id)

    return response


@router.post("/reset-password")
async def reset_password(
    payload: PasswordResetConfirm,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Reset password using one-time token."""
    client_ip = request.client.host if request.client else "unknown"
    enforce_rate_limit(f"auth:reset:ip:{client_ip}", max_requests=10, window_seconds=60)

    reset_service = PasswordResetService(db)
    success = await reset_service.reset_password(payload.token, payload.new_password)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token reset tidak valid atau sudah kedaluwarsa",
        )

    return {"message": "Password berhasil diubah"}


@router.post("/logout")
async def logout(
    current_user: User = Depends(get_current_user),
):
    """Revoke active refresh token for current user session."""
    current_user.current_refresh_jti = None
    return {"message": "Logged out successfully"}


@router.post("/change-password")
async def change_password(
    payload: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
):
    """Change password for the current authenticated user."""
    if not verify_password(payload.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password saat ini tidak sesuai",
        )

    if payload.current_password == payload.new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password baru tidak boleh sama dengan password lama",
        )

    from app.core.security import get_password_hash

    current_user.password_hash = get_password_hash(payload.new_password)
    current_user.current_refresh_jti = None
    return {"message": "Password berhasil diubah, silakan login ulang"}

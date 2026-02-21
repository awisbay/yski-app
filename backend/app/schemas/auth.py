"""
Authentication Pydantic Schemas
"""

from pydantic import BaseModel, EmailStr, Field


class Token(BaseModel):
    """Token response schema."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds


class TokenPayload(BaseModel):
    """JWT token payload schema."""
    sub: str  # user id
    email: str
    role: str
    exp: int
    type: str  # access or refresh
    jti: str | None = None


class LoginRequest(BaseModel):
    """Login request schema."""
    email: EmailStr
    password: str = Field(..., min_length=1)


class RefreshRequest(BaseModel):
    """Refresh token request schema."""
    refresh_token: str


class PasswordResetRequest(BaseModel):
    """Password reset request schema."""
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    """Password reset confirmation schema."""
    token: str
    new_password: str = Field(..., min_length=6)


class ChangePasswordRequest(BaseModel):
    """Change password for authenticated user."""
    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=6)

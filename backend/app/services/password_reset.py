"""
Password reset service.
"""

from datetime import datetime, timedelta, timezone
from email.message import EmailMessage
import hashlib
import secrets
import smtplib
from typing import Optional, Tuple

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import get_password_hash
from app.models.password_reset import PasswordResetToken
from app.models.user import User


class PasswordResetService:
    """Generate, verify, and consume password reset tokens."""

    def __init__(self, db: AsyncSession):
        self.db = db

    @staticmethod
    def _hash_token(token: str) -> str:
        return hashlib.sha256(token.encode("utf-8")).hexdigest()

    async def issue_token(self, user: User) -> Tuple[str, str]:
        """Create a reset token and return (raw_token, reset_url)."""
        await self._invalidate_user_tokens(user.id)

        raw_token = secrets.token_urlsafe(48)
        token_hash = self._hash_token(raw_token)
        expires_at = datetime.now(timezone.utc) + timedelta(
            minutes=settings.PASSWORD_RESET_TOKEN_EXPIRE_MINUTES
        )

        token_row = PasswordResetToken(
            user_id=user.id,
            token_hash=token_hash,
            expires_at=expires_at,
        )
        self.db.add(token_row)
        await self.db.flush()

        reset_url = f"{settings.PASSWORD_RESET_URL_BASE}?token={raw_token}"
        return raw_token, reset_url

    async def reset_password(self, token: str, new_password: str) -> bool:
        """Consume reset token and update password. Returns False when token invalid."""
        token_hash = self._hash_token(token)
        now = datetime.now(timezone.utc)

        result = await self.db.execute(
            select(PasswordResetToken, User)
            .join(User, User.id == PasswordResetToken.user_id)
            .where(PasswordResetToken.token_hash == token_hash)
            .where(PasswordResetToken.used_at.is_(None))
            .where(PasswordResetToken.expires_at > now)
            .where(User.is_active.is_(True))
        )
        row = result.first()
        if not row:
            return False

        token_row, user = row
        user.password_hash = get_password_hash(new_password)
        user.current_refresh_jti = None
        token_row.used_at = now

        await self.db.execute(
            update(PasswordResetToken)
            .where(PasswordResetToken.user_id == user.id)
            .where(PasswordResetToken.used_at.is_(None))
            .where(PasswordResetToken.id != token_row.id)
            .values(used_at=now)
        )
        await self.db.flush()
        return True

    async def _invalidate_user_tokens(self, user_id) -> None:
        now = datetime.now(timezone.utc)
        await self.db.execute(
            update(PasswordResetToken)
            .where(PasswordResetToken.user_id == user_id)
            .where(PasswordResetToken.used_at.is_(None))
            .values(used_at=now)
        )


def send_password_reset_email(recipient: str, reset_url: str) -> bool:
    """Send password-reset email via SMTP if configured."""
    if not settings.SMTP_HOST:
        return False

    msg = EmailMessage()
    msg["Subject"] = "Reset Password YSKI App"
    msg["From"] = settings.EMAIL_FROM
    msg["To"] = recipient
    msg.set_content(
        "Kami menerima permintaan reset password.\n\n"
        f"Silakan buka tautan berikut:\n{reset_url}\n\n"
        f"Tautan berlaku {settings.PASSWORD_RESET_TOKEN_EXPIRE_MINUTES} menit."
    )

    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
        if settings.SMTP_USE_TLS:
            server.starttls()
        if settings.SMTP_USERNAME:
            server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
        server.send_message(msg)
    return True

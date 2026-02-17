"""
Notification models for in-app and push notifications.
"""
from sqlalchemy import Column, ForeignKey, String, Text, Boolean, Index, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
from app.models.base import UUIDMixin


class Notification(Base, UUIDMixin):
    """In-app notification for users."""
    __tablename__ = "notifications"

    user_id = Column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    title = Column(String(255), nullable=False)
    body = Column(Text, nullable=False)
    type = Column(String(50), nullable=False, index=True)

    # Reference to related entity
    reference_type = Column(String(50), nullable=True)  # 'booking', 'donation', 'pickup', 'loan', 'auction'
    reference_id = Column(String(36), nullable=True)

    is_read = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="notifications")

    # Indexes
    __table_args__ = (
        Index('idx_notifications_user_unread', 'user_id', 'is_read', postgresql_where=(is_read == False)),
        Index('idx_notifications_created', 'created_at', postgresql_ops={'created_at': 'DESC'}),
    )

    def __repr__(self):
        return f"<Notification(id={self.id}, user_id={self.user_id}, type={self.type})>"


class PushToken(Base, UUIDMixin):
    """Expo push token for a user's device."""
    __tablename__ = "push_tokens"

    user_id = Column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    token = Column(Text, nullable=False, unique=True)
    device_type = Column(String(10), nullable=False)  # 'ios', 'android'

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="push_tokens")

    def __repr__(self):
        return f"<PushToken(id={self.id}, user_id={self.user_id}, device_type={self.device_type})>"

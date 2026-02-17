"""
Pickup Request Models (Jemput Zakat & Kencleng)
"""

import uuid
from datetime import datetime, date
from typing import Optional
from decimal import Decimal

from sqlalchemy import String, Text, Date, ForeignKey, DateTime, func, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class PickupRequest(Base):
    """Zakat/Kencleng pickup request model."""
    
    __tablename__ = "pickup_requests"
    
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    request_code: Mapped[str] = mapped_column(String(16), unique=True, nullable=False)
    
    # Requester
    requester_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=True
    )
    requester_name: Mapped[str] = mapped_column(String(100), nullable=False)
    requester_phone: Mapped[str] = mapped_column(String(20), nullable=False)
    
    # Pickup Type
    pickup_type: Mapped[str] = mapped_column(String(20), nullable=False)  # zakat, kencleng, donasi
    
    # Location
    pickup_address: Mapped[str] = mapped_column(Text, nullable=False)
    pickup_lat: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 7), nullable=True)
    pickup_lng: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 7), nullable=True)
    
    # Schedule
    preferred_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    preferred_time_slot: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)  # morning, afternoon, evening
    
    # Workflow
    status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False)  # pending, scheduled, in_progress, completed, cancelled
    
    assigned_to: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=True
    )
    scheduled_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=True
    )
    scheduled_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # Completion
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    proof_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    collected_amount: Mapped[Optional[Decimal]] = mapped_column(Numeric(15, 2), nullable=True)
    
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
    updated_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        onupdate=func.now(),
        nullable=True
    )
    
    # Relationships
    requester = relationship("User", foreign_keys=[requester_id], back_populates="pickup_requests")
    assigned_volunteer = relationship("User", foreign_keys=[assigned_to])
    scheduler = relationship("User", foreign_keys=[scheduled_by])
    
    def __repr__(self) -> str:
        return f"<PickupRequest(id={self.id}, code={self.request_code}, type={self.pickup_type}, status={self.status})>"

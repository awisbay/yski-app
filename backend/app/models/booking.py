"""
Booking Model - Pickup Service Booking
"""

import uuid
from datetime import datetime, date
from typing import Optional
from decimal import Decimal

from sqlalchemy import String, Text, Date, ForeignKey, Numeric, SmallInteger, DateTime, func, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class MovingBooking(Base):
    """Pickup service booking model."""
    
    __tablename__ = "moving_bookings"
    
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    booking_code: Mapped[str] = mapped_column(String(16), unique=True, nullable=False)
    booking_date: Mapped[date] = mapped_column(Date, nullable=False)
    time_slot: Mapped[str] = mapped_column(String(5), nullable=False)  # '08:00', '10:00', '13:00', '15:00'
    
    # Requester
    requester_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False
    )
    requester_name: Mapped[str] = mapped_column(String(255), nullable=False)
    requester_phone: Mapped[str] = mapped_column(String(20), nullable=False)
    
    # Addresses
    pickup_address: Mapped[str] = mapped_column(Text, nullable=False)
    pickup_lat: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 7), nullable=True)
    pickup_lng: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 7), nullable=True)
    dropoff_address: Mapped[str] = mapped_column(Text, nullable=False)
    dropoff_lat: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 7), nullable=True)
    dropoff_lng: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 7), nullable=True)
    purpose: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Workflow
    status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False)
    assigned_to: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=True
    )
    approved_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=True
    )
    
    # Rating
    rating: Mapped[Optional[int]] = mapped_column(SmallInteger, nullable=True)
    review_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
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
    
    # Anti double-booking: UNIQUE constraint on date + slot
    __table_args__ = (
        UniqueConstraint("booking_date", "time_slot", name="uq_booking_date_slot"),
    )
    
    # Relationships
    requester = relationship("User", foreign_keys=[requester_id], back_populates="bookings")
    assigned_volunteer = relationship("User", foreign_keys=[assigned_to])
    approver = relationship("User", foreign_keys=[approved_by])
    
    def __repr__(self) -> str:
        return f"<MovingBooking(id={self.id}, code={self.booking_code}, date={self.booking_date}, slot={self.time_slot})>"

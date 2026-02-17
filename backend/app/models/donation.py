"""
Donation Models
"""

import uuid
from datetime import datetime
from typing import Optional
from decimal import Decimal

from sqlalchemy import String, Text, Numeric, ForeignKey, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Donation(Base):
    """Donation/Infaq model."""
    
    __tablename__ = "donations"
    
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    donation_code: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    
    donor_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=True  # Anonymous donations allowed
    )
    donor_name: Mapped[str] = mapped_column(String(100), nullable=False)
    donor_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    donor_phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    
    amount: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False)
    donation_type: Mapped[str] = mapped_column(String(30), nullable=False)  # infaq, sedekah, wakaf, zakat
    program_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("programs.id"),
        nullable=True
    )
    
    payment_method: Mapped[str] = mapped_column(String(50), nullable=False)  # transfer, qris, gopay, etc.
    payment_status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False)  # pending, paid, cancelled, refunded
    
    proof_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)  # Bukti transfer
    verified_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=True
    )
    verified_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # Pesan dari donatur
    
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
    donor = relationship("User", foreign_keys=[donor_id], back_populates="donations")
    verifier = relationship("User", foreign_keys=[verified_by])
    program = relationship("Program", back_populates="donations")
    
    def __repr__(self) -> str:
        return f"<Donation(id={self.id}, code={self.donation_code}, amount={self.amount}, status={self.payment_status})>"

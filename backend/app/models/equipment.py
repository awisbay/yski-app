"""
Medical Equipment Models (Alkes)
"""

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import String, Text, Integer, ForeignKey, DateTime, func, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class MedicalEquipment(Base):
    """Medical equipment inventory model."""
    
    __tablename__ = "medical_equipment"
    
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False)  # wheelchair, crutches, oxygen, etc.
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    photo_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    total_stock: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    available_stock: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    condition: Mapped[str] = mapped_column(String(20), default="good", nullable=False)  # new, good, fair, poor
    
    is_active: Mapped[bool] = mapped_column(default=True, nullable=False)
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
    loans = relationship("EquipmentLoan", back_populates="equipment")
    
    def __repr__(self) -> str:
        return f"<MedicalEquipment(id={self.id}, name={self.name}, available={self.available_stock})>"


class EquipmentLoan(Base):
    """Equipment loan/borrowing request model."""
    
    __tablename__ = "equipment_loans"
    
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    equipment_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("medical_equipment.id"),
        nullable=False
    )
    borrower_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False
    )
    borrower_name: Mapped[str] = mapped_column(String(100), nullable=False)
    borrower_phone: Mapped[str] = mapped_column(String(20), nullable=False)
    
    borrow_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    return_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    borrow_location: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    borrow_lat: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    borrow_lng: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    
    status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False)  # pending, approved, borrowed, returned, rejected
    
    approved_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=True
    )
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
    equipment = relationship("MedicalEquipment", back_populates="loans")
    borrower = relationship("User", foreign_keys=[borrower_id], back_populates="equipment_loans")
    approver = relationship("User", foreign_keys=[approved_by])
    
    def __repr__(self) -> str:
        return f"<EquipmentLoan(id={self.id}, equipment={self.equipment_id}, status={self.status})>"

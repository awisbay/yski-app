"""
User SQLAlchemy Model
"""

import uuid
from datetime import datetime
from typing import Optional, List

from sqlalchemy import String, Boolean, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class User(Base):
    """User model for all roles (Admin, Pengurus, Relawan, Sahabat)."""
    
    __tablename__ = "users"
    
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    full_name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    # Role: admin, pengurus, relawan, sahabat
    role: Mapped[str] = mapped_column(String(20), default="sahabat", nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    current_refresh_jti: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
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
    bookings: Mapped[List["MovingBooking"]] = relationship("MovingBooking", foreign_keys="MovingBooking.requester_id", back_populates="requester")
    equipment_loans: Mapped[List["EquipmentLoan"]] = relationship("EquipmentLoan", foreign_keys="EquipmentLoan.borrower_id", back_populates="borrower")
    donations: Mapped[List["Donation"]] = relationship("Donation", foreign_keys="Donation.donor_id", back_populates="donor")
    pickup_requests: Mapped[List["PickupRequest"]] = relationship("PickupRequest", foreign_keys="PickupRequest.requester_id", back_populates="requester")
    
    # Phase 5: Auction relationships
    donated_auction_items: Mapped[List["AuctionItem"]] = relationship("AuctionItem", foreign_keys="AuctionItem.donor_id", back_populates="donor")
    won_auctions: Mapped[List["AuctionItem"]] = relationship("AuctionItem", foreign_keys="AuctionItem.winner_id", back_populates="winner")
    auction_bids: Mapped[List["AuctionBid"]] = relationship(
        "AuctionBid",
        back_populates="bidder",
        foreign_keys="AuctionBid.bidder_id",
    )
    
    # Phase 5: Financial report relationships
    generated_reports: Mapped[List["FinancialReport"]] = relationship("FinancialReport", back_populates="generator")
    
    # Phase 5: Notification relationships
    notifications: Mapped[List["Notification"]] = relationship("Notification", back_populates="user", order_by="Notification.created_at.desc()")
    push_tokens: Mapped[List["PushToken"]] = relationship("PushToken", back_populates="user")
    
    def __repr__(self) -> str:
        return f"<User(id={self.id}, email={self.email}, role={self.role})>"

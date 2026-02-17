"""
Auction models for Lelang Barang feature.
"""
from decimal import Decimal
from sqlalchemy import Column, ForeignKey, Numeric, String, Text, DateTime, SmallInteger, Index
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TimestampMixin, UUIDMixin


class AuctionItem(Base, UUIDMixin, TimestampMixin):
    """Auction item for lelang barang (donated items auctioned for fundraising)."""
    __tablename__ = "auction_items"

    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    starting_price = Column(Numeric(12, 2), nullable=False)
    current_price = Column(Numeric(12, 2), nullable=False)
    min_increment = Column(Numeric(12, 2), nullable=False, default=Decimal("5000.00"))

    # People
    donor_id = Column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    winner_id = Column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # Status: draft, active, sold, expired, cancelled
    status = Column(String(20), nullable=False, default="draft", index=True)

    # Timing
    start_time = Column(DateTime(timezone=True), nullable=True)
    end_time = Column(DateTime(timezone=True), nullable=True, index=True)

    # Relationships
    donor = relationship("User", foreign_keys=[donor_id], back_populates="donated_auction_items")
    winner = relationship("User", foreign_keys=[winner_id], back_populates="won_auctions")
    images = relationship("AuctionImage", back_populates="auction_item", cascade="all, delete-orphan")
    bids = relationship("AuctionBid", back_populates="auction_item", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<AuctionItem(id={self.id}, title={self.title}, status={self.status})>"


class AuctionImage(Base, UUIDMixin, TimestampMixin):
    """Image for an auction item (multiple images per item)."""
    __tablename__ = "auction_images"

    auction_item_id = Column(
        ForeignKey("auction_items.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    image_url = Column(Text, nullable=False)
    sort_order = Column(SmallInteger, nullable=False, default=0)

    # Relationships
    auction_item = relationship("AuctionItem", back_populates="images")

    def __repr__(self):
        return f"<AuctionImage(id={self.id}, auction_item_id={self.auction_item_id})>"


class AuctionBid(Base, UUIDMixin, TimestampMixin):
    """Bid placed on an auction item."""
    __tablename__ = "auction_bids"

    auction_item_id = Column(
        ForeignKey("auction_items.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    bidder_id = Column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    amount = Column(Numeric(12, 2), nullable=False)

    # Relationships
    auction_item = relationship("AuctionItem", back_populates="bids")
    bidder = relationship("User", back_populates="auction_bids")

    def __repr__(self):
        return f"<AuctionBid(id={self.id}, amount={self.amount})>"

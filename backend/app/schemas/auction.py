"""
Auction Pydantic Schemas
"""
from datetime import datetime
from decimal import Decimal
from typing import List, Optional, Literal
from uuid import UUID

from pydantic import BaseModel, Field, ConfigDict


class AuctionImageBase(BaseModel):
    image_url: str
    sort_order: int = 0


class AuctionImageCreate(AuctionImageBase):
    pass


class AuctionImageResponse(AuctionImageBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime


class AuctionBidBase(BaseModel):
    amount: Decimal = Field(..., gt=0, decimal_places=2)


class AuctionBidCreate(AuctionBidBase):
    pass


class AuctionBidResponse(AuctionBidBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    bidder_id: UUID
    bidder_name: str
    status: str = "pending"
    reviewed_by: Optional[UUID] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime


class AuctionItemBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=255)
    description: Optional[str] = None
    starting_price: Decimal = Field(..., gt=0, decimal_places=2)
    min_increment: Decimal = Field(default=Decimal("5000.00"), gt=0, decimal_places=2)
    image_url: Optional[str] = None


class AuctionItemCreate(AuctionItemBase):
    pass


class AuctionItemUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=255)
    description: Optional[str] = None
    image_url: Optional[str] = None


class AuctionBidApproveRequest(BaseModel):
    bid_id: UUID


class AuctionPaymentVerifyRequest(BaseModel):
    status: Literal["paid", "rejected"]


class AuctionItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    description: Optional[str] = None
    starting_price: Decimal
    current_price: Decimal
    min_increment: Decimal
    donor_id: UUID
    donor_name: str
    winner_id: Optional[UUID] = None
    winner_name: Optional[str] = None
    status: str
    payment_status: Optional[str] = None
    payment_proof_url: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    images: List[AuctionImageResponse] = []
    bid_count: int = 0
    created_at: datetime
    updated_at: Optional[datetime] = None


class AuctionItemDetailResponse(AuctionItemResponse):
    bids: List[AuctionBidResponse] = []
    is_highest_bidder: bool = False
    my_max_bid: Optional[Decimal] = None


class AuctionItemListResponse(BaseModel):
    items: List[AuctionItemResponse]
    total: int


class MyBidResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    auction_item_id: UUID
    auction_title: str
    auction_status: str
    auction_image_url: Optional[str] = None
    my_bid_amount: Decimal
    current_price: Decimal
    is_winning: bool
    bid_count: int
    end_time: Optional[datetime] = None

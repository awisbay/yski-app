"""
Booking Pydantic Schemas
"""

from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field


class BookingBase(BaseModel):
    booking_date: date
    time_slot: str = Field(..., pattern=r"^(08:00|10:00|13:00|15:00)$")
    pickup_address: str
    pickup_lat: Optional[Decimal] = None
    pickup_lng: Optional[Decimal] = None
    dropoff_address: str
    dropoff_lat: Optional[Decimal] = None
    dropoff_lng: Optional[Decimal] = None
    purpose: str = Field(..., min_length=3, max_length=120)
    notes: Optional[str] = None


class BookingCreate(BookingBase):
    requester_name: Optional[str] = None
    requester_phone: Optional[str] = None


class BookingUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None


class BookingResponse(BookingBase):
    id: UUID
    booking_code: str
    requester_id: UUID
    requester_name: str
    requester_phone: str
    status: str
    assigned_to: Optional[UUID] = None
    approved_by: Optional[UUID] = None
    rating: Optional[int] = None
    review_text: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    purpose: Optional[str] = None
    
    class Config:
        from_attributes = True


class SlotAvailability(BaseModel):
    time: str
    available: bool


class SlotsResponse(BaseModel):
    date: date
    slots: list[SlotAvailability]

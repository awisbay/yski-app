"""
Booking Pydantic Schemas
"""

from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field, model_validator


class BookingBase(BaseModel):
    booking_date: date
    time_slot: str = Field(..., pattern=r"^(08:00|10:00|13:00|15:00|17:00|19:00|21:00)$")
    pickup_address: str
    pickup_lat: Optional[Decimal] = None
    pickup_lng: Optional[Decimal] = None
    dropoff_address: str
    dropoff_lat: Optional[Decimal] = None
    dropoff_lng: Optional[Decimal] = None
    purpose: str = Field(..., min_length=3, max_length=120)
    notes: Optional[str] = None


class BookingCreate(BookingBase):
    time_slots: Optional[list[str]] = None
    requester_name: Optional[str] = None
    requester_phone: Optional[str] = None

    @model_validator(mode="after")
    def validate_time_slots(self):
        if self.time_slots:
            allowed = {"08:00", "10:00", "13:00", "15:00", "17:00", "19:00", "21:00"}
            invalid = [slot for slot in self.time_slots if slot not in allowed]
            if invalid:
                raise ValueError(f"Invalid time slot values: {', '.join(invalid)}")
        return self


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
    time_slots: Optional[str] = None
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

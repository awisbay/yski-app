"""
Pickup Request Pydantic Schemas
"""

from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID
from pydantic import BaseModel


class PickupBase(BaseModel):
    pickup_type: str  # zakat, kencleng, donasi
    pickup_address: str
    pickup_lat: Optional[Decimal] = None
    pickup_lng: Optional[Decimal] = None
    preferred_date: Optional[date] = None
    preferred_time_slot: Optional[str] = None  # morning, afternoon, evening
    notes: Optional[str] = None


class PickupCreate(PickupBase):
    requester_name: str
    requester_phone: str


class PickupSchedule(BaseModel):
    assigned_to: UUID
    scheduled_at: datetime


class PickupComplete(BaseModel):
    collected_amount: Optional[Decimal] = None
    notes: Optional[str] = None


class PickupResponse(PickupBase):
    id: UUID
    request_code: str
    requester_id: Optional[UUID] = None
    requester_name: str
    requester_phone: str
    status: str
    assigned_to: Optional[UUID] = None
    scheduled_by: Optional[UUID] = None
    scheduled_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    proof_url: Optional[str] = None
    collected_amount: Optional[Decimal] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

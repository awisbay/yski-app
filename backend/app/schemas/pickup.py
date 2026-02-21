"""
Pickup Request Pydantic Schemas
"""

from datetime import date, datetime
from decimal import Decimal
from typing import Optional, Literal
from uuid import UUID
from pydantic import BaseModel, Field, model_validator


class PickupBase(BaseModel):
    pickup_type: Literal["zakat", "jelantah", "sedekah", "barang_bekas", "lain_lain", "kencleng", "donasi"]
    pickup_address: str
    pickup_lat: Decimal
    pickup_lng: Decimal
    amount: Optional[Decimal] = None
    item_description: Optional[str] = None
    item_photo_url: Optional[str] = None
    preferred_date: Optional[date] = None
    preferred_time_slot: Optional[str] = None  # morning, afternoon, evening
    notes: Optional[str] = None

    @model_validator(mode="after")
    def validate_payload_by_type(self):
        money_types = {"zakat", "sedekah"}
        goods_types = {"jelantah", "barang_bekas", "lain_lain"}

        if self.pickup_type in money_types:
            if self.amount is None or self.amount <= 0:
                raise ValueError("Nominal wajib diisi untuk zakat/sedekah")
        if self.pickup_type in goods_types:
            if not (self.item_description or "").strip():
                raise ValueError("Keterangan barang wajib diisi untuk jenis ini")
            if not (self.item_photo_url or "").strip():
                raise ValueError("Foto barang wajib diunggah untuk jenis ini")
        return self


class PickupCreate(PickupBase):
    requester_name: str
    requester_phone: str


class PickupSchedule(BaseModel):
    assigned_to: UUID
    scheduled_at: datetime


class PickupComplete(BaseModel):
    collected_amount: Optional[Decimal] = None
    notes: Optional[str] = None


class PickupReviewRequest(BaseModel):
    action: Literal["accept_now", "confirm_later"]
    follow_up_message: Optional[str] = Field(default=None, max_length=500)
    responder_lat: Optional[Decimal] = None
    responder_lng: Optional[Decimal] = None
    eta_minutes: Optional[int] = None
    eta_distance_km: Optional[Decimal] = None


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
    accepted_at: Optional[datetime] = None
    eta_minutes: Optional[int] = None
    eta_distance_km: Optional[Decimal] = None
    responder_lat: Optional[Decimal] = None
    responder_lng: Optional[Decimal] = None
    completed_at: Optional[datetime] = None
    proof_url: Optional[str] = None
    collected_amount: Optional[Decimal] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

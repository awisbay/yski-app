"""
Donation Pydantic Schemas
"""

from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field


class DonationBase(BaseModel):
    amount: Decimal = Field(..., gt=0)
    donation_type: str = Field(..., pattern=r"^(infaq|sedekah|wakaf|zakat)$")
    program_id: Optional[UUID] = None
    message: Optional[str] = None


class DonationCreate(DonationBase):
    donor_name: str
    donor_email: Optional[str] = None
    donor_phone: Optional[str] = None
    payment_method: str


class DonationVerify(BaseModel):
    status: str = Field(..., pattern=r"^(paid|cancelled)$")


class DonationResponse(DonationBase):
    id: UUID
    donation_code: str
    donor_id: Optional[UUID] = None
    donor_name: str
    donor_email: Optional[str] = None
    donor_phone: Optional[str] = None
    payment_method: str
    payment_status: str
    proof_url: Optional[str] = None
    verified_by: Optional[UUID] = None
    verified_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class DonationSummary(BaseModel):
    total_donations: int
    total_amount: Decimal
    by_type: dict[str, Decimal]

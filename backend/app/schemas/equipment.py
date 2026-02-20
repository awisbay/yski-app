"""
Equipment Pydantic Schemas
"""

from datetime import datetime
from typing import Optional, Literal
from uuid import UUID
from pydantic import BaseModel


class EquipmentBase(BaseModel):
    name: str
    category: Literal["kesehatan", "elektronik", "lain-lain"]
    description: Optional[str] = None
    photo_url: Optional[str] = None
    total_stock: int = 0
    available_stock: int = 0
    condition: str = "good"


class EquipmentCreate(EquipmentBase):
    pass


class EquipmentUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[Literal["kesehatan", "elektronik", "lain-lain"]] = None
    description: Optional[str] = None
    photo_url: Optional[str] = None
    total_stock: Optional[int] = None
    available_stock: Optional[int] = None
    condition: Optional[str] = None
    is_active: Optional[bool] = None


class EquipmentResponse(EquipmentBase):
    id: UUID
    photo_url: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class EquipmentLoanBase(BaseModel):
    equipment_id: UUID
    borrow_date: datetime
    return_date: datetime
    borrow_location: Optional[str] = None
    borrow_lat: Optional[str] = None
    borrow_lng: Optional[str] = None
    notes: Optional[str] = None


class EquipmentLoanCreate(EquipmentLoanBase):
    borrower_name: str
    borrower_phone: str


class EquipmentLoanUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None


class EquipmentLoanResponse(EquipmentLoanBase):
    id: UUID
    borrower_id: UUID
    borrower_name: str
    borrower_phone: str
    status: str
    approved_by: Optional[UUID] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    equipment: Optional[EquipmentResponse] = None
    
    class Config:
        from_attributes = True

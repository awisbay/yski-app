"""
Notification Pydantic Schemas
"""
from datetime import datetime
from typing import Optional, List
from uuid import UUID

from pydantic import BaseModel, ConfigDict


# ============== Push Token Schemas ==============

class PushTokenCreate(BaseModel):
    token: str
    device_type: str  # 'ios' or 'android'


class PushTokenResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    token: str
    device_type: str
    created_at: datetime


# ============== Notification Schemas ==============

class NotificationBase(BaseModel):
    title: str
    body: str
    type: str
    reference_type: Optional[str] = None
    reference_id: Optional[UUID] = None


class NotificationCreate(NotificationBase):
    user_id: UUID


class NotificationResponse(NotificationBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    user_id: UUID
    is_read: bool
    created_at: datetime


class NotificationListResponse(BaseModel):
    notifications: List[NotificationResponse]
    unread_count: int
    total: int


class NotificationMarkRead(BaseModel):
    is_read: bool = True


class UnreadCountResponse(BaseModel):
    count: int

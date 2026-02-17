"""
Notification API Routes
"""
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.notification import (
    PushTokenCreate,
    PushTokenResponse,
    NotificationResponse,
    NotificationListResponse,
    NotificationMarkRead,
    UnreadCountResponse,
)
from app.services.notification_service import NotificationService

router = APIRouter()


# ============== Push Tokens ==============

@router.post("/push-token", response_model=PushTokenResponse, status_code=status.HTTP_201_CREATED)
async def register_push_token(
    data: PushTokenCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Register a push token for the current user."""
    service = NotificationService(db)
    token = await service.register_push_token(
        user_id=current_user.id,
        token=data.token,
        device_type=data.device_type,
    )
    await db.commit()
    return token


@router.delete("/push-token")
async def remove_push_token(
    token: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Remove a push token (e.g., on logout)."""
    service = NotificationService(db)
    success = await service.remove_push_token(
        user_id=current_user.id,
        token=token,
    )
    if not success:
        raise HTTPException(status_code=404, detail="Token not found")
    return {"message": "Token removed successfully"}


# ============== Notifications ==============

@router.get("", response_model=NotificationListResponse)
async def list_notifications(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    include_read: bool = Query(True),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get notifications for the current user."""
    service = NotificationService(db)
    result = await service.get_notifications(
        user_id=current_user.id,
        limit=limit,
        offset=offset,
        include_read=include_read,
    )
    
    return {
        "notifications": result["notifications"],
        "unread_count": result["unread_count"],
        "total": result["total"],
    }


@router.get("/unread-count", response_model=UnreadCountResponse)
async def get_unread_count(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get unread notification count."""
    service = NotificationService(db)
    count = await service.get_unread_count(current_user.id)
    return {"count": count}


@router.patch("/{notification_id}/read")
async def mark_as_read(
    notification_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark a notification as read."""
    service = NotificationService(db)
    await service.mark_as_read(
        notification_id=notification_id,
        user_id=current_user.id,
    )
    return {"message": "Notification marked as read"}


@router.patch("/read-all")
async def mark_all_as_read(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark all notifications as read."""
    service = NotificationService(db)
    count = await service.mark_all_as_read(current_user.id)
    return {"message": f"{count} notifications marked as read"}

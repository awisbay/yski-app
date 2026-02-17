"""
Notification Service - In-app and Push Notifications
"""
from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import select, update, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import Notification, PushToken
import httpx


EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"


class NotificationService:
    """Service for managing notifications and push delivery."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    # ============== Push Token Management ==============
    
    async def register_push_token(
        self,
        user_id: UUID,
        token: str,
        device_type: str,
    ) -> PushToken:
        """Register or update a push token for a user."""
        # Check if token already exists
        result = await self.db.execute(
            select(PushToken).where(PushToken.token == token)
        )
        push_token = result.scalar_one_or_none()
        
        if push_token:
            # Update existing token
            push_token.user_id = user_id
            push_token.device_type = device_type
            push_token.updated_at = datetime.now(timezone.utc)
        else:
            # Create new token
            push_token = PushToken(
                user_id=user_id,
                token=token,
                device_type=device_type,
            )
            self.db.add(push_token)
        
        await self.db.flush()
        return push_token
    
    async def remove_push_token(self, user_id: UUID, token: str) -> bool:
        """Remove a push token (e.g., on logout)."""
        result = await self.db.execute(
            select(PushToken).where(
                PushToken.user_id == user_id,
                PushToken.token == token,
            )
        )
        push_token = result.scalar_one_or_none()
        
        if push_token:
            await self.db.delete(push_token)
            await self.db.commit()
            return True
        return False
    
    async def remove_all_user_tokens(self, user_id: UUID) -> int:
        """Remove all push tokens for a user (on logout from all devices)."""
        result = await self.db.execute(
            select(PushToken).where(PushToken.user_id == user_id)
        )
        tokens = result.scalars().all()
        
        count = 0
        for token in tokens:
            await self.db.delete(token)
            count += 1
        
        await self.db.commit()
        return count
    
    # ============== Notification Creation ==============
    
    async def create_notification(
        self,
        user_id: UUID,
        title: str,
        body: str,
        type: str,
        reference_type: Optional[str] = None,
        reference_id: Optional[UUID] = None,
        send_push: bool = True,
    ) -> Notification:
        """Create an in-app notification and optionally send push."""
        notification = Notification(
            user_id=user_id,
            title=title,
            body=body,
            type=type,
            reference_type=reference_type,
            reference_id=str(reference_id) if reference_id else None,
            is_read=False,
        )
        self.db.add(notification)
        await self.db.flush()
        
        # Send push notification
        if send_push:
            await self._send_push_notification(user_id, title, body)
        
        return notification
    
    async def create_bulk_notifications(
        self,
        user_ids: List[UUID],
        title: str,
        body: str,
        type: str,
        reference_type: Optional[str] = None,
        reference_id: Optional[UUID] = None,
    ) -> int:
        """Create notifications for multiple users."""
        count = 0
        for user_id in user_ids:
            await self.create_notification(
                user_id=user_id,
                title=title,
                body=body,
                type=type,
                reference_type=reference_type,
                reference_id=reference_id,
                send_push=True,
            )
            count += 1
        
        return count
    
    # ============== Push Delivery ==============
    
    async def _send_push_notification(
        self,
        user_id: UUID,
        title: str,
        body: str,
        data: Optional[dict] = None,
    ):
        """Send push notification via Expo."""
        # Get user's push tokens
        result = await self.db.execute(
            select(PushToken.token).where(PushToken.user_id == user_id)
        )
        tokens = [row[0] for row in result.all()]
        
        if not tokens:
            return
        
        # Prepare messages
        messages = []
        for token in tokens:
            message = {
                "to": token,
                "title": title,
                "body": body,
                "sound": "default",
                "priority": "high",
            }
            if data:
                message["data"] = data
            messages.append(message)
        
        # Send to Expo
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    EXPO_PUSH_URL,
                    json=messages,
                    headers={
                        "Content-Type": "application/json",
                        "Accept": "application/json",
                    },
                )
                response.raise_for_status()
        except httpx.HTTPError as e:
            # Log error but don't fail the operation
            print(f"Failed to send push notification: {e}")
    
    # ============== Notification Retrieval ==============
    
    async def get_notifications(
        self,
        user_id: UUID,
        limit: int = 50,
        offset: int = 0,
        include_read: bool = True,
    ) -> dict:
        """Get notifications for a user."""
        # Build query
        query = select(Notification).where(Notification.user_id == user_id)
        
        if not include_read:
            query = query.where(Notification.is_read == False)
        
        # Get total count
        count_query = select(func.count()).where(Notification.user_id == user_id)
        if not include_read:
            count_query = count_query.where(Notification.is_read == False)
        
        count_result = await self.db.execute(count_query)
        total = count_result.scalar()
        
        # Get paginated results
        query = (
            query.order_by(Notification.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        result = await self.db.execute(query)
        notifications = result.scalars().all()
        
        # Get unread count
        unread_result = await self.db.execute(
            select(func.count()).where(
                Notification.user_id == user_id,
                Notification.is_read == False,
            )
        )
        unread_count = unread_result.scalar()
        
        return {
            "notifications": list(notifications),
            "unread_count": unread_count,
            "total": total,
        }
    
    async def get_unread_count(self, user_id: UUID) -> int:
        """Get unread notification count for a user."""
        result = await self.db.execute(
            select(func.count()).where(
                Notification.user_id == user_id,
                Notification.is_read == False,
            )
        )
        return result.scalar()
    
    # ============== Mark as Read ==============
    
    async def mark_as_read(
        self,
        notification_id: UUID,
        user_id: UUID,
    ) -> bool:
        """Mark a single notification as read."""
        result = await self.db.execute(
            select(Notification).where(
                Notification.id == notification_id,
                Notification.user_id == user_id,
            )
        )
        notification = result.scalar_one_or_none()
        
        if not notification:
            raise HTTPException(status_code=404, detail="Notification not found")
        
        notification.is_read = True
        await self.db.commit()
        return True
    
    async def mark_all_as_read(self, user_id: UUID) -> int:
        """Mark all notifications as read for a user."""
        result = await self.db.execute(
            update(Notification)
            .where(
                Notification.user_id == user_id,
                Notification.is_read == False,
            )
            .values(is_read=True)
        )
        await self.db.commit()
        return result.rowcount

"""
Pickup Service - Business logic for zakat/kencleng pickup requests
"""

import random
import string
from typing import List, Optional
from uuid import UUID
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.pickup import PickupRequest
from app.schemas.pickup import PickupCreate, PickupSchedule, PickupComplete


def generate_pickup_code() -> str:
    """Generate unique pickup code."""
    return "PCK-" + "".join(random.choices(string.ascii_uppercase + string.digits, k=6))


class PickupService:
    """Service class for pickup operations."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_by_id(self, pickup_id: str) -> Optional[PickupRequest]:
        """Get pickup request by ID."""
        try:
            uuid_id = UUID(pickup_id)
        except ValueError:
            return None
        
        result = await self.db.execute(
            select(PickupRequest).where(PickupRequest.id == uuid_id)
        )
        return result.scalar_one_or_none()
    
    async def list_pickups(
        self,
        skip: int = 0,
        limit: int = 20,
        status: Optional[str] = None,
        requester_id: Optional[str] = None,
        assigned_to: Optional[str] = None,
        pickup_type: Optional[str] = None
    ) -> List[PickupRequest]:
        """List pickup requests with filters."""
        query = select(PickupRequest)
        
        if status:
            query = query.where(PickupRequest.status == status)
        if requester_id:
            query = query.where(PickupRequest.requester_id == UUID(requester_id))
        if assigned_to:
            query = query.where(PickupRequest.assigned_to == UUID(assigned_to))
        if pickup_type:
            query = query.where(PickupRequest.pickup_type == pickup_type)
        
        query = query.offset(skip).limit(limit).order_by(PickupRequest.created_at.desc())
        result = await self.db.execute(query)
        return list(result.scalars().all())
    
    async def create_request(self, data: PickupCreate, requester_id: Optional[UUID] = None) -> PickupRequest:
        """Create a new pickup request."""
        pickup = PickupRequest(
            request_code=generate_pickup_code(),
            requester_id=requester_id,
            requester_name=data.requester_name,
            requester_phone=data.requester_phone,
            pickup_type=data.pickup_type,
            pickup_address=data.pickup_address,
            pickup_lat=data.pickup_lat,
            pickup_lng=data.pickup_lng,
            preferred_date=data.preferred_date,
            preferred_time_slot=data.preferred_time_slot,
            notes=data.notes,
            status="pending"
        )
        
        self.db.add(pickup)
        await self.db.flush()
        await self.db.refresh(pickup)
        return pickup
    
    async def schedule_pickup(self, pickup_id: str, data: PickupSchedule, scheduled_by: UUID) -> Optional[PickupRequest]:
        """Schedule and assign a pickup."""
        pickup = await self.get_by_id(pickup_id)
        if not pickup:
            return None
        
        if pickup.status != "pending":
            raise HTTPException(status_code=400, detail="Pickup is not pending")
        
        pickup.status = "scheduled"
        pickup.assigned_to = data.assigned_to
        pickup.scheduled_by = scheduled_by
        pickup.scheduled_at = data.scheduled_at
        
        await self.db.flush()
        await self.db.refresh(pickup)
        return pickup
    
    async def assign_volunteer(self, pickup_id: str, volunteer_id: UUID, scheduled_by: UUID) -> Optional[PickupRequest]:
        """Assign volunteer to pickup."""
        pickup = await self.get_by_id(pickup_id)
        if not pickup:
            return None
        
        pickup.assigned_to = volunteer_id
        pickup.scheduled_by = scheduled_by
        pickup.scheduled_at = datetime.now(timezone.utc)
        
        if pickup.status == "pending":
            pickup.status = "scheduled"
        
        await self.db.flush()
        await self.db.refresh(pickup)
        return pickup
    
    async def start_pickup(self, pickup_id: str) -> Optional[PickupRequest]:
        """Mark pickup as in_progress."""
        pickup = await self.get_by_id(pickup_id)
        if not pickup:
            return None
        
        if pickup.status not in ["scheduled", "pending"]:
            raise HTTPException(status_code=400, detail="Pickup cannot be started")
        
        pickup.status = "in_progress"
        await self.db.flush()
        await self.db.refresh(pickup)
        return pickup
    
    async def complete_pickup(self, pickup_id: str, data: PickupComplete, proof_url: Optional[str] = None) -> Optional[PickupRequest]:
        """Mark pickup as completed."""
        pickup = await self.get_by_id(pickup_id)
        if not pickup:
            return None
        
        if pickup.status != "in_progress":
            raise HTTPException(status_code=400, detail="Pickup must be in progress to complete")
        
        pickup.status = "completed"
        pickup.completed_at = datetime.now(timezone.utc)
        pickup.collected_amount = data.collected_amount
        pickup.proof_url = proof_url
        
        if data.notes:
            pickup.notes = f"{pickup.notes or ''}\n\n[Completion Note]: {data.notes}".strip()
        
        await self.db.flush()
        await self.db.refresh(pickup)
        return pickup
    
    async def cancel_pickup(self, pickup_id: str, reason: Optional[str] = None) -> Optional[PickupRequest]:
        """Cancel a pickup request."""
        pickup = await self.get_by_id(pickup_id)
        if not pickup:
            return None
        
        if pickup.status in ["completed", "cancelled"]:
            raise HTTPException(status_code=400, detail="Cannot cancel completed or already cancelled pickup")
        
        pickup.status = "cancelled"
        if reason:
            pickup.notes = f"{pickup.notes or ''}\n\n[Cancel Reason]: {reason}".strip()
        
        await self.db.flush()
        await self.db.refresh(pickup)
        return pickup
    
    async def get_assigned_pickups(self, volunteer_id: str, status: Optional[str] = None) -> List[PickupRequest]:
        """Get pickups assigned to a volunteer."""
        query = select(PickupRequest).where(
            PickupRequest.assigned_to == UUID(volunteer_id)
        )
        
        if status:
            query = query.where(PickupRequest.status == status)
        
        query = query.order_by(PickupRequest.scheduled_at.asc())
        result = await self.db.execute(query)
        return list(result.scalars().all())
    
    async def get_stats(self) -> dict:
        """Get pickup statistics."""
        pending = await self.db.scalar(
            select(func.count()).select_from(PickupRequest).where(PickupRequest.status == "pending")
        )
        
        scheduled = await self.db.scalar(
            select(func.count()).select_from(PickupRequest).where(PickupRequest.status == "scheduled")
        )
        
        in_progress = await self.db.scalar(
            select(func.count()).select_from(PickupRequest).where(PickupRequest.status == "in_progress")
        )
        
        completed_today = await self.db.scalar(
            select(func.count()).select_from(PickupRequest).where(
                PickupRequest.status == "completed",
                func.date(PickupRequest.completed_at) == func.date(func.now())
            )
        )
        
        return {
            "pending": pending or 0,
            "scheduled": scheduled or 0,
            "in_progress": in_progress or 0,
            "completed_today": completed_today or 0
        }

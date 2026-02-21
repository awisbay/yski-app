"""
Pickup Routes
"""

from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, Body
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.media import save_upload_file
from app.core.database import get_db
from app.core.deps import get_current_user, require_role
from app.models.user import User
from app.schemas.pickup import PickupCreate, PickupResponse, PickupSchedule, PickupComplete, PickupReviewRequest
from app.services.pickup import PickupService

router = APIRouter()
ALLOWED_PICKUP_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"}
MAX_PICKUP_IMAGE_SIZE = 8 * 1024 * 1024


@router.get("", response_model=List[PickupResponse])
async def list_pickups(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    status: str = Query(None),
    pickup_type: str = Query(None),
    current_user: User = Depends(require_role("admin", "pengurus", "relawan")),
    db: AsyncSession = Depends(get_db)
):
    """List all pickups (Admin/Pengurus only)."""
    service = PickupService(db)
    pickups = await service.list_pickups(
        skip=skip, limit=limit, status=status, pickup_type=pickup_type
    )
    return pickups


@router.get("/my", response_model=List[PickupResponse])
async def get_my_pickups(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get current user's pickup requests."""
    service = PickupService(db)
    pickups = await service.list_pickups(requester_id=str(current_user.id))
    return pickups


@router.get("/assigned", response_model=List[PickupResponse])
async def get_assigned_pickups(
    status: str = Query(None),
    current_user: User = Depends(require_role("relawan")),
    db: AsyncSession = Depends(get_db)
):
    """Get pickups assigned to current volunteer."""
    service = PickupService(db)
    pickups = await service.get_assigned_pickups(str(current_user.id), status)
    return pickups


@router.get("/stats")
async def get_pickup_stats(
    current_user: User = Depends(require_role("admin", "pengurus")),
    db: AsyncSession = Depends(get_db)
):
    """Get pickup statistics (Admin/Pengurus only)."""
    service = PickupService(db)
    return await service.get_stats()


@router.get("/{pickup_id}", response_model=PickupResponse)
async def get_pickup(
    pickup_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get pickup by ID."""
    service = PickupService(db)
    pickup = await service.get_by_id(str(pickup_id))
    
    if not pickup:
        raise HTTPException(status_code=404, detail="Pickup not found")
    
    # Check ownership, assignment, or role
    if (pickup.requester_id != current_user.id and 
        pickup.assigned_to != current_user.id and
        current_user.role not in ["admin", "pengurus", "relawan"]):
        raise HTTPException(status_code=403, detail="Access denied")
    
    return pickup


@router.post("", response_model=PickupResponse, status_code=status.HTTP_201_CREATED)
async def create_pickup(
    pickup_data: PickupCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new pickup request."""
    service = PickupService(db)
    pickup = await service.create_request(pickup_data, current_user.id)
    return pickup


@router.post("/upload-photo")
async def upload_pickup_photo(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """Upload pickup item photo and return media URL."""
    media_url = await save_upload_file(
        file=file,
        subdir="pickups/photos",
        allowed_types=ALLOWED_PICKUP_IMAGE_TYPES,
        max_size_bytes=MAX_PICKUP_IMAGE_SIZE,
    )
    return {"photo_url": media_url}


@router.patch("/{pickup_id}/review", response_model=PickupResponse)
async def review_pickup(
    pickup_id: UUID,
    review_data: PickupReviewRequest,
    current_user: User = Depends(require_role("admin", "pengurus", "relawan")),
    db: AsyncSession = Depends(get_db)
):
    """Review incoming pickup request: accept now or confirm later."""
    service = PickupService(db)
    pickup = await service.review_pickup(str(pickup_id), current_user.id, review_data)
    if not pickup:
        raise HTTPException(status_code=404, detail="Pickup not found")
    return pickup


@router.patch("/{pickup_id}/assign", response_model=PickupResponse)
async def assign_pickup(
    pickup_id: UUID,
    volunteer_id: UUID,
    current_user: User = Depends(require_role("admin", "pengurus")),
    db: AsyncSession = Depends(get_db)
):
    """Assign volunteer to pickup (Admin/Pengurus only)."""
    service = PickupService(db)
    pickup = await service.assign_volunteer(str(pickup_id), volunteer_id, current_user.id)
    if not pickup:
        raise HTTPException(status_code=404, detail="Pickup not found")
    return pickup


@router.patch("/{pickup_id}/schedule", response_model=PickupResponse)
async def schedule_pickup(
    pickup_id: UUID,
    schedule_data: PickupSchedule,
    current_user: User = Depends(require_role("admin", "pengurus")),
    db: AsyncSession = Depends(get_db)
):
    """Schedule a pickup (Admin/Pengurus only)."""
    service = PickupService(db)
    pickup = await service.schedule_pickup(str(pickup_id), schedule_data, current_user.id)
    if not pickup:
        raise HTTPException(status_code=404, detail="Pickup not found")
    return pickup


@router.patch("/{pickup_id}/start", response_model=PickupResponse)
async def start_pickup(
    pickup_id: UUID,
    current_user: User = Depends(require_role("admin", "pengurus", "relawan")),
    db: AsyncSession = Depends(get_db)
):
    """Mark pickup as in_progress."""
    service = PickupService(db)
    pickup = await service.get_by_id(str(pickup_id))
    
    if not pickup:
        raise HTTPException(status_code=404, detail="Pickup not found")
    
    # Relawan can only update their assigned pickups
    if current_user.role == "relawan" and pickup.assigned_to != current_user.id:
        raise HTTPException(status_code=403, detail="Not assigned to this pickup")
    
    pickup = await service.start_pickup(str(pickup_id))
    return pickup


@router.patch("/{pickup_id}/complete", response_model=PickupResponse)
async def complete_pickup(
    pickup_id: UUID,
    complete_data: PickupComplete,
    current_user: User = Depends(require_role("admin", "pengurus", "relawan")),
    db: AsyncSession = Depends(get_db)
):
    """Mark pickup as completed."""
    service = PickupService(db)
    pickup = await service.get_by_id(str(pickup_id))
    
    if not pickup:
        raise HTTPException(status_code=404, detail="Pickup not found")
    
    # Relawan can only update their assigned pickups
    if current_user.role == "relawan" and pickup.assigned_to != current_user.id:
        raise HTTPException(status_code=403, detail="Not assigned to this pickup")
    
    pickup = await service.complete_pickup(str(pickup_id), complete_data)
    return pickup


@router.patch("/{pickup_id}/cancel", response_model=PickupResponse)
async def cancel_pickup(
    pickup_id: UUID,
    reason: str = Query(None),
    payload: dict | None = Body(default=None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Cancel a pickup request."""
    service = PickupService(db)
    pickup = await service.get_by_id(str(pickup_id))
    
    if not pickup:
        raise HTTPException(status_code=404, detail="Pickup not found")
    
    # Can only cancel own pickup or admin/pengurus
    if (pickup.requester_id != current_user.id and 
        current_user.role not in ["admin", "pengurus"]):
        raise HTTPException(status_code=403, detail="Access denied")
    
    body_reason = payload.get("cancellation_reason") if isinstance(payload, dict) else None
    pickup = await service.cancel_pickup(str(pickup_id), body_reason or reason)
    return pickup

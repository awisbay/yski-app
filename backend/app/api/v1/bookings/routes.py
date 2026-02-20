"""
Booking Routes
"""

from datetime import date
from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.deps import get_current_user, require_role
from app.models.user import User
from app.schemas.booking import BookingCreate, BookingResponse, SlotsResponse
from app.services.booking import BookingService
from app.services.notification_service import NotificationService

router = APIRouter()


@router.get("/slots", response_model=SlotsResponse)
async def get_available_slots(
    date: date = Query(..., description="Date to check availability"),
    db: AsyncSession = Depends(get_db)
):
    """Get available time slots for a specific date."""
    service = BookingService(db)
    slots = await service.get_available_slots(date)
    return {"date": date, "slots": slots}


@router.get("/my", response_model=List[BookingResponse])
async def get_my_bookings(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get current user's bookings."""
    service = BookingService(db)
    bookings = await service.list_bookings(requester_id=str(current_user.id))
    return bookings


@router.get("", response_model=List[BookingResponse])
async def list_bookings(
    status: str = Query(None, description="Filter by status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_role("admin", "pengurus", "relawan")),
    db: AsyncSession = Depends(get_db)
):
    """List all bookings (Admin/Pengurus/Relawan only)."""
    service = BookingService(db)
    bookings = await service.list_bookings(skip=skip, limit=limit, status=status)
    return bookings


@router.post("", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
async def create_booking(
    booking_data: BookingCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new booking."""
    service = BookingService(db)
    requester_phone = current_user.phone or booking_data.requester_phone
    if not requester_phone:
        raise HTTPException(status_code=400, detail="Nomor telepon pengguna belum tersedia")

    booking = await service.create_booking(
        booking_data,
        current_user.id,
        current_user.full_name,
        requester_phone,
    )

    # Notify operational roles when a new booking comes in.
    staff_result = await db.execute(
        select(User.id).where(
            User.role.in_(["admin", "pengurus", "relawan"]),
            User.is_active == True,  # noqa: E712
            User.id != current_user.id,
        )
    )
    staff_user_ids = [row[0] for row in staff_result.all()]
    if staff_user_ids:
        notif_service = NotificationService(db)
        await notif_service.create_bulk_notifications(
            user_ids=staff_user_ids,
            title="Booking Pickup Baru Masuk",
            body=f"{current_user.full_name} membuat booking untuk {booking.booking_date} jam {booking.time_slot}.",
            type="info",
            reference_type="booking",
            reference_id=booking.id,
        )
    return booking


@router.get("/{booking_id}", response_model=BookingResponse)
async def get_booking(
    booking_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get booking details."""
    service = BookingService(db)
    booking = await service.get_by_id(str(booking_id))
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Check ownership or role
    if (booking.requester_id != current_user.id and 
        current_user.role not in ["admin", "pengurus"] and
        booking.assigned_to != current_user.id):
        raise HTTPException(status_code=403, detail="Access denied")
    
    return booking


@router.patch("/{booking_id}/approve", response_model=BookingResponse)
async def approve_booking(
    booking_id: UUID,
    current_user: User = Depends(require_role("admin", "pengurus", "relawan")),
    db: AsyncSession = Depends(get_db)
):
    """Approve a pending booking (Admin/Pengurus/Relawan)."""
    service = BookingService(db)
    booking = await service.update_status(str(booking_id), "approved", current_user.id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return booking


@router.patch("/{booking_id}/reject", response_model=BookingResponse)
async def reject_booking(
    booking_id: UUID,
    current_user: User = Depends(require_role("admin", "pengurus", "relawan")),
    db: AsyncSession = Depends(get_db)
):
    """Reject a pending booking (Admin/Pengurus/Relawan)."""
    service = BookingService(db)
    booking = await service.update_status(str(booking_id), "rejected", current_user.id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return booking


@router.patch("/{booking_id}/cancel", response_model=BookingResponse)
async def cancel_booking(
    booking_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Cancel own pending booking."""
    service = BookingService(db)
    booking = await service.get_by_id(str(booking_id))
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking.requester_id != current_user.id:
        raise HTTPException(status_code=403, detail="Can only cancel own bookings")
    
    if booking.status != "pending":
        raise HTTPException(status_code=400, detail="Can only cancel pending bookings")
    
    booking = await service.update_status(str(booking_id), "cancelled", current_user.id)
    return booking


@router.patch("/{booking_id}/assign", response_model=BookingResponse)
async def assign_volunteer(
    booking_id: UUID,
    volunteer_id: UUID,
    current_user: User = Depends(require_role("admin", "pengurus")),
    db: AsyncSession = Depends(get_db)
):
    """Assign volunteer to booking."""
    service = BookingService(db)
    booking = await service.assign_volunteer(str(booking_id), volunteer_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return booking


@router.patch("/{booking_id}/status", response_model=BookingResponse)
async def update_booking_status(
    booking_id: UUID,
    status: str = Query(..., regex="^(in_progress|completed)$"),
    current_user: User = Depends(require_role("admin", "pengurus", "relawan")),
    db: AsyncSession = Depends(get_db)
):
    """Update booking status (Relawan assigned only)."""
    service = BookingService(db)
    booking = await service.get_by_id(str(booking_id))
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Relawan can only update their assigned bookings
    if current_user.role == "relawan" and booking.assigned_to != current_user.id:
        raise HTTPException(status_code=403, detail="Not assigned to this booking")
    
    booking = await service.update_status(str(booking_id), status, current_user.id)
    return booking

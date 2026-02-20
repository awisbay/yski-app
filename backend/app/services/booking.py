"""
Booking Service - Business logic for pickup bookings
"""

import random
import string
from datetime import date, timedelta
from typing import List, Optional
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError, ProgrammingError, SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.booking import MovingBooking
from app.schemas.booking import BookingCreate, BookingUpdate

ALLOWED_SLOTS = ["08:00", "10:00", "13:00", "15:00", "17:00", "19:00", "21:00"]
MAX_ADVANCE_DAYS = 30
MAX_SLOTS_PER_DAY_PER_USER = len(ALLOWED_SLOTS)


def generate_booking_code() -> str:
    """Generate unique booking code."""
    return "BKG-" + "".join(random.choices(string.ascii_uppercase + string.digits, k=8))


def _extract_slots(booking: MovingBooking) -> set[str]:
    """Extract all occupied slots from a booking row (supports legacy and multi-slot)."""
    slots: set[str] = set()
    if booking.time_slot:
        slots.add(booking.time_slot)
    if booking.time_slots:
        slots.update({s.strip() for s in booking.time_slots.split(",") if s.strip()})
    return slots


class BookingService:
    """Service class for booking operations."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_by_id(self, booking_id: str) -> Optional[MovingBooking]:
        """Get booking by ID."""
        try:
            uuid_id = UUID(booking_id)
        except ValueError:
            return None
        
        result = await self.db.execute(
            select(MovingBooking).where(MovingBooking.id == uuid_id)
        )
        return result.scalar_one_or_none()
    
    async def list_bookings(
        self,
        skip: int = 0,
        limit: int = 20,
        status: Optional[str] = None,
        requester_id: Optional[str] = None
    ) -> List[MovingBooking]:
        """List bookings with filters."""
        query = select(MovingBooking)
        
        if status:
            query = query.where(MovingBooking.status == status)
        if requester_id:
            query = query.where(MovingBooking.requester_id == UUID(requester_id))
        
        query = query.offset(skip).limit(limit).order_by(MovingBooking.created_at.desc())
        result = await self.db.execute(query)
        return list(result.scalars().all())
    
    async def create_booking(
        self,
        data: BookingCreate,
        requester_id: UUID,
        requester_name: str,
        requester_phone: str,
    ) -> MovingBooking:
        """Create a new booking with anti double-booking."""
        # Business validation
        selected_slots = list(dict.fromkeys(data.time_slots or [data.time_slot]))
        if not selected_slots:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Minimal 1 slot harus dipilih")

        invalid_slots = [slot for slot in selected_slots if slot not in ALLOWED_SLOTS]
        if invalid_slots:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid time slot. Allowed: {ALLOWED_SLOTS}"
            )
        
        today = date.today()
        if data.booking_date <= today:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Booking date must be in the future"
            )
        
        if data.booking_date > today + timedelta(days=MAX_ADVANCE_DAYS):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot book more than {MAX_ADVANCE_DAYS} days ahead"
            )
        
        # Lock all active bookings on the date, then validate overlaps safely.
        same_day_result = await self.db.execute(
            select(MovingBooking)
            .with_for_update()
            .where(
                MovingBooking.booking_date == data.booking_date,
                MovingBooking.status.notin_(["rejected", "cancelled"])
            )
        )
        same_day_bookings = list(same_day_result.scalars().all())

        requester_occupied: set[str] = set()
        occupied_by_others: set[str] = set()
        for booking_row in same_day_bookings:
            occupied = _extract_slots(booking_row)
            if booking_row.requester_id == requester_id:
                requester_occupied.update(occupied)
            else:
                occupied_by_others.update(occupied)

        # User can book up to all slots in a day, but not duplicate their own slot booking.
        if len(requester_occupied.union(selected_slots)) > MAX_SLOTS_PER_DAY_PER_USER:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Anda sudah memesan seluruh slot untuk tanggal {data.booking_date}"
            )

        if requester_occupied.intersection(selected_slots):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Anda sudah memesan salah satu slot yang dipilih pada tanggal ini"
            )

        conflicted = sorted(occupied_by_others.intersection(selected_slots))
        if conflicted:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Slot berikut sudah dibooking pengguna lain: {', '.join(conflicted)}"
            )
        
        # Create one booking row for all selected slots.
        booking = MovingBooking(
            booking_code=generate_booking_code(),
            booking_date=data.booking_date,
            time_slot=selected_slots[0],
            time_slots=",".join(selected_slots),
            requester_id=requester_id,
            requester_name=requester_name,
            requester_phone=requester_phone,
            pickup_address=data.pickup_address,
            pickup_lat=data.pickup_lat,
            pickup_lng=data.pickup_lng,
            dropoff_address=data.dropoff_address,
            dropoff_lat=data.dropoff_lat,
            dropoff_lng=data.dropoff_lng,
            purpose=data.purpose,
            notes=data.notes,
            status="pending"
        )
        
        self.db.add(booking)
        try:
            await self.db.flush()
            await self.db.refresh(booking)
        except IntegrityError:
            await self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This slot was just booked by someone else"
            )
        except ProgrammingError as exc:
            await self.db.rollback()
            error_text = str(exc).lower()
            if "purpose" in error_text and "moving_bookings" in error_text:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Database booking belum update. Jalankan migrasi Alembic terbaru (revision 004).",
                )
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Terjadi kesalahan struktur database saat membuat booking.",
            )
        except SQLAlchemyError:
            await self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Terjadi kesalahan database saat membuat booking.",
            )
        
        return booking
    
    async def get_available_slots(self, target_date: date) -> List[dict]:
        """Get available slots for a date."""
        today = date.today()
        if target_date <= today:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Date must be in the future"
            )
        
        if target_date > today + timedelta(days=MAX_ADVANCE_DAYS):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot check more than {MAX_ADVANCE_DAYS} days ahead"
            )
        
        # Get booked slots
        result = await self.db.execute(
            select(MovingBooking).where(
                MovingBooking.booking_date == target_date,
                MovingBooking.status.notin_(["rejected", "cancelled"])
            )
        )
        booked_slots: set[str] = set()
        for booking in result.scalars().all():
            booked_slots.update(_extract_slots(booking))
        
        return [
            {"time": slot, "available": slot not in booked_slots}
            for slot in ALLOWED_SLOTS
        ]
    
    # Valid booking status transitions
    VALID_TRANSITIONS = {
        "pending": {"approved", "rejected", "cancelled"},
        "approved": {"in_progress", "cancelled"},
        "confirmed": {"in_progress", "cancelled"},
        "in_progress": {"completed", "cancelled"},
        "rejected": set(),
        "completed": set(),
        "cancelled": set(),
    }

    async def update_status(self, booking_id: str, new_status: str, user_id: UUID) -> Optional[MovingBooking]:
        """Update booking status with transition validation."""
        booking = await self.get_by_id(booking_id)
        if not booking:
            return None

        allowed = self.VALID_TRANSITIONS.get(booking.status, set())
        if new_status not in allowed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot transition from '{booking.status}' to '{new_status}'",
            )

        booking.status = new_status

        if new_status == "approved":
            booking.approved_by = user_id
        elif new_status in ("in_progress", "completed"):
            booking.assigned_to = user_id

        await self.db.flush()
        await self.db.refresh(booking)
        return booking
    
    async def assign_volunteer(self, booking_id: str, volunteer_id: UUID) -> Optional[MovingBooking]:
        """Assign volunteer to booking."""
        booking = await self.get_by_id(booking_id)
        if not booking:
            return None
        
        booking.assigned_to = volunteer_id
        await self.db.flush()
        await self.db.refresh(booking)
        return booking
    
    async def add_review(self, booking_id: str, rating: int, review_text: str) -> Optional[MovingBooking]:
        """Add review to completed booking."""
        booking = await self.get_by_id(booking_id)
        if not booking:
            return None
        
        if booking.status != "completed":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Can only review completed bookings"
            )
        
        booking.rating = rating
        booking.review_text = review_text
        await self.db.flush()
        await self.db.refresh(booking)
        return booking

# Booking Engine Specification (Armada Pindahan)

> Single-armada moving service booking with anti double-booking guarantees.

## Database Schema

```sql
CREATE TABLE moving_bookings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_code    VARCHAR(16) NOT NULL UNIQUE,
    booking_date    DATE NOT NULL,
    time_slot       VARCHAR(5) NOT NULL,  -- '08:00', '10:00', '13:00', '15:00'

    -- Requester (Sahabat)
    requester_id    UUID NOT NULL REFERENCES users(id),
    requester_name  VARCHAR(255) NOT NULL,
    requester_phone VARCHAR(20) NOT NULL,

    -- Addresses
    pickup_address  TEXT NOT NULL,
    pickup_lat      DECIMAL(10, 7),
    pickup_lng      DECIMAL(10, 7),
    dropoff_address TEXT NOT NULL,
    dropoff_lat     DECIMAL(10, 7),
    dropoff_lng     DECIMAL(10, 7),

    notes           TEXT,

    -- Workflow
    status          VARCHAR(20) NOT NULL DEFAULT 'pending',
    assigned_to     UUID REFERENCES users(id),  -- Relawan
    approved_by     UUID REFERENCES users(id),  -- Pengurus

    -- Rating (after completion)
    rating          SMALLINT CHECK (rating >= 1 AND rating <= 5),
    review_text     TEXT,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Anti double-booking Layer 1: DB-level UNIQUE constraint
    CONSTRAINT uq_booking_date_slot UNIQUE (booking_date, time_slot)
);

CREATE INDEX idx_bookings_date ON moving_bookings(booking_date);
CREATE INDEX idx_bookings_status ON moving_bookings(status);
CREATE INDEX idx_bookings_requester ON moving_bookings(requester_id);
```

## Time Slots

| Slot | Time  |
|------|-------|
| 1    | 08:00 |
| 2    | 10:00 |
| 3    | 13:00 |
| 4    | 15:00 |

- 4 slots per day, single armada model: **1 slot = 1 booking max**.
- Cancelled or rejected bookings free up the slot (row is soft-deleted or status excluded from UNIQUE via partial index if needed).

## Anti Double-Booking: 3-Layer Strategy

### Layer 1 -- DB UNIQUE Constraint

```
CONSTRAINT uq_booking_date_slot UNIQUE (booking_date, time_slot)
```

100% safe at the database level. Even if application logic fails, PostgreSQL will reject duplicate inserts with an `IntegrityError`.

### Layer 2 -- SELECT FOR UPDATE (Pessimistic Locking)

Before inserting, the service acquires a row-level lock on any existing booking for that date+slot. This prevents two concurrent transactions from both passing the check and attempting to insert.

### Layer 3 -- Business Validation

- `booking_date` must be in the future (not today or earlier).
- `booking_date` must be at most 30 days ahead.
- `time_slot` must be one of the 4 allowed values.
- Requester cannot have more than 2 active (pending/approved) bookings at a time.

## Status Flow

```
pending ──> approved ──> in_progress ──> completed
   │
   ├──> rejected
   └──> cancelled
```

- **pending**: Sahabat created the booking, awaiting Pengurus review.
- **approved**: Pengurus approved; Relawan may be assigned.
- **in_progress**: Relawan has started the move.
- **completed**: Move finished; Sahabat can now rate.
- **rejected**: Pengurus declined the booking (slot freed).
- **cancelled**: Sahabat cancelled before approval (slot freed).

## API Endpoints

| Method | Path                          | Role(s)            | Description                        |
|--------|-------------------------------|--------------------|------------------------------------|
| POST   | /bookings                     | Sahabat            | Create a new booking               |
| GET    | /bookings/slots               | Any authenticated  | Get available slots for a date     |
| GET    | /bookings                     | Pengurus, Admin    | List all bookings (filterable)     |
| GET    | /bookings/my                  | Sahabat            | List own bookings                  |
| GET    | /bookings/{id}                | Owner, Pengurus    | Get booking detail                 |
| PATCH  | /bookings/{id}/approve        | Pengurus           | Approve a pending booking          |
| PATCH  | /bookings/{id}/reject         | Pengurus           | Reject a pending booking           |
| PATCH  | /bookings/{id}/assign         | Pengurus           | Assign a Relawan                   |
| PATCH  | /bookings/{id}/status         | Relawan            | Update status (in_progress, etc.)  |
| PATCH  | /bookings/{id}/cancel         | Sahabat            | Cancel own pending booking         |
| POST   | /bookings/{id}/review         | Sahabat            | Submit rating + review text        |

### Slot Availability

```
GET /bookings/slots?date=2026-03-15
```

Response:

```json
{
  "date": "2026-03-15",
  "slots": [
    { "time": "08:00", "available": true },
    { "time": "10:00", "available": false },
    { "time": "13:00", "available": true },
    { "time": "15:00", "available": true }
  ]
}
```

### Calendar View

```
GET /bookings/slots/calendar?month=2026-03
```

Returns dates in the month with availability summary. Dates where all 4 slots are booked are flagged as `fully_booked: true` (shown as red/unavailable in the frontend calendar).

## Booking Flow

1. **Sahabat** opens the booking page, selects a date, sees available slots.
2. **Sahabat** selects a slot, fills in pickup/dropoff addresses and notes, submits.
3. **Pengurus** sees pending bookings in the dashboard, reviews and approves or rejects.
4. **Pengurus** assigns a **Relawan** to the approved booking.
5. **Relawan** updates status to `in_progress` when starting and `completed` when done.
6. **Sahabat** receives a notification and can submit a rating (1-5) + review text.

## Service Implementation

```python
# app/services/booking_service.py

from datetime import date, timedelta
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.booking import MovingBooking
from app.schemas.booking import BookingCreate

ALLOWED_SLOTS = ["08:00", "10:00", "13:00", "15:00"]
MAX_ADVANCE_DAYS = 30
MAX_ACTIVE_BOOKINGS = 2


class BookingService:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_booking(
        self, data: BookingCreate, requester_id: UUID
    ) -> MovingBooking:
        """
        Create a booking with 3-layer anti double-booking protection.
        """
        # --- Layer 3: Business validation ---
        if data.time_slot not in ALLOWED_SLOTS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid time slot. Allowed: {ALLOWED_SLOTS}",
            )

        today = date.today()
        if data.booking_date <= today:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Booking date must be in the future.",
            )

        if data.booking_date > today + timedelta(days=MAX_ADVANCE_DAYS):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot book more than {MAX_ADVANCE_DAYS} days ahead.",
            )

        # Check active booking limit for requester
        active_count_q = select(
            text("COUNT(*)")
        ).select_from(MovingBooking).where(
            MovingBooking.requester_id == requester_id,
            MovingBooking.status.in_(["pending", "approved"]),
        )
        result = await self.db.execute(active_count_q)
        if result.scalar() >= MAX_ACTIVE_BOOKINGS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"You already have {MAX_ACTIVE_BOOKINGS} active bookings.",
            )

        # --- Layer 2: Pessimistic lock (SELECT FOR UPDATE) ---
        lock_q = (
            select(MovingBooking)
            .where(
                MovingBooking.booking_date == data.booking_date,
                MovingBooking.time_slot == data.time_slot,
                MovingBooking.status.notin_(["rejected", "cancelled"]),
            )
            .with_for_update()
        )
        existing = await self.db.execute(lock_q)
        if existing.scalar_one_or_none() is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This slot is already booked.",
            )

        # --- Layer 1: DB UNIQUE constraint as final safety net ---
        booking = MovingBooking(
            booking_date=data.booking_date,
            time_slot=data.time_slot,
            requester_id=requester_id,
            requester_name=data.requester_name,
            requester_phone=data.requester_phone,
            pickup_address=data.pickup_address,
            pickup_lat=data.pickup_lat,
            pickup_lng=data.pickup_lng,
            dropoff_address=data.dropoff_address,
            dropoff_lat=data.dropoff_lat,
            dropoff_lng=data.dropoff_lng,
            notes=data.notes,
            status="pending",
        )
        self.db.add(booking)

        try:
            await self.db.flush()
        except IntegrityError:
            await self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This slot was just booked by someone else.",
            )

        await self.db.commit()
        await self.db.refresh(booking)
        return booking

    async def get_available_slots(self, target_date: date) -> list[dict]:
        """
        Return the list of time slots for a given date with availability.
        """
        today = date.today()
        if target_date <= today:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Date must be in the future.",
            )

        if target_date > today + timedelta(days=MAX_ADVANCE_DAYS):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot check more than {MAX_ADVANCE_DAYS} days ahead.",
            )

        # Fetch booked slots for the date (excluding rejected/cancelled)
        q = select(MovingBooking.time_slot).where(
            MovingBooking.booking_date == target_date,
            MovingBooking.status.notin_(["rejected", "cancelled"]),
        )
        result = await self.db.execute(q)
        booked_slots = {row[0] for row in result.all()}

        return [
            {"time": slot, "available": slot not in booked_slots}
            for slot in ALLOWED_SLOTS
        ]
```

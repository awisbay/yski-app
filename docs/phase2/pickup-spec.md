# Jemput Zakat & Kencleng Specification

> Pickup service for zakat collection and kencleng (infaq collection boxes).

## Database Schema

```sql
CREATE TABLE pickup_requests (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pickup_code       VARCHAR(16) NOT NULL UNIQUE,

    -- Donation type
    donation_type     VARCHAR(20) NOT NULL,  -- zakat, kencleng_infaq

    -- Requester
    requester_id      UUID REFERENCES users(id),
    requester_name    VARCHAR(255) NOT NULL,
    requester_phone   VARCHAR(20) NOT NULL,

    -- Address
    pickup_address    TEXT NOT NULL,
    pickup_lat        DECIMAL(10, 7),
    pickup_lng        DECIMAL(10, 7),

    -- Scheduling
    preferred_date    DATE,
    preferred_slot    VARCHAR(20),           -- '09:00-12:00', '13:00-15:00', '16:00-18:00'
    scheduled_date    DATE,                  -- set by Pengurus
    scheduled_slot    VARCHAR(20),           -- set by Pengurus

    -- Assignment
    assigned_to       UUID REFERENCES users(id),  -- Relawan
    scheduled_by      UUID REFERENCES users(id),  -- Pengurus

    -- Completion
    status            VARCHAR(20) NOT NULL DEFAULT 'pending',
    collected_amount  DECIMAL(15, 2),
    proof_photo_url   VARCHAR(512),          -- stored in MinIO
    completion_notes  TEXT,
    completed_at      TIMESTAMPTZ,

    notes             TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pickup_status ON pickup_requests(status);
CREATE INDEX idx_pickup_requester ON pickup_requests(requester_id);
CREATE INDEX idx_pickup_assigned ON pickup_requests(assigned_to);
CREATE INDEX idx_pickup_scheduled ON pickup_requests(scheduled_date);
```

## Donation Types

| Type           | Description                              |
|----------------|------------------------------------------|
| zakat          | Zakat pickup from donor's location       |
| kencleng_infaq | Kencleng (infaq box) collection/exchange |

## Required & Optional Fields

**Required:**
- `requester_name` -- name of the person requesting pickup
- `requester_phone` -- contact phone number
- `donation_type` -- zakat or kencleng_infaq
- `pickup_address` -- full address text
- `pickup_lat` / `pickup_lng` -- GPS coordinates (captured from device)

**Optional:**
- `preferred_date` -- requested pickup date
- `preferred_slot` -- requested time window
- `notes` -- additional notes from the requester

## Time Slots

| Slot           | Window        |
|----------------|---------------|
| Morning        | 09:00 - 12:00 |
| Afternoon      | 13:00 - 15:00 |
| Evening        | 16:00 - 18:00 |

## Status Flow

```
pending ──> scheduled ──> in_progress ──> completed
   │
   └──> cancelled
```

- **pending**: Requester submitted; awaiting Pengurus review.
- **scheduled**: Pengurus set the date, slot, and assigned a Relawan.
- **in_progress**: Relawan is on the way or at the location.
- **completed**: Pickup done; proof photo uploaded and amount recorded.
- **cancelled**: Request cancelled by requester or Pengurus.

## Pickup Flow

1. **Requester** (Sahabat or public) submits a pickup request with address, GPS coordinates, donation type, and optional preferred date/slot.
2. **Pengurus** reviews incoming requests, sets `scheduled_date` and `scheduled_slot`, and assigns a **Relawan**.
3. **Requester** receives a notification (WhatsApp + push) confirming the schedule.
4. **Relawan** updates status to `in_progress` when heading to the location.
5. **Relawan** arrives, collects the donation, and:
   - Uploads a **proof photo** (stored in MinIO via the file upload endpoint).
   - Records the `collected_amount`.
   - Adds optional `completion_notes`.
6. **Pengurus** verifies the proof and marks the request as `completed`.
7. **Requester** receives a completion notification with a summary.

## Proof Photo Upload

Photos are uploaded to MinIO under the bucket/path:

```
pickups/{pickup_id}/proof_{timestamp}.jpg
```

The upload endpoint returns a URL that is stored in `proof_photo_url`.

## Notifications

| Event                        | Channel              | Recipient     |
|------------------------------|----------------------|---------------|
| Pickup scheduled             | WhatsApp + Push      | Requester     |
| Relawan assigned             | Push                 | Relawan       |
| Pickup completed             | WhatsApp + Push      | Requester     |
| New pickup request           | Push                 | Pengurus      |

## API Endpoints

| Method | Path                             | Role(s)            | Description                         |
|--------|----------------------------------|--------------------|-------------------------------------|
| POST   | /pickups                         | Sahabat, Public    | Submit a pickup request             |
| GET    | /pickups                         | Pengurus, Admin    | List all pickup requests            |
| GET    | /pickups/my                      | Sahabat            | List own pickup requests            |
| GET    | /pickups/{id}                    | Owner, Pengurus    | Pickup request detail               |
| PATCH  | /pickups/{id}/schedule           | Pengurus           | Set date, slot, assign relawan      |
| PATCH  | /pickups/{id}/status             | Relawan            | Update status (in_progress)         |
| POST   | /pickups/{id}/complete           | Relawan            | Upload proof + amount, mark done    |
| PATCH  | /pickups/{id}/verify             | Pengurus           | Verify and finalize completion      |
| PATCH  | /pickups/{id}/cancel             | Sahabat, Pengurus  | Cancel the request                  |

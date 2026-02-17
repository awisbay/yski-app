# Bookings (Pindahan) API Contract

Base URL: `/api/v1`

All authenticated endpoints require `Authorization: Bearer <token>` header.

---

## POST /bookings

Create a new booking pindahan (moving service request).

- **Required Role:** `sahabat`

### Request Body

```json
{
  "booking_date": "string (required, YYYY-MM-DD)",
  "time_slot": "string (required, e.g. '08:00')",
  "pickup_address": "string (required)",
  "pickup_lat": "number (required)",
  "pickup_lng": "number (required)",
  "dest_address": "string (required)",
  "dest_lat": "number (required)",
  "dest_lng": "number (required)",
  "notes": "string (optional)"
}
```

### Success Response — `201 Created`

```json
{
  "status": "success",
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "booking_date": "2024-03-20",
    "time_slot": "08:00",
    "pickup_address": "Jl. Merdeka No. 10, Jakarta",
    "pickup_lat": -6.2088,
    "pickup_lng": 106.8456,
    "dest_address": "Jl. Sudirman No. 5, Jakarta",
    "dest_lat": -6.2250,
    "dest_lng": 106.8300,
    "notes": "Barang fragile, mohon hati-hati",
    "status": "pending",
    "assigned_to": null,
    "created_at": "2024-03-15T10:30:00Z",
    "updated_at": "2024-03-15T10:30:00Z"
  }
}
```

### Example

```bash
curl -X POST https://api.example.com/api/v1/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{
    "booking_date": "2024-03-20",
    "time_slot": "08:00",
    "pickup_address": "Jl. Merdeka No. 10, Jakarta",
    "pickup_lat": -6.2088,
    "pickup_lng": 106.8456,
    "dest_address": "Jl. Sudirman No. 5, Jakarta",
    "dest_lat": -6.2250,
    "dest_lng": 106.8300,
    "notes": "Barang fragile, mohon hati-hati"
  }'
```

---

## GET /bookings

List bookings. Results are filtered by role:
- **sahabat** sees only their own bookings
- **pengurus** / **admin** sees all bookings
- **relawan** sees only bookings assigned to them

- **Required Role:** Authenticated (all roles)

### Query Parameters

| Parameter | Type   | Description                          |
|-----------|--------|--------------------------------------|
| status    | string | Filter by status                     |
| page      | int    | Page number (default: 1)             |
| limit     | int    | Items per page (default: 20)         |

### Success Response — `200 OK`

```json
{
  "status": "success",
  "data": {
    "items": [
      {
        "id": "uuid",
        "user_id": "uuid",
        "user_name": "Ahmad Fauzi",
        "booking_date": "2024-03-20",
        "time_slot": "08:00",
        "pickup_address": "Jl. Merdeka No. 10, Jakarta",
        "dest_address": "Jl. Sudirman No. 5, Jakarta",
        "status": "pending",
        "assigned_to": null,
        "assigned_name": null,
        "created_at": "2024-03-15T10:30:00Z"
      }
    ],
    "total": 25,
    "page": 1,
    "limit": 20,
    "pages": 2
  }
}
```

### Example

```bash
curl -X GET "https://api.example.com/api/v1/bookings?status=pending&page=1&limit=20" \
  -H "Authorization: Bearer <access_token>"
```

---

## GET /bookings/{id}

Get booking detail by ID.

- **Required Role:** Authenticated (all roles)

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| id        | uuid | Booking ID  |

### Success Response — `200 OK`

```json
{
  "status": "success",
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "user_name": "Ahmad Fauzi",
    "booking_date": "2024-03-20",
    "time_slot": "08:00",
    "pickup_address": "Jl. Merdeka No. 10, Jakarta",
    "pickup_lat": -6.2088,
    "pickup_lng": 106.8456,
    "dest_address": "Jl. Sudirman No. 5, Jakarta",
    "dest_lat": -6.2250,
    "dest_lng": 106.8300,
    "notes": "Barang fragile, mohon hati-hati",
    "status": "approved",
    "assigned_to": "uuid",
    "assigned_name": "Budi Santoso",
    "rejection_reason": null,
    "review": {
      "rating": 5,
      "review_text": "Pelayanan sangat baik!",
      "created_at": "2024-03-21T14:00:00Z"
    },
    "created_at": "2024-03-15T10:30:00Z",
    "updated_at": "2024-03-18T09:00:00Z"
  }
}
```

### Example

```bash
curl -X GET https://api.example.com/api/v1/bookings/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer <access_token>"
```

---

## GET /bookings/slots

Get available time slots for a given date.

- **Required Role:** `sahabat`

### Query Parameters

| Parameter | Type   | Description                          |
|-----------|--------|--------------------------------------|
| date      | string | Date in YYYY-MM-DD format (required) |

### Success Response — `200 OK`

```json
{
  "status": "success",
  "data": {
    "date": "2024-03-20",
    "available_slots": [
      "08:00",
      "10:00",
      "13:00",
      "15:00"
    ]
  }
}
```

### Example

```bash
curl -X GET "https://api.example.com/api/v1/bookings/slots?date=2024-03-20" \
  -H "Authorization: Bearer <access_token>"
```

---

## PATCH /bookings/{id}/approve

Approve a pending booking.

- **Required Role:** `pengurus`

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| id        | uuid | Booking ID  |

### Request Body

```json
{
  "notes": "string (optional)"
}
```

### Success Response — `200 OK`

```json
{
  "status": "success",
  "data": {
    "id": "uuid",
    "status": "approved",
    "notes": "Disetujui, akan dijadwalkan segera",
    "updated_at": "2024-03-16T08:00:00Z"
  }
}
```

### Example

```bash
curl -X PATCH https://api.example.com/api/v1/bookings/550e8400-e29b-41d4-a716-446655440000/approve \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{
    "notes": "Disetujui, akan dijadwalkan segera"
  }'
```

---

## PATCH /bookings/{id}/reject

Reject a pending booking.

- **Required Role:** `pengurus`

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| id        | uuid | Booking ID  |

### Request Body

```json
{
  "rejection_reason": "string (required)"
}
```

### Success Response — `200 OK`

```json
{
  "status": "success",
  "data": {
    "id": "uuid",
    "status": "rejected",
    "rejection_reason": "Jadwal penuh pada tanggal tersebut",
    "updated_at": "2024-03-16T08:00:00Z"
  }
}
```

### Example

```bash
curl -X PATCH https://api.example.com/api/v1/bookings/550e8400-e29b-41d4-a716-446655440000/reject \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{
    "rejection_reason": "Jadwal penuh pada tanggal tersebut"
  }'
```

---

## PATCH /bookings/{id}/assign

Assign a relawan (volunteer) to a booking.

- **Required Role:** `pengurus`

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| id        | uuid | Booking ID  |

### Request Body

```json
{
  "assigned_to": "uuid (required, relawan user ID)"
}
```

### Success Response — `200 OK`

```json
{
  "status": "success",
  "data": {
    "id": "uuid",
    "status": "assigned",
    "assigned_to": "uuid",
    "assigned_name": "Budi Santoso",
    "updated_at": "2024-03-16T09:00:00Z"
  }
}
```

### Example

```bash
curl -X PATCH https://api.example.com/api/v1/bookings/550e8400-e29b-41d4-a716-446655440000/assign \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{
    "assigned_to": "660e8400-e29b-41d4-a716-446655440001"
  }'
```

---

## PATCH /bookings/{id}/status

Update booking status (for in-progress/completed workflow).

- **Required Role:** `relawan`

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| id        | uuid | Booking ID  |

### Request Body

```json
{
  "status": "string (required, 'in_progress' | 'completed')"
}
```

### Success Response — `200 OK`

```json
{
  "status": "success",
  "data": {
    "id": "uuid",
    "status": "completed",
    "updated_at": "2024-03-20T12:00:00Z"
  }
}
```

### Example

```bash
curl -X PATCH https://api.example.com/api/v1/bookings/550e8400-e29b-41d4-a716-446655440000/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{
    "status": "completed"
  }'
```

---

## POST /bookings/{id}/review

Submit a rating and review for a completed booking.

- **Required Role:** `sahabat`

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| id        | uuid | Booking ID  |

### Request Body

```json
{
  "rating": "integer (required, 1-5)",
  "review_text": "string (optional)"
}
```

### Success Response — `201 Created`

```json
{
  "status": "success",
  "data": {
    "id": "uuid",
    "booking_id": "uuid",
    "rating": 5,
    "review_text": "Pelayanan sangat baik!",
    "created_at": "2024-03-21T14:00:00Z"
  }
}
```

### Example

```bash
curl -X POST https://api.example.com/api/v1/bookings/550e8400-e29b-41d4-a716-446655440000/review \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{
    "rating": 5,
    "review_text": "Pelayanan sangat baik!"
  }'
```

---

## GET /bookings/stats

Get booking statistics.

- **Required Role:** `admin`, `pengurus`

### Query Parameters

| Parameter | Type | Description                   |
|-----------|------|-------------------------------|
| year      | int  | Year to filter (e.g. 2024)    |

### Success Response — `200 OK`

```json
{
  "status": "success",
  "data": {
    "total": 156,
    "completed": 120,
    "cancelled": 8,
    "avg_rating": 4.7,
    "by_month": [
      { "month": 1, "total": 12, "completed": 10 },
      { "month": 2, "total": 15, "completed": 13 },
      { "month": 3, "total": 18, "completed": 16 }
    ]
  }
}
```

### Example

```bash
curl -X GET "https://api.example.com/api/v1/bookings/stats?year=2024" \
  -H "Authorization: Bearer <access_token>"
```

---

## Standard Error Responses

### 400 Bad Request

```json
{
  "status": "error",
  "message": "Invalid request body",
  "errors": [
    {
      "field": "booking_date",
      "message": "Date must be in the future"
    }
  ]
}
```

### 401 Unauthorized

```json
{
  "status": "error",
  "message": "Invalid or expired token"
}
```

### 403 Forbidden

```json
{
  "status": "error",
  "message": "You do not have permission to access this resource"
}
```

### 404 Not Found

```json
{
  "status": "error",
  "message": "Booking not found"
}
```

### 409 Conflict

```json
{
  "status": "error",
  "message": "Booking has already been reviewed"
}
```

### 422 Validation Error

```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": [
    {
      "field": "time_slot",
      "message": "Selected time slot is no longer available"
    }
  ]
}
```

---

## Pagination Format

Paginated responses follow this structure:

```json
{
  "status": "success",
  "data": {
    "items": [],
    "total": 0,
    "page": 1,
    "limit": 20,
    "pages": 0
  }
}
```

# API Contract: Pickup Requests (Jemput Zakat/Kencleng)

> Base URL: `/api/v1/pickups`

---

## POST /pickups

Create a new pickup request.

**Auth:** Required (sahabat)

**Request Body:**
```json
{
  "requester_name": "Ahmad Rizki",
  "requester_phone": "081234567890",
  "pickup_type": "zakat",
  "pickup_address": "Jl. Merdeka No. 123, Bandung",
  "pickup_lat": -6.917464,
  "pickup_lng": 107.619123,
  "preferred_date": "2026-02-25",
  "preferred_time_slot": "morning",
  "notes": "Rumah warna putih, pagar hijau"
}
```

**Field Validation:**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `requester_name` | string | Yes | - |
| `requester_phone` | string | Yes | - |
| `pickup_type` | string | Yes | `zakat`, `kencleng`, `donasi` |
| `pickup_address` | string | Yes | - |
| `pickup_lat` | decimal | No | Valid latitude |
| `pickup_lng` | decimal | No | Valid longitude |
| `preferred_date` | date | No | Must be future date |
| `preferred_time_slot` | string | No | `morning` (09-12), `afternoon` (13-15), `evening` (16-18) |
| `notes` | string | No | - |

**Response: 201 Created**
```json
{
  "data": {
    "id": "p1q2r3s4-...",
    "request_code": "PKP-A1B2C3D4",
    "requester_id": "a1b2c3d4-...",
    "requester_name": "Ahmad Rizki",
    "requester_phone": "081234567890",
    "pickup_type": "zakat",
    "pickup_address": "Jl. Merdeka No. 123, Bandung",
    "pickup_lat": -6.917464,
    "pickup_lng": 107.619123,
    "preferred_date": "2026-02-25",
    "preferred_time_slot": "morning",
    "status": "pending",
    "assigned_to": null,
    "scheduled_by": null,
    "scheduled_at": null,
    "completed_at": null,
    "proof_url": null,
    "collected_amount": null,
    "notes": "Rumah warna putih, pagar hijau",
    "created_at": "2026-02-18T10:00:00Z",
    "updated_at": null
  },
  "message": "Pickup request created successfully"
}
```

---

## GET /pickups

List pickup requests.

**Auth:** Required (admin, pengurus — all requests; relawan — assigned only; sahabat — own only)

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | int | 1 | Page number |
| `limit` | int | 20 | Items per page |
| `status` | string | - | Filter: `pending`, `scheduled`, `in_progress`, `completed`, `cancelled` |
| `pickup_type` | string | - | Filter: `zakat`, `kencleng`, `donasi` |
| `date_from` | date | - | Filter by preferred_date start |
| `date_to` | date | - | Filter by preferred_date end |

**Response: 200 OK**
```json
{
  "data": [
    {
      "id": "p1q2r3s4-...",
      "request_code": "PKP-A1B2C3D4",
      "requester_name": "Ahmad Rizki",
      "requester_phone": "081234567890",
      "pickup_type": "zakat",
      "pickup_address": "Jl. Merdeka No. 123, Bandung",
      "status": "pending",
      "preferred_date": "2026-02-25",
      "preferred_time_slot": "morning",
      "assigned_to": null,
      "collected_amount": null,
      "created_at": "2026-02-18T10:00:00Z"
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 25 }
}
```

---

## GET /pickups/{id}

Get pickup request detail.

**Auth:** Required (admin, pengurus, assigned relawan, or requester)

**Response: 200 OK** — Full pickup object.

---

## PUT /pickups/{id}/schedule

Schedule a pickup and assign a relawan.

**Auth:** Required (admin, pengurus)

**Request Body:**
```json
{
  "assigned_to": "uuid-relawan-id",
  "scheduled_at": "2026-02-25T09:00:00Z"
}
```

**Response: 200 OK**
```json
{
  "data": {
    "...pickup object...",
    "status": "scheduled",
    "assigned_to": "uuid-relawan-id",
    "scheduled_by": "uuid-pengurus-id",
    "scheduled_at": "2026-02-25T09:00:00Z"
  },
  "message": "Pickup scheduled successfully"
}
```

**Side Effects:**
- Notification sent to assigned relawan
- Notification sent to requester with scheduled time

---

## PUT /pickups/{id}/complete

Mark pickup as completed.

**Auth:** Required (admin, pengurus, assigned relawan)

**Request Body:**
```json
{
  "collected_amount": 500000.00,
  "notes": "Zakat fitrah 2 orang"
}
```

**Response: 200 OK**
```json
{
  "data": {
    "...pickup object...",
    "status": "completed",
    "collected_amount": 500000.00,
    "completed_at": "2026-02-25T10:30:00Z",
    "proof_url": null
  },
  "message": "Pickup completed successfully"
}
```

---

## Status Workflow

```
pending ──→ scheduled    (pengurus assigns relawan + date)
scheduled ──→ in_progress (relawan starts pickup)
in_progress ──→ completed (relawan completes with amount)
pending ──→ cancelled    (requester or admin cancels)
scheduled ──→ cancelled  (admin cancels)
```

---

## Error Responses

| Status | Code | Description |
|--------|------|-------------|
| 400 | INVALID_STATUS | Invalid status transition |
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Not assigned to this pickup / insufficient role |
| 404 | PICKUP_NOT_FOUND | Pickup request ID does not exist |
| 404 | RELAWAN_NOT_FOUND | Assigned relawan ID does not exist |

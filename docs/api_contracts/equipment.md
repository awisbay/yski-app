# API Contract: Equipment & Loans

> Base URL: `/api/v1/equipment`

---

## GET /equipment

List all medical equipment.

**Auth:** Required (any role)

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | int | 1 | Page number |
| `limit` | int | 20 | Items per page |
| `category` | string | - | Filter: `wheelchair`, `oxygen_tank`, `hospital_bed`, `crutches`, etc. |
| `available_only` | bool | false | Only show items with available stock > 0 |
| `search` | string | - | Search by name |

**Response: 200 OK**
```json
{
  "data": [
    {
      "id": "e1f2a3b4-...",
      "name": "Kursi Roda Standard",
      "category": "wheelchair",
      "description": "Kursi roda lipat dengan rem tangan",
      "total_stock": 10,
      "available_stock": 7,
      "condition": "good",
      "photo_url": "https://storage.clicky.or.id/equipment/wheelchair.jpg",
      "is_active": true,
      "created_at": "2026-01-15T10:00:00Z",
      "updated_at": null
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 15
  }
}
```

---

## POST /equipment

Create new equipment item.

**Auth:** Required (admin, pengurus)

**Request Body:**
```json
{
  "name": "Tabung Oksigen 1L",
  "category": "oxygen_tank",
  "description": "Tabung oksigen portable kapasitas 1 liter",
  "total_stock": 5,
  "available_stock": 5,
  "condition": "new"
}
```

**Response: 201 Created**
```json
{
  "data": {
    "id": "e2f3a4b5-...",
    "name": "Tabung Oksigen 1L",
    "category": "oxygen_tank",
    "description": "Tabung oksigen portable kapasitas 1 liter",
    "total_stock": 5,
    "available_stock": 5,
    "condition": "new",
    "photo_url": null,
    "is_active": true,
    "created_at": "2026-02-18T10:00:00Z",
    "updated_at": null
  },
  "message": "Equipment created successfully"
}
```

---

## GET /equipment/{id}

Get equipment detail.

**Auth:** Required (any role)

**Response: 200 OK** — Single equipment object with full details.

---

## PUT /equipment/{id}

Update equipment item.

**Auth:** Required (admin, pengurus)

**Request Body:**
```json
{
  "name": "Tabung Oksigen 1L Updated",
  "total_stock": 8,
  "available_stock": 6,
  "condition": "good"
}
```

**Response: 200 OK** — Updated equipment object.

---

## POST /equipment/loans

Request to borrow equipment.

**Auth:** Required (sahabat)

**Request Body:**
```json
{
  "equipment_id": "e1f2a3b4-...",
  "borrower_name": "Ahmad Rizki",
  "borrower_phone": "081234567890",
  "borrow_date": "2026-02-20T10:00:00Z",
  "return_date": "2026-03-06T10:00:00Z",
  "notes": "Untuk ibu yang baru operasi"
}
```

**Response: 201 Created**
```json
{
  "data": {
    "id": "l1m2n3o4-...",
    "equipment_id": "e1f2a3b4-...",
    "borrower_id": "a1b2c3d4-...",
    "borrower_name": "Ahmad Rizki",
    "borrower_phone": "081234567890",
    "borrow_date": "2026-02-20T10:00:00Z",
    "return_date": "2026-03-06T10:00:00Z",
    "status": "requested",
    "notes": "Untuk ibu yang baru operasi",
    "approved_by": null,
    "equipment": {
      "id": "e1f2a3b4-...",
      "name": "Kursi Roda Standard",
      "category": "wheelchair",
      "photo_url": "https://storage.clicky.or.id/equipment/wheelchair.jpg"
    },
    "created_at": "2026-02-18T10:00:00Z",
    "updated_at": null
  },
  "message": "Loan request created successfully"
}
```

**Error: 400 Bad Request**
```json
{
  "detail": "Equipment out of stock",
  "code": "OUT_OF_STOCK"
}
```

---

## GET /equipment/loans

List equipment loans.

**Auth:** Required (admin, pengurus) for all loans. Sahabat sees own loans only.

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | int | 1 | Page number |
| `limit` | int | 20 | Items per page |
| `status` | string | - | Filter: `requested`, `approved`, `active`, `returned`, `overdue`, `rejected` |
| `equipment_id` | UUID | - | Filter by equipment |

**Response: 200 OK**
```json
{
  "data": [
    {
      "id": "l1m2n3o4-...",
      "equipment_id": "e1f2a3b4-...",
      "borrower_id": "a1b2c3d4-...",
      "borrower_name": "Ahmad Rizki",
      "borrower_phone": "081234567890",
      "borrow_date": "2026-02-20T10:00:00Z",
      "return_date": "2026-03-06T10:00:00Z",
      "status": "active",
      "approved_by": "uuid-pengurus-...",
      "equipment": { "...equipment summary..." },
      "created_at": "2026-02-18T10:00:00Z",
      "updated_at": "2026-02-19T08:00:00Z"
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 10 }
}
```

---

## PUT /equipment/loans/{id}

Update loan status (approve, reject, return).

**Auth:** Required (admin, pengurus)

**Request Body:**
```json
{
  "status": "approved",
  "notes": "Silakan ambil di kantor yayasan"
}
```

**Status Transitions:**
```
requested ──→ approved   (pengurus/admin approves)
requested ──→ rejected   (pengurus/admin rejects)
approved  ──→ active     (borrower picks up equipment)
active    ──→ returned   (borrower returns equipment)
active    ──→ overdue    (past return_date, auto-flagged)
```

**Response: 200 OK** — Updated loan object.

**Side Effects:**
- `approved`: available_stock decreases by 1
- `returned`: available_stock increases by 1
- `rejected`: no stock change
- `overdue`: notification sent to borrower

---

## Error Responses

| Status | Code | Description |
|--------|------|-------------|
| 400 | OUT_OF_STOCK | Equipment not available for borrowing |
| 400 | INVALID_STATUS | Invalid status transition |
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | EQUIPMENT_NOT_FOUND | Equipment ID does not exist |
| 404 | LOAN_NOT_FOUND | Loan ID does not exist |

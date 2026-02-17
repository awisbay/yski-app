# API Contract: Donations

> Base URL: `/api/v1/donations`

---

## POST /donations

Create a new donation.

**Auth:** Required (sahabat) or optional (anonymous donation)

**Request Body:**
```json
{
  "donor_name": "Ahmad Rizki",
  "donor_email": "ahmad@example.com",
  "donor_phone": "081234567890",
  "amount": 100000.00,
  "donation_type": "infaq",
  "program_id": "uuid-program-id",
  "payment_method": "bca_va",
  "message": "Semoga bermanfaat"
}
```

**Field Validation:**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `donor_name` | string | Yes | - |
| `donor_email` | string | No | Valid email format |
| `donor_phone` | string | No | - |
| `amount` | decimal | Yes | > 0 |
| `donation_type` | string | Yes | `infaq`, `sedekah`, `wakaf`, `zakat` |
| `program_id` | UUID | No | Must reference existing program |
| `payment_method` | string | Yes | `qris`, `gopay`, `ovo`, `shopeepay`, `bca_va`, `mandiri_va`, `bni_va` |
| `message` | string | No | - |

**Response: 201 Created**
```json
{
  "data": {
    "id": "d1e2f3a4-...",
    "donation_code": "CKY-A8B2C4D9",
    "donor_id": "a1b2c3d4-...",
    "donor_name": "Ahmad Rizki",
    "donor_email": "ahmad@example.com",
    "donor_phone": "081234567890",
    "amount": 100000.00,
    "donation_type": "infaq",
    "program_id": "uuid-program-id",
    "payment_method": "bca_va",
    "payment_status": "pending",
    "message": "Semoga bermanfaat",
    "proof_url": null,
    "verified_by": null,
    "verified_at": null,
    "created_at": "2026-02-18T10:00:00Z",
    "updated_at": null
  },
  "message": "Donation created successfully"
}
```

---

## GET /donations

List all donations (admin/pengurus).

**Auth:** Required (admin, pengurus)

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | int | 1 | Page number |
| `limit` | int | 20 | Items per page |
| `status` | string | - | Filter: `pending`, `paid`, `expired`, `failed` |
| `donation_type` | string | - | Filter: `infaq`, `sedekah`, `wakaf`, `zakat` |
| `date_from` | date | - | Filter by created_at start date |
| `date_to` | date | - | Filter by created_at end date |

**Response: 200 OK**
```json
{
  "data": [
    {
      "id": "d1e2f3a4-...",
      "donation_code": "CKY-A8B2C4D9",
      "donor_id": "a1b2c3d4-...",
      "donor_name": "Ahmad Rizki",
      "donor_email": "ahmad@example.com",
      "donor_phone": "081234567890",
      "amount": 100000.00,
      "donation_type": "infaq",
      "payment_method": "bca_va",
      "payment_status": "pending",
      "proof_url": null,
      "verified_by": null,
      "verified_at": null,
      "created_at": "2026-02-18T10:00:00Z",
      "updated_at": null
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150
  }
}
```

---

## GET /donations/my

Get current user's donations.

**Auth:** Required (any role)

**Query Parameters:** Same as GET /donations (page, limit, status, donation_type)

**Response: 200 OK** — Same format as GET /donations, filtered by current user.

---

## GET /donations/summary

Get donation summary statistics.

**Auth:** Required (admin, pengurus)

**Response: 200 OK**
```json
{
  "data": {
    "total_donations": 150,
    "total_amount": 25000000.00,
    "by_type": {
      "infaq": 12500000.00,
      "sedekah": 5000000.00,
      "zakat": 5000000.00,
      "wakaf": 2500000.00
    }
  }
}
```

---

## GET /donations/{id}

Get donation detail.

**Auth:** Required (admin, pengurus, or donor)

**Response: 200 OK**
```json
{
  "data": {
    "id": "d1e2f3a4-...",
    "donation_code": "CKY-A8B2C4D9",
    "donor_id": "a1b2c3d4-...",
    "donor_name": "Ahmad Rizki",
    "donor_email": "ahmad@example.com",
    "donor_phone": "081234567890",
    "amount": 100000.00,
    "donation_type": "infaq",
    "payment_method": "bca_va",
    "payment_status": "paid",
    "proof_url": "https://storage.clicky.or.id/donations/proof-abc.jpg",
    "verified_by": "uuid-pengurus-id",
    "verified_at": "2026-02-18T12:00:00Z",
    "message": "Semoga bermanfaat",
    "created_at": "2026-02-18T10:00:00Z",
    "updated_at": "2026-02-18T12:00:00Z"
  }
}
```

---

## POST /donations/{id}/verify

Verify a donation (mark as paid/cancelled).

**Auth:** Required (admin, pengurus)

**Request Body:**
```json
{
  "status": "paid"
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `status` | string | Yes | `paid` or `cancelled` |

**Response: 200 OK**
```json
{
  "data": { "...donation with updated status..." },
  "message": "Donation verified successfully"
}
```

---

## Status Workflow

```
pending ──→ paid       (verified by pengurus/admin)
pending ──→ cancelled  (cancelled by pengurus/admin)
pending ──→ expired    (auto-expired after 24h)
pending ──→ failed     (payment gateway failure)
```

---

## Error Responses

| Status | Code | Description |
|--------|------|-------------|
| 400 | INVALID_STATUS | Invalid status transition |
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Cannot verify own donation / insufficient role |
| 404 | DONATION_NOT_FOUND | Donation ID does not exist |
| 422 | VALIDATION_ERROR | Invalid input data |

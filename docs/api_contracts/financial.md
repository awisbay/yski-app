# API Contract: Financial Reports (Laporan Keuangan)

> Base URL: `/api/v1/financial`

---

## GET /financial/dashboard

Get financial dashboard data with aggregated metrics.

**Auth:** Required (any role — public transparency)

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `year` | int | current year | Filter by year |

**Response: 200 OK**
```json
{
  "data": {
    "total_income": 125000000.00,
    "total_expense": 98000000.00,
    "balance": 27000000.00,
    "income_by_category": [
      { "category": "donasi_infaq", "amount": 75000000.00, "percentage": 60.0 },
      { "category": "donasi_zakat", "amount": 30000000.00, "percentage": 24.0 },
      { "category": "lelang", "amount": 15000000.00, "percentage": 12.0 },
      { "category": "lainnya", "amount": 5000000.00, "percentage": 4.0 }
    ],
    "expense_by_category": [
      { "category": "penyaluran_bantuan", "amount": 50000000.00, "percentage": 51.0 },
      { "category": "operasional", "amount": 25000000.00, "percentage": 25.5 },
      { "category": "alkes", "amount": 15000000.00, "percentage": 15.3 },
      { "category": "logistik", "amount": 8000000.00, "percentage": 8.2 }
    ],
    "monthly_trend": [
      { "month": "2026-01", "income": 45000000.00, "expense": 38000000.00 },
      { "month": "2026-02", "income": 80000000.00, "expense": 60000000.00 }
    ]
  }
}
```

---

## GET /financial/reports

List published financial reports.

**Auth:** Required (any role — public transparency)

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | int | 1 | Page number |
| `limit` | int | 20 | Items per page |
| `year` | int | - | Filter by year |
| `is_published` | bool | true | Published only (admin can see unpublished) |

**Response: 200 OK**
```json
{
  "data": {
    "reports": [
      {
        "id": "fr1-uuid-...",
        "title": "Laporan Keuangan Januari 2026",
        "period_start": "2026-01-01",
        "period_end": "2026-01-31",
        "total_income": 45000000.00,
        "total_expense": 38000000.00,
        "pdf_url": "https://storage.clicky.or.id/reports/jan-2026.pdf",
        "is_audited": false,
        "is_published": true,
        "generated_by": "uuid-admin-...",
        "generator_name": "Admin YSKI",
        "created_at": "2026-02-05T10:00:00Z",
        "updated_at": "2026-02-10T14:00:00Z"
      }
    ],
    "total": 2
  }
}
```

---

## GET /financial/reports/{report_id}

Get report detail with individual entries.

**Auth:** Required (any role for published; admin/pengurus for unpublished)

**Response: 200 OK**
```json
{
  "data": {
    "id": "fr1-uuid-...",
    "title": "Laporan Keuangan Januari 2026",
    "period_start": "2026-01-01",
    "period_end": "2026-01-31",
    "total_income": 45000000.00,
    "total_expense": 38000000.00,
    "pdf_url": "https://storage.clicky.or.id/reports/jan-2026.pdf",
    "is_audited": false,
    "is_published": true,
    "generated_by": "uuid-admin-...",
    "generator_name": "Admin YSKI",
    "entries": [
      {
        "id": "fe1-uuid-...",
        "category": "donasi_infaq",
        "type": "income",
        "amount": 25000000.00,
        "description": "Total donasi infaq bulan Januari",
        "reference_type": "donation",
        "reference_id": null,
        "entry_date": "2026-01-31",
        "created_at": "2026-02-05T10:00:00Z"
      },
      {
        "id": "fe2-uuid-...",
        "category": "operasional",
        "type": "expense",
        "amount": 15000000.00,
        "description": "Biaya operasional kantor",
        "reference_type": null,
        "reference_id": null,
        "entry_date": "2026-01-31",
        "created_at": "2026-02-05T10:00:00Z"
      }
    ],
    "created_at": "2026-02-05T10:00:00Z",
    "updated_at": "2026-02-10T14:00:00Z"
  }
}
```

---

## POST /financial/reports

Create a new financial report.

**Auth:** Required (admin)

**Request Body:**
```json
{
  "title": "Laporan Keuangan Februari 2026",
  "period_start": "2026-02-01",
  "period_end": "2026-02-28"
}
```

**Response: 201 Created**
```json
{
  "data": {
    "id": "fr2-uuid-...",
    "title": "Laporan Keuangan Februari 2026",
    "period_start": "2026-02-01",
    "period_end": "2026-02-28",
    "total_income": 0.00,
    "total_expense": 0.00,
    "pdf_url": null,
    "is_audited": false,
    "is_published": false,
    "generated_by": "uuid-admin-...",
    "generator_name": "Admin YSKI",
    "created_at": "2026-02-18T10:00:00Z",
    "updated_at": "2026-02-18T10:00:00Z"
  },
  "message": "Financial report created successfully"
}
```

**Side Effects:**
- Automatically aggregates income/expense entries for the period
- Generates PDF report in background (Celery task)

---

## PUT /financial/reports/{report_id}

Update report metadata.

**Auth:** Required (admin)

**Request Body:**
```json
{
  "is_audited": true
}
```

**Response: 200 OK** — Updated report object.

---

## POST /financial/reports/{report_id}/publish

Publish a financial report (makes it visible to all users).

**Auth:** Required (admin)

**Request Body:**
```json
{
  "is_published": true
}
```

**Response: 200 OK**
```json
{
  "data": {
    "...report object...",
    "is_published": true
  },
  "message": "Financial report published successfully"
}
```

**Side Effects:**
- Notification sent to all users: "Laporan keuangan baru tersedia"
- Webhook sent to WordPress plugin (if configured)

---

## Financial Entry Categories

### Income Categories
| Category | Description |
|----------|-------------|
| `donasi_infaq` | Donasi infaq umum |
| `donasi_zakat` | Zakat mal dan fitrah |
| `donasi_sedekah` | Sedekah umum |
| `donasi_wakaf` | Wakaf |
| `lelang` | Pendapatan dari lelang barang |
| `lainnya` | Pendapatan lain-lain |

### Expense Categories
| Category | Description |
|----------|-------------|
| `penyaluran_bantuan` | Penyaluran bantuan ke penerima manfaat |
| `operasional` | Biaya operasional kantor |
| `alkes` | Pengadaan dan perawatan alat kesehatan |
| `logistik` | Biaya logistik dan pindahan |
| `sdm` | Biaya SDM / tenaga kerja |
| `lainnya` | Pengeluaran lain-lain |

---

## Error Responses

| Status | Code | Description |
|--------|------|-------------|
| 400 | INVALID_PERIOD | period_end before period_start |
| 400 | ALREADY_PUBLISHED | Report already published |
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Only admin can create/publish reports |
| 404 | REPORT_NOT_FOUND | Report ID does not exist |

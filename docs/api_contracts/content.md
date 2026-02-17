# API Contract: Content (Programs & News)

> Base URL: `/api/v1/content`

---

## Programs

### GET /content/programs

List programs.

**Auth:** Required (any role)

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | int | 1 | Page number |
| `limit` | int | 20 | Items per page |
| `status` | string | - | Filter: `active`, `completed`, `cancelled` |
| `is_featured` | bool | - | Filter featured programs only |
| `search` | string | - | Search by title |

**Response: 200 OK**
```json
{
  "data": [
    {
      "id": "pr1-uuid-...",
      "title": "Bantuan Korban Banjir Bandung",
      "slug": "bantuan-korban-banjir-bandung",
      "description": "Program bantuan untuk korban banjir di wilayah Bandung Selatan",
      "thumbnail_url": "https://storage.clicky.or.id/programs/banjir.jpg",
      "target_amount": 50000000.00,
      "collected_amount": 32500000.00,
      "status": "active",
      "is_featured": true,
      "created_by": "uuid-admin-...",
      "created_at": "2026-01-10T10:00:00Z",
      "updated_at": "2026-02-18T14:00:00Z"
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 8 }
}
```

### POST /content/programs

Create a new program.

**Auth:** Required (admin, pengurus)

**Request Body:**
```json
{
  "title": "Bantuan Kesehatan Lansia",
  "description": "Program pemeriksaan kesehatan gratis untuk lansia di komunitas",
  "target_amount": 25000000.00
}
```

**Response: 201 Created**
```json
{
  "data": {
    "id": "pr2-uuid-...",
    "title": "Bantuan Kesehatan Lansia",
    "slug": "bantuan-kesehatan-lansia",
    "description": "Program pemeriksaan kesehatan gratis untuk lansia di komunitas",
    "thumbnail_url": null,
    "target_amount": 25000000.00,
    "collected_amount": 0.00,
    "status": "active",
    "is_featured": false,
    "created_by": "uuid-admin-...",
    "created_at": "2026-02-18T10:00:00Z",
    "updated_at": null
  },
  "message": "Program created successfully"
}
```

### GET /content/programs/{id}

Get program detail.

**Auth:** Required (any role)

**Response: 200 OK** — Full program object.

### PUT /content/programs/{id}

Update program.

**Auth:** Required (admin, pengurus)

**Request Body:**
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "target_amount": 30000000.00,
  "status": "active",
  "is_featured": true
}
```

**Response: 200 OK** — Updated program object.

---

## News Articles

### GET /content/news

List news articles.

**Auth:** Required (any role)

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | int | 1 | Page number |
| `limit` | int | 20 | Items per page |
| `category` | string | - | Filter: `general`, `kegiatan`, `laporan`, `pengumuman` |
| `is_published` | bool | - | Filter published/draft |
| `search` | string | - | Search by title |

**Response: 200 OK**
```json
{
  "data": [
    {
      "id": "nw1-uuid-...",
      "title": "Kegiatan Bakti Sosial di Cimahi",
      "slug": "kegiatan-bakti-sosial-di-cimahi",
      "excerpt": "Tim relawan mengadakan bakti sosial untuk warga...",
      "content": "<p>Pada hari Minggu, 15 Februari 2026...</p>",
      "thumbnail_url": "https://storage.clicky.or.id/news/baksos.jpg",
      "category": "kegiatan",
      "is_published": true,
      "published_at": "2026-02-15T08:00:00Z",
      "created_by": "uuid-admin-...",
      "created_at": "2026-02-14T10:00:00Z",
      "updated_at": "2026-02-15T08:00:00Z"
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 25 }
}
```

### POST /content/news

Create a news article.

**Auth:** Required (admin, pengurus)

**Request Body:**
```json
{
  "title": "Laporan Kegiatan Ramadhan 1447H",
  "excerpt": "Ringkasan kegiatan yayasan selama bulan Ramadhan...",
  "content": "<p>Alhamdulillah, selama bulan Ramadhan 1447H...</p>",
  "category": "laporan"
}
```

**Response: 201 Created** — News object with `is_published: false` (draft).

### GET /content/news/{id}

Get news article detail.

**Auth:** Required (any role)

**Response: 200 OK** — Full news object.

### PUT /content/news/{id}

Update news article.

**Auth:** Required (admin, pengurus)

**Request Body:**
```json
{
  "title": "Updated Title",
  "content": "<p>Updated content...</p>",
  "category": "kegiatan",
  "is_published": true
}
```

**Side Effects:**
- When `is_published` changes to `true`, `published_at` is set to current timestamp
- Notification sent to subscribers (if notification system active)

**Response: 200 OK** — Updated news object.

---

## Error Responses

| Status | Code | Description |
|--------|------|-------------|
| 400 | VALIDATION_ERROR | Invalid input data |
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions to create/edit |
| 404 | PROGRAM_NOT_FOUND | Program ID does not exist |
| 404 | NEWS_NOT_FOUND | News article ID does not exist |
| 409 | SLUG_EXISTS | Duplicate slug (title conflict) |

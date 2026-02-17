# API Contract: Users

> Base URL: `/api/v1/users`

---

## GET /users/me

Get current authenticated user's profile.

**Auth:** Required (any role)

**Response: 200 OK**
```json
{
  "data": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "full_name": "Ahmad Rizki",
    "email": "ahmad@example.com",
    "phone": "081234567890",
    "avatar_url": null,
    "role": "sahabat",
    "is_active": true,
    "created_at": "2026-02-01T10:00:00Z",
    "updated_at": "2026-02-15T14:30:00Z"
  }
}
```

---

## PUT /users/me

Update current user's profile.

**Auth:** Required (any role)

**Request Body:**
```json
{
  "full_name": "Ahmad Rizki Updated",
  "phone": "081234567899",
  "avatar_url": "https://storage.clicky.or.id/avatars/abc.jpg"
}
```

**Response: 200 OK**
```json
{
  "data": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "full_name": "Ahmad Rizki Updated",
    "email": "ahmad@example.com",
    "phone": "081234567899",
    "avatar_url": "https://storage.clicky.or.id/avatars/abc.jpg",
    "role": "sahabat",
    "is_active": true,
    "created_at": "2026-02-01T10:00:00Z",
    "updated_at": "2026-02-18T09:00:00Z"
  }
}
```

---

## GET /users

List all users (with pagination, search, and role filter).

**Auth:** Required (admin, pengurus)

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | int | 1 | Page number |
| `limit` | int | 20 | Items per page (max 100) |
| `search` | string | - | Search by name or email |
| `role` | string | - | Filter by role (admin/pengurus/relawan/sahabat) |

**Example:** `GET /users?page=1&limit=10&role=sahabat&search=ahmad`

**Response: 200 OK**
```json
{
  "data": [
    {
      "id": "a1b2c3d4-...",
      "full_name": "Ahmad Rizki",
      "email": "ahmad@example.com",
      "phone": "081234567890",
      "avatar_url": null,
      "role": "sahabat",
      "is_active": true,
      "created_at": "2026-02-01T10:00:00Z",
      "updated_at": null
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 45
  }
}
```

---

## GET /users/{id}

Get user detail by ID.

**Auth:** Required (admin, pengurus)

**Response: 200 OK**
```json
{
  "data": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "full_name": "Ahmad Rizki",
    "email": "ahmad@example.com",
    "phone": "081234567890",
    "avatar_url": null,
    "role": "sahabat",
    "is_active": true,
    "created_at": "2026-02-01T10:00:00Z",
    "updated_at": null
  }
}
```

**Error: 404 Not Found**
```json
{
  "detail": "User not found",
  "code": "USER_NOT_FOUND"
}
```

---

## POST /users

Create a new user (admin-created, can assign any role).

**Auth:** Required (admin)

**Request Body:**
```json
{
  "full_name": "Siti Aminah",
  "email": "siti@example.com",
  "phone": "081234567891",
  "password": "SecurePass123"
}
```

**Response: 201 Created**
```json
{
  "data": {
    "id": "b2c3d4e5-...",
    "full_name": "Siti Aminah",
    "email": "siti@example.com",
    "phone": "081234567891",
    "avatar_url": null,
    "role": "sahabat",
    "is_active": true,
    "created_at": "2026-02-18T09:00:00Z",
    "updated_at": null
  },
  "message": "User created successfully"
}
```

**Error: 409 Conflict**
```json
{
  "detail": "Email already registered",
  "code": "EMAIL_EXISTS"
}
```

---

## PUT /users/{id}

Update user (admin can change role, status).

**Auth:** Required (admin)

**Request Body:**
```json
{
  "full_name": "Siti Aminah Updated",
  "phone": "081234567899"
}
```

**Response: 200 OK** — Same as UserResponse schema.

---

## DELETE /users/{id}

Soft delete (deactivate) user.

**Auth:** Required (admin)

**Response: 200 OK**
```json
{
  "message": "User deactivated successfully"
}
```

---

## Error Responses

| Status | Code | Description |
|--------|------|-------------|
| 400 | VALIDATION_ERROR | Invalid input data |
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | USER_NOT_FOUND | User ID does not exist |
| 409 | EMAIL_EXISTS | Email already registered |
| 422 | UNPROCESSABLE_ENTITY | Pydantic validation failure |

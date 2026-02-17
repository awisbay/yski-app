# Auth API Contract

Base URL: `/api/v1`

All authenticated endpoints require `Authorization: Bearer <token>` header.

---

## POST /auth/register

Register a new user account.

- **Required Role:** Public (no authentication required)
- **Default Role Assigned:** `sahabat`

### Request Body

```json
{
  "full_name": "string (required)",
  "email": "string (required, unique, valid email)",
  "phone": "string (optional)",
  "password": "string (required, min 8 characters)"
}
```

### Success Response — `201 Created`

```json
{
  "status": "success",
  "data": {
    "id": "uuid",
    "full_name": "Ahmad Fauzi",
    "email": "ahmad@example.com",
    "phone": "+6281234567890",
    "role": "sahabat",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

### Example

```bash
curl -X POST https://api.example.com/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Ahmad Fauzi",
    "email": "ahmad@example.com",
    "phone": "+6281234567890",
    "password": "securePass123"
  }'
```

---

## POST /auth/login

Authenticate a user and obtain JWT tokens.

- **Required Role:** Public (no authentication required)

### Request Body

```json
{
  "email": "string (required)",
  "password": "string (required)"
}
```

### Success Response — `200 OK`

```json
{
  "status": "success",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "dGhpcyBpcyBhIHJlZnJl...",
    "token_type": "Bearer",
    "expires_in": 3600
  }
}
```

### Example

```bash
curl -X POST https://api.example.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ahmad@example.com",
    "password": "securePass123"
  }'
```

---

## POST /auth/refresh

Refresh an expired access token using a valid refresh token.

- **Required Role:** Authenticated

### Request Body

```json
{
  "refresh_token": "string (required)"
}
```

### Success Response — `200 OK`

```json
{
  "status": "success",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "bmV3IHJlZnJlc2ggdG9r...",
    "token_type": "Bearer",
    "expires_in": 3600
  }
}
```

### Example

```bash
curl -X POST https://api.example.com/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{
    "refresh_token": "dGhpcyBpcyBhIHJlZnJl..."
  }'
```

---

## GET /auth/me

Retrieve the current authenticated user's profile.

- **Required Role:** Authenticated

### Request Body

None.

### Success Response — `200 OK`

```json
{
  "status": "success",
  "data": {
    "id": "uuid",
    "full_name": "Ahmad Fauzi",
    "email": "ahmad@example.com",
    "phone": "+6281234567890",
    "role": "sahabat",
    "avatar_url": "https://storage.example.com/avatars/uuid.jpg",
    "is_active": true,
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

### Example

```bash
curl -X GET https://api.example.com/api/v1/auth/me \
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
      "field": "email",
      "message": "Invalid email format"
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
  "message": "Resource not found"
}
```

### 409 Conflict

```json
{
  "status": "error",
  "message": "Email already registered"
}
```

### 422 Validation Error

```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": [
    {
      "field": "password",
      "message": "Password must be at least 8 characters"
    }
  ]
}
```

---

## Pagination Format

Where applicable, paginated responses follow this structure:

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

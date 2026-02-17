# Backend Authentication Specification

## Overview

The authentication system uses email/password credentials with JWT (JSON Web Tokens) for stateless authentication. Refresh tokens enable session continuity without frequent re-authentication. Token blacklisting via Redis supports secure logout.

---

## 1. Registration Flow

### Endpoint
`POST /api/v1/auth/register`

### Request Body
```json
{
  "full_name": "Ahmad Sahabat",
  "email": "ahmad@example.com",
  "password": "securepassword123",
  "phone": "+6281234567890"  // optional
}
```

### Flow
1. Validate request body (Pydantic schema)
2. Check if email already exists -> 409 Conflict if duplicate
3. Hash password with bcrypt (12 rounds)
4. Create user with `role = "sahabat"` (default role)
5. Set `is_active = True`
6. Return user profile (without password hash)

### Response (201 Created)
```json
{
  "id": "uuid-string",
  "full_name": "Ahmad Sahabat",
  "email": "ahmad@example.com",
  "phone": "+6281234567890",
  "role": "sahabat",
  "is_active": true,
  "created_at": "2026-02-17T10:00:00Z"
}
```

### Validation Rules
- `full_name`: required, 2-100 characters
- `email`: required, valid email format, unique
- `password`: required, minimum 8 characters
- `phone`: optional, valid phone format if provided

---

## 2. Login Flow

### Endpoint
`POST /api/v1/auth/login`

### Request Body
```json
{
  "email": "ahmad@example.com",
  "password": "securepassword123"
}
```

### Flow
1. Find user by email -> 401 if not found
2. Check `is_active` -> 401 if deactivated
3. Verify password against hash -> 401 if mismatch
4. Generate access token (short-lived)
5. Generate refresh token (long-lived)
6. Return both tokens

### Response (200 OK)
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "expires_in": 900
}
```

### Error Responses
- 401 Unauthorized: Invalid email or password
- 401 Unauthorized: Account is deactivated

---

## 3. Token Specification

### Access Token
- **Type:** JWT (JWS)
- **Algorithm:** HS256
- **Expiration:** 15 minutes (900 seconds)
- **Payload:**
  ```json
  {
    "sub": "user-uuid",
    "role": "sahabat",
    "type": "access",
    "exp": 1708171200,
    "iat": 1708170300
  }
  ```

### Refresh Token
- **Type:** JWT (JWS)
- **Algorithm:** HS256
- **Expiration:** 7 days (604800 seconds)
- **Payload:**
  ```json
  {
    "sub": "user-uuid",
    "type": "refresh",
    "exp": 1708776000,
    "iat": 1708170300
  }
  ```

### Token Usage
- Access token is sent in the `Authorization` header: `Authorization: Bearer <access_token>`
- Refresh token is sent in the request body to the refresh endpoint
- Tokens are signed with `JWT_SECRET_KEY` from environment configuration

---

## 4. Token Refresh Mechanism

### Endpoint
`POST /api/v1/auth/refresh`

### Request Body
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Flow
1. Decode and validate refresh token
2. Check `type` claim equals `"refresh"` -> 401 if not
3. Check token is not blacklisted in Redis -> 401 if blacklisted
4. Check user still exists and is active -> 401 if not
5. Generate new access token
6. Generate new refresh token (token rotation)
7. Blacklist the old refresh token in Redis
8. Return new token pair

### Response (200 OK)
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "expires_in": 900
}
```

### Token Rotation
Each refresh operation issues a new refresh token and invalidates the old one. This limits the window of exposure if a refresh token is compromised.

---

## 5. Get Current User

### Endpoint
`GET /api/v1/auth/me`

### Headers
```
Authorization: Bearer <access_token>
```

### Flow
1. Extract and validate access token from Authorization header
2. Decode JWT payload, extract `sub` (user ID)
3. Fetch user from database
4. Return user profile

### Response (200 OK)
```json
{
  "id": "uuid-string",
  "full_name": "Ahmad Sahabat",
  "email": "ahmad@example.com",
  "phone": "+6281234567890",
  "avatar_url": null,
  "role": "sahabat",
  "is_active": true,
  "created_at": "2026-02-17T10:00:00Z",
  "updated_at": "2026-02-17T10:00:00Z"
}
```

---

## 6. Logout

### Endpoint
`POST /api/v1/auth/logout`

### Headers
```
Authorization: Bearer <access_token>
```

### Request Body
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Flow
1. Validate access token from header
2. Blacklist the access token in Redis (TTL = remaining token lifetime)
3. Blacklist the refresh token in Redis (TTL = remaining token lifetime)
4. Return success

### Response (200 OK)
```json
{
  "message": "Successfully logged out"
}
```

### Redis Blacklist Storage
```
Key:    blacklist:<token_jti_or_hash>
Value:  "1"
TTL:    Remaining seconds until token expiration
```

---

## 7. Password Hashing

### Library
`passlib` with bcrypt backend

### Configuration
```python
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
```

### Operations
```python
# Hash a password
hashed = pwd_context.hash(plain_password)

# Verify a password
is_valid = pwd_context.verify(plain_password, hashed_password)
```

### Parameters
- Bcrypt rounds: 12 (default)
- Automatic scheme migration on verify (future-proofing)

---

## 8. Security Considerations

### Transport Security
- All API communication over HTTPS in production
- HSTS headers configured in nginx

### Rate Limiting
- Login endpoint: maximum 5 attempts per minute per IP
- Registration endpoint: maximum 3 registrations per hour per IP
- Implemented via Redis counters with TTL

### Token Security
- JWT secret key must be at least 32 characters, cryptographically random
- Tokens never stored server-side (except blacklist entries)
- Access tokens are short-lived to limit exposure
- Refresh token rotation prevents reuse

### Password Security
- Minimum 8 characters (enforced by Pydantic schema)
- Bcrypt hashing with 12 rounds
- Passwords never logged or returned in API responses
- Password hash column excluded from default SQLAlchemy query results

### CORS Configuration
- Allowed origins configured via environment variable
- Credentials mode enabled for cookie support (if needed later)
- Preflight caching: 600 seconds

---

## 9. User Model

```python
class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    full_name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    phone = Column(String(20), nullable=True)
    password_hash = Column(String(255), nullable=False)
    avatar_url = Column(String(500), nullable=True)
    role = Column(String(20), nullable=False, default="sahabat")
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
```

### Role Enum Values
- `admin`
- `pengurus`
- `relawan`
- `sahabat`

---

## 10. Pydantic Schemas

```python
class UserCreate(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8)
    phone: str | None = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: UUID
    full_name: str
    email: str
    phone: str | None
    avatar_url: str | None
    role: str
    is_active: bool
    created_at: datetime
    updated_at: datetime | None

    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int

class TokenPayload(BaseModel):
    sub: UUID
    role: str | None = None
    type: str  # "access" or "refresh"
    exp: int
```

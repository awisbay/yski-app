# Phase 1: Backend Foundation + Auth + RBAC

## Objective

Build the backend foundation with a working authentication system and role-based access control. At the end of this phase, users can register, login, and access endpoints based on their assigned role.

## Checklist

### Project Structure & Configuration
- [x] Setup FastAPI project structure (`main.py`, `config.py`, `database.py`)
- [x] Configure SQLAlchemy async engine + session
- [x] Setup Alembic for migrations
- [x] Setup CORS middleware

### Database Models
- [x] Create User model (UUID PK, full_name, email, phone, password_hash, avatar_url, role, is_active, timestamps)
- [x] Create `role_permissions` table and seed data

### Authentication
- [x] Implement password hashing (bcrypt via passlib)
- [x] Implement JWT token generation (access + refresh tokens)
- [ ] Create auth endpoints:
  - [x] `POST /api/v1/auth/register`
  - [x] `POST /api/v1/auth/login`
  - [x] `POST /api/v1/auth/refresh`
  - [x] `GET /api/v1/auth/me`

### Schemas & Validation
- [ ] Create user schemas (Pydantic):
  - [x] `UserCreate`
  - [x] `UserResponse`
  - [x] `UserLogin`
  - [x] `Token`
  - [x] `TokenPayload`

### RBAC (Role-Based Access Control)
- [x] Implement RBAC middleware/decorator (check `role_permissions`)
- [x] Create `deps.py`: `get_db`, `get_current_user`, `require_role()`

### User Management
- [ ] Implement user CRUD endpoints (admin only):
  - [x] `GET /api/v1/users` (list users, paginated)
  - [x] `GET /api/v1/users/{id}` (get user detail)
  - [x] `POST /api/v1/users` (create user with specific role)
  - [x] `PUT /api/v1/users/{id}` (update user)
  - [x] `DELETE /api/v1/users/{id}` (deactivate user)

### Testing
- [ ] Write tests for auth flow (register, login, refresh, me)
- [ ] Write tests for RBAC (permission enforcement per role)
- [ ] Verify all endpoints via Swagger UI

## API Endpoints Summary

| Method | Endpoint                    | Auth Required | Roles Allowed      | Description            |
|--------|-----------------------------|---------------|--------------------|-----------------------|
| POST   | /api/v1/auth/register       | No            | Public             | Register new user      |
| POST   | /api/v1/auth/login          | No            | Public             | Login, get tokens      |
| POST   | /api/v1/auth/refresh        | Yes (refresh) | All                | Refresh access token   |
| GET    | /api/v1/auth/me             | Yes           | All                | Get current user       |
| GET    | /api/v1/users               | Yes           | Admin              | List all users         |
| GET    | /api/v1/users/{id}          | Yes           | Admin              | Get user by ID         |
| POST   | /api/v1/users               | Yes           | Admin              | Create user            |
| PUT    | /api/v1/users/{id}          | Yes           | Admin              | Update user            |
| DELETE | /api/v1/users/{id}          | Yes           | Admin              | Deactivate user        |

## Dependencies

- FastAPI
- SQLAlchemy[asyncio] + asyncpg
- Alembic
- Pydantic v2
- python-jose[cryptography] (JWT)
- passlib[bcrypt] (password hashing)
- redis (aioredis) (token blacklist)
- pytest + pytest-asyncio + httpx (testing)

## Estimated Duration

1-2 weeks

# Phase 1: Acceptance Criteria & Exit Checklist

## Overview

Phase 1 is complete when the backend authentication system and RBAC are fully functional, tested, and documented via Swagger UI. All items below must be verified before moving to Phase 2.

---

## Exit Criteria Checklist

### Authentication Flow
- [ ] User can register with email and password
  - `POST /api/v1/auth/register` returns 201 with user profile
  - Duplicate email returns 409 Conflict
  - Invalid input returns 422 with validation errors
  - Default role is `sahabat`
- [ ] User can login and receive JWT tokens
  - `POST /api/v1/auth/login` returns access_token + refresh_token
  - Invalid credentials return 401
  - Deactivated user returns 401
- [ ] Token refresh works correctly
  - `POST /api/v1/auth/refresh` with valid refresh token returns new token pair
  - Old refresh token is invalidated after use (token rotation)
  - Expired refresh token returns 401
  - Blacklisted refresh token returns 401
- [ ] `GET /api/v1/auth/me` returns current user profile
  - Valid access token returns user data
  - Expired or invalid token returns 401
  - Response excludes password_hash

### User Management (Admin)
- [ ] Admin can CRUD users
  - `GET /api/v1/users` returns paginated user list
  - `GET /api/v1/users/{id}` returns single user
  - `POST /api/v1/users` creates user with specified role
  - `PUT /api/v1/users/{id}` updates user fields
  - `DELETE /api/v1/users/{id}` deactivates user (soft delete)
- [ ] Non-admin cannot access admin endpoints (403)
  - Pengurus, Relawan, Sahabat all receive 403 on user management endpoints

### RBAC
- [ ] RBAC permissions are enforced on all protected routes
  - `role_permissions` table is seeded with all permissions
  - `require_role()` dependency correctly restricts access
  - Permission matrix matches specification in `rbac-spec.md`

### Documentation & API
- [ ] Swagger UI documents all endpoints
  - All endpoints visible at `/docs`
  - Request/response schemas are accurate
  - Authentication scheme (Bearer token) is configured

### Testing
- [ ] All tests pass (>80% coverage on auth module)
  - Auth registration tests (happy path + validation errors + duplicate)
  - Auth login tests (happy path + wrong password + inactive user)
  - Token refresh tests (happy path + expired + blacklisted)
  - RBAC tests (each role tested against protected endpoints)
  - User CRUD tests (admin access + non-admin rejection)

### Database
- [ ] Alembic migration runs cleanly from scratch
  - `alembic upgrade head` on empty database succeeds
  - All tables created with correct schema
  - Seed data (role_permissions, default admin user) is applied
  - `alembic downgrade base` also works

---

## Verification Steps

### Manual Verification Sequence

1. **Clean start:** `docker-compose down -v && docker-compose up -d`
2. **Run migrations:** `alembic upgrade head`
3. **Open Swagger UI:** Navigate to `http://localhost:8000/docs`
4. **Register a user:** POST to `/api/v1/auth/register` with test data
5. **Login:** POST to `/api/v1/auth/login`, copy the access token
6. **Authorize in Swagger:** Click "Authorize" button, paste Bearer token
7. **Get profile:** GET `/api/v1/auth/me` - should return user profile
8. **Test RBAC:** Try GET `/api/v1/users` as sahabat - should get 403
9. **Login as admin:** Use seeded admin credentials
10. **Admin CRUD:** Test all user management endpoints as admin
11. **Token refresh:** POST to `/api/v1/auth/refresh` with refresh token
12. **Run test suite:** `pytest tests/ -v --cov=app --cov-report=term-missing`

### Automated Test Commands

```bash
# Run all tests
pytest tests/ -v

# Run with coverage
pytest tests/ -v --cov=app --cov-report=term-missing

# Run only auth tests
pytest tests/test_auth.py -v

# Run only RBAC tests
pytest tests/test_rbac.py -v
```

---

## Definition of Done

- All checklist items above are checked off
- No critical or high-severity bugs
- Code is reviewed and merged to main branch
- Swagger UI is accessible and accurate
- Test coverage meets threshold (>80% on auth module)
- Alembic migrations are reversible
- Environment variables documented in `.env.example`

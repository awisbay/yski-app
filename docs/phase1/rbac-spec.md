# RBAC (Role-Based Access Control) Specification

## Overview

The YSKI app uses a role-based access control system with 4 predefined roles. Permissions are stored in a database table (`role_permissions`) and checked at the endpoint level via a FastAPI dependency.

---

## Roles

| Role       | Description                                | Default Registration |
|------------|--------------------------------------------|--------------------|
| `admin`    | System administrator, full access          | No (seeded/assigned) |
| `pengurus` | Foundation board member / staff            | No (assigned by admin) |
| `relawan`  | Volunteer                                   | No (assigned by admin) |
| `sahabat`  | Beneficiary, donor, community member        | Yes (default on register) |

---

## Permission Matrix

### Auth & User Management

| Action                     | Admin | Pengurus | Relawan | Sahabat |
|---------------------------|-------|----------|---------|---------|
| Register (self)            | -     | -        | -       | Yes     |
| Login                      | Yes   | Yes      | Yes     | Yes     |
| View own profile           | Yes   | Yes      | Yes     | Yes     |
| Edit own profile           | Yes   | Yes      | Yes     | Yes     |
| List all users             | Yes   | No       | No      | No      |
| Create user (any role)     | Yes   | No       | No      | No      |
| Update any user            | Yes   | No       | No      | No      |
| Deactivate any user        | Yes   | No       | No      | No      |
| Change user role           | Yes   | No       | No      | No      |

### Booking Pindahan

| Action                     | Admin | Pengurus | Relawan | Sahabat |
|---------------------------|-------|----------|---------|---------|
| Create booking             | Yes   | Yes      | No      | Yes     |
| View all bookings          | Yes   | Yes      | No      | No      |
| View own bookings          | Yes   | Yes      | Yes     | Yes     |
| View assigned bookings     | Yes   | Yes      | Yes     | No      |
| Approve/reject booking     | Yes   | Yes      | No      | No      |
| Assign relawan to booking  | Yes   | Yes      | No      | No      |
| Update booking status      | Yes   | Yes      | Yes*    | No      |
| Cancel own booking         | Yes   | Yes      | No      | Yes**   |

_* Relawan can only update status of bookings assigned to them._
_** Sahabat can only cancel before approval._

### Donasi & Infaq

| Action                     | Admin | Pengurus | Relawan | Sahabat |
|---------------------------|-------|----------|---------|---------|
| Create donation            | Yes   | Yes      | Yes     | Yes     |
| Upload payment proof       | Yes   | Yes      | Yes     | Yes     |
| View all donations         | Yes   | Yes      | No      | No      |
| View own donations         | Yes   | Yes      | Yes     | Yes     |
| Verify/confirm donation    | Yes   | Yes      | No      | No      |

### Jemput Zakat / Kencleng

| Action                     | Admin | Pengurus | Relawan | Sahabat |
|---------------------------|-------|----------|---------|---------|
| Create pickup request      | Yes   | Yes      | No      | Yes     |
| View all pickup requests   | Yes   | Yes      | No      | No      |
| View own pickup requests   | Yes   | Yes      | Yes     | Yes     |
| Schedule/assign pickup     | Yes   | Yes      | No      | No      |
| Mark pickup complete       | Yes   | Yes      | Yes*    | No      |
| Upload pickup proof        | Yes   | Yes      | Yes*    | No      |

_* Relawan can only update pickups assigned to them._

### Inventaris Alkes

| Action                     | Admin | Pengurus | Relawan | Sahabat |
|---------------------------|-------|----------|---------|---------|
| View equipment list        | Yes   | Yes      | Yes     | Yes     |
| Create/edit equipment      | Yes   | Yes      | No      | No      |
| Delete equipment           | Yes   | No       | No      | No      |
| Request equipment loan     | Yes   | Yes      | No      | Yes     |
| Approve/reject loan        | Yes   | Yes      | No      | No      |
| Mark as returned           | Yes   | Yes      | No      | No      |

### Berita & Program

| Action                     | Admin | Pengurus | Relawan | Sahabat |
|---------------------------|-------|----------|---------|---------|
| View published content     | Yes   | Yes      | Yes     | Yes     |
| Create content             | Yes   | Yes      | No      | No      |
| Edit content               | Yes   | Yes      | No      | No      |
| Delete content             | Yes   | Yes      | No      | No      |
| Publish/unpublish          | Yes   | Yes      | No      | No      |

### Laporan Keuangan

| Action                     | Admin | Pengurus | Relawan | Sahabat |
|---------------------------|-------|----------|---------|---------|
| View financial summary     | Yes   | Yes      | Yes     | Yes     |
| Create/edit entries        | Yes   | Yes      | No      | No      |
| Delete entries             | Yes   | No       | No      | No      |
| Export reports             | Yes   | Yes      | No      | No      |

---

## Implementation

### Database Schema

```sql
CREATE TABLE role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role VARCHAR(20) NOT NULL,
    resource VARCHAR(50) NOT NULL,
    action VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(role, resource, action)
);

CREATE INDEX idx_role_permissions_role ON role_permissions(role);
CREATE INDEX idx_role_permissions_resource ON role_permissions(resource);
```

### SQLAlchemy Model

```python
class RolePermission(Base):
    __tablename__ = "role_permissions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    role = Column(String(20), nullable=False, index=True)
    resource = Column(String(50), nullable=False)
    action = Column(String(20), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("role", "resource", "action", name="uq_role_resource_action"),
    )
```

### Resource and Action Naming Convention

**Resources:** Plural noun matching the feature area.
```
users, bookings, donations, pickups, equipment, equipment_loans, content, finance
```

**Actions:** Standard CRUD verbs plus domain-specific actions.
```
create, read, read_own, read_assigned, update, update_own, update_assigned, delete,
approve, reject, assign, verify, publish
```

### FastAPI Dependency

```python
# deps.py

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Extract and validate user from JWT access token."""
    payload = decode_access_token(token)
    user = await db.get(User, payload.sub)
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")
    return user


def require_role(*allowed_roles: str):
    """Dependency factory that checks if the current user has one of the allowed roles."""
    async def role_checker(
        current_user: User = Depends(get_current_user),
    ) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail="Insufficient permissions"
            )
        return current_user
    return role_checker


async def check_permission(
    db: AsyncSession,
    role: str,
    resource: str,
    action: str,
) -> bool:
    """Check if a role has permission for a specific resource and action."""
    result = await db.execute(
        select(RolePermission).where(
            RolePermission.role == role,
            RolePermission.resource == resource,
            RolePermission.action == action,
        )
    )
    return result.scalar_one_or_none() is not None
```

### Usage in Endpoints

```python
# Simple role check
@router.get("/users")
async def list_users(
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    ...

# Multiple roles allowed
@router.get("/bookings")
async def list_all_bookings(
    current_user: User = Depends(require_role("admin", "pengurus")),
    db: AsyncSession = Depends(get_db),
):
    ...

# Fine-grained permission check within endpoint
@router.post("/bookings/{booking_id}/approve")
async def approve_booking(
    booking_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    has_perm = await check_permission(db, current_user.role, "bookings", "approve")
    if not has_perm:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    ...
```

---

## Seed Data SQL

```sql
-- ============================================
-- RBAC Seed Data for role_permissions table
-- ============================================

-- =====================
-- ADMIN: Full access
-- =====================
-- Users
INSERT INTO role_permissions (role, resource, action) VALUES ('admin', 'users', 'create');
INSERT INTO role_permissions (role, resource, action) VALUES ('admin', 'users', 'read');
INSERT INTO role_permissions (role, resource, action) VALUES ('admin', 'users', 'update');
INSERT INTO role_permissions (role, resource, action) VALUES ('admin', 'users', 'delete');

-- Bookings
INSERT INTO role_permissions (role, resource, action) VALUES ('admin', 'bookings', 'create');
INSERT INTO role_permissions (role, resource, action) VALUES ('admin', 'bookings', 'read');
INSERT INTO role_permissions (role, resource, action) VALUES ('admin', 'bookings', 'update');
INSERT INTO role_permissions (role, resource, action) VALUES ('admin', 'bookings', 'delete');
INSERT INTO role_permissions (role, resource, action) VALUES ('admin', 'bookings', 'approve');
INSERT INTO role_permissions (role, resource, action) VALUES ('admin', 'bookings', 'reject');
INSERT INTO role_permissions (role, resource, action) VALUES ('admin', 'bookings', 'assign');

-- Donations
INSERT INTO role_permissions (role, resource, action) VALUES ('admin', 'donations', 'create');
INSERT INTO role_permissions (role, resource, action) VALUES ('admin', 'donations', 'read');
INSERT INTO role_permissions (role, resource, action) VALUES ('admin', 'donations', 'update');
INSERT INTO role_permissions (role, resource, action) VALUES ('admin', 'donations', 'delete');
INSERT INTO role_permissions (role, resource, action) VALUES ('admin', 'donations', 'verify');

-- Pickups
INSERT INTO role_permissions (role, resource, action) VALUES ('admin', 'pickups', 'create');
INSERT INTO role_permissions (role, resource, action) VALUES ('admin', 'pickups', 'read');
INSERT INTO role_permissions (role, resource, action) VALUES ('admin', 'pickups', 'update');
INSERT INTO role_permissions (role, resource, action) VALUES ('admin', 'pickups', 'delete');
INSERT INTO role_permissions (role, resource, action) VALUES ('admin', 'pickups', 'assign');

-- Equipment
INSERT INTO role_permissions (role, resource, action) VALUES ('admin', 'equipment', 'create');
INSERT INTO role_permissions (role, resource, action) VALUES ('admin', 'equipment', 'read');
INSERT INTO role_permissions (role, resource, action) VALUES ('admin', 'equipment', 'update');
INSERT INTO role_permissions (role, resource, action) VALUES ('admin', 'equipment', 'delete');

-- Equipment Loans
INSERT INTO role_permissions (role, resource, action) VALUES ('admin', 'equipment_loans', 'create');
INSERT INTO role_permissions (role, resource, action) VALUES ('admin', 'equipment_loans', 'read');
INSERT INTO role_permissions (role, resource, action) VALUES ('admin', 'equipment_loans', 'update');
INSERT INTO role_permissions (role, resource, action) VALUES ('admin', 'equipment_loans', 'approve');
INSERT INTO role_permissions (role, resource, action) VALUES ('admin', 'equipment_loans', 'reject');

-- Content
INSERT INTO role_permissions (role, resource, action) VALUES ('admin', 'content', 'create');
INSERT INTO role_permissions (role, resource, action) VALUES ('admin', 'content', 'read');
INSERT INTO role_permissions (role, resource, action) VALUES ('admin', 'content', 'update');
INSERT INTO role_permissions (role, resource, action) VALUES ('admin', 'content', 'delete');
INSERT INTO role_permissions (role, resource, action) VALUES ('admin', 'content', 'publish');

-- Finance
INSERT INTO role_permissions (role, resource, action) VALUES ('admin', 'finance', 'create');
INSERT INTO role_permissions (role, resource, action) VALUES ('admin', 'finance', 'read');
INSERT INTO role_permissions (role, resource, action) VALUES ('admin', 'finance', 'update');
INSERT INTO role_permissions (role, resource, action) VALUES ('admin', 'finance', 'delete');

-- =====================
-- PENGURUS: Manage operations
-- =====================
-- Bookings
INSERT INTO role_permissions (role, resource, action) VALUES ('pengurus', 'bookings', 'create');
INSERT INTO role_permissions (role, resource, action) VALUES ('pengurus', 'bookings', 'read');
INSERT INTO role_permissions (role, resource, action) VALUES ('pengurus', 'bookings', 'update');
INSERT INTO role_permissions (role, resource, action) VALUES ('pengurus', 'bookings', 'approve');
INSERT INTO role_permissions (role, resource, action) VALUES ('pengurus', 'bookings', 'reject');
INSERT INTO role_permissions (role, resource, action) VALUES ('pengurus', 'bookings', 'assign');

-- Donations
INSERT INTO role_permissions (role, resource, action) VALUES ('pengurus', 'donations', 'create');
INSERT INTO role_permissions (role, resource, action) VALUES ('pengurus', 'donations', 'read');
INSERT INTO role_permissions (role, resource, action) VALUES ('pengurus', 'donations', 'update');
INSERT INTO role_permissions (role, resource, action) VALUES ('pengurus', 'donations', 'verify');

-- Pickups
INSERT INTO role_permissions (role, resource, action) VALUES ('pengurus', 'pickups', 'create');
INSERT INTO role_permissions (role, resource, action) VALUES ('pengurus', 'pickups', 'read');
INSERT INTO role_permissions (role, resource, action) VALUES ('pengurus', 'pickups', 'update');
INSERT INTO role_permissions (role, resource, action) VALUES ('pengurus', 'pickups', 'assign');

-- Equipment
INSERT INTO role_permissions (role, resource, action) VALUES ('pengurus', 'equipment', 'create');
INSERT INTO role_permissions (role, resource, action) VALUES ('pengurus', 'equipment', 'read');
INSERT INTO role_permissions (role, resource, action) VALUES ('pengurus', 'equipment', 'update');

-- Equipment Loans
INSERT INTO role_permissions (role, resource, action) VALUES ('pengurus', 'equipment_loans', 'read');
INSERT INTO role_permissions (role, resource, action) VALUES ('pengurus', 'equipment_loans', 'update');
INSERT INTO role_permissions (role, resource, action) VALUES ('pengurus', 'equipment_loans', 'approve');
INSERT INTO role_permissions (role, resource, action) VALUES ('pengurus', 'equipment_loans', 'reject');

-- Content
INSERT INTO role_permissions (role, resource, action) VALUES ('pengurus', 'content', 'create');
INSERT INTO role_permissions (role, resource, action) VALUES ('pengurus', 'content', 'read');
INSERT INTO role_permissions (role, resource, action) VALUES ('pengurus', 'content', 'update');
INSERT INTO role_permissions (role, resource, action) VALUES ('pengurus', 'content', 'delete');
INSERT INTO role_permissions (role, resource, action) VALUES ('pengurus', 'content', 'publish');

-- Finance
INSERT INTO role_permissions (role, resource, action) VALUES ('pengurus', 'finance', 'create');
INSERT INTO role_permissions (role, resource, action) VALUES ('pengurus', 'finance', 'read');
INSERT INTO role_permissions (role, resource, action) VALUES ('pengurus', 'finance', 'update');

-- =====================
-- RELAWAN: Task execution
-- =====================
-- Bookings (assigned only - enforced in application logic)
INSERT INTO role_permissions (role, resource, action) VALUES ('relawan', 'bookings', 'read_assigned');
INSERT INTO role_permissions (role, resource, action) VALUES ('relawan', 'bookings', 'update_assigned');

-- Donations (own only)
INSERT INTO role_permissions (role, resource, action) VALUES ('relawan', 'donations', 'create');
INSERT INTO role_permissions (role, resource, action) VALUES ('relawan', 'donations', 'read_own');

-- Pickups (assigned only - enforced in application logic)
INSERT INTO role_permissions (role, resource, action) VALUES ('relawan', 'pickups', 'read_assigned');
INSERT INTO role_permissions (role, resource, action) VALUES ('relawan', 'pickups', 'update_assigned');

-- Equipment
INSERT INTO role_permissions (role, resource, action) VALUES ('relawan', 'equipment', 'read');

-- Content
INSERT INTO role_permissions (role, resource, action) VALUES ('relawan', 'content', 'read');

-- Finance
INSERT INTO role_permissions (role, resource, action) VALUES ('relawan', 'finance', 'read');

-- =====================
-- SAHABAT: Service consumer
-- =====================
-- Bookings (own only - enforced in application logic)
INSERT INTO role_permissions (role, resource, action) VALUES ('sahabat', 'bookings', 'create');
INSERT INTO role_permissions (role, resource, action) VALUES ('sahabat', 'bookings', 'read_own');
INSERT INTO role_permissions (role, resource, action) VALUES ('sahabat', 'bookings', 'update_own');

-- Donations (own only)
INSERT INTO role_permissions (role, resource, action) VALUES ('sahabat', 'donations', 'create');
INSERT INTO role_permissions (role, resource, action) VALUES ('sahabat', 'donations', 'read_own');

-- Pickups (own only)
INSERT INTO role_permissions (role, resource, action) VALUES ('sahabat', 'pickups', 'create');
INSERT INTO role_permissions (role, resource, action) VALUES ('sahabat', 'pickups', 'read_own');

-- Equipment
INSERT INTO role_permissions (role, resource, action) VALUES ('sahabat', 'equipment', 'read');

-- Equipment Loans (own only)
INSERT INTO role_permissions (role, resource, action) VALUES ('sahabat', 'equipment_loans', 'create');
INSERT INTO role_permissions (role, resource, action) VALUES ('sahabat', 'equipment_loans', 'read_own');

-- Content
INSERT INTO role_permissions (role, resource, action) VALUES ('sahabat', 'content', 'read');

-- Finance (public transparency)
INSERT INTO role_permissions (role, resource, action) VALUES ('sahabat', 'finance', 'read');
```

---

## Notes

- The `role` column on the `users` table is the source of truth for a user's role.
- The `role_permissions` table defines what each role can do. This table-driven approach allows permissions to be modified without code changes.
- Ownership checks (`read_own`, `update_own`, `read_assigned`, `update_assigned`) are enforced at the application/query level by filtering on `user_id` or `assigned_to`.
- Admin role has permissions explicitly listed (not a wildcard bypass) to maintain auditability.
- New permissions can be added by inserting rows into `role_permissions`, then referencing them in endpoint dependencies.

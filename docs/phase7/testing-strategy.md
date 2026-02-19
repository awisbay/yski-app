# Phase 7: Testing Strategy

> Comprehensive testing approach for the Yayasan Sahabat Khairat Indonesia application.

---

## 1. Testing Pyramid

```
         ╱╲
        ╱  ╲          E2E Tests (5%)
       ╱────╲         - Critical user journeys
      ╱      ╲        - Cross-platform mobile
     ╱────────╲       Integration Tests (25%)
    ╱          ╲      - API endpoint tests
   ╱────────────╲     - Service layer tests
  ╱              ╲    - Database interaction
 ╱────────────────╲   Unit Tests (70%)
╱                  ╲  - Business logic
╱────────────────────╲ - Utilities, validators
```

---

## 2. Backend Testing

### 2.1 Test Framework & Tools

| Tool | Purpose |
|------|---------|
| `pytest` | Test runner & framework |
| `pytest-asyncio` | Async test support |
| `pytest-cov` | Coverage reporting |
| `httpx` | Async HTTP client for API testing |
| `factory-boy` | Test data factories |
| `faker` | Realistic fake data generation |
| `testcontainers` | Isolated database for tests |

### 2.2 Test Structure

```
backend/tests/
├── conftest.py              # Global fixtures
├── factories/
│   ├── user_factory.py      # User data factories
│   ├── booking_factory.py
│   ├── donation_factory.py
│   └── ...
├── unit/
│   ├── test_security.py     # JWT, password hashing
│   ├── test_validators.py   # Input validation
│   └── services/
│       ├── test_user_service.py
│       ├── test_booking_service.py
│       ├── test_donation_service.py
│       ├── test_equipment_service.py
│       ├── test_pickup_service.py
│       ├── test_auction_service.py
│       ├── test_financial_service.py
│       └── test_notification_service.py
├── integration/
│   ├── test_auth_api.py
│   ├── test_users_api.py
│   ├── test_bookings_api.py
│   ├── test_donations_api.py
│   ├── test_equipment_api.py
│   ├── test_pickups_api.py
│   ├── test_content_api.py
│   ├── test_auction_api.py
│   ├── test_financial_api.py
│   └── test_notifications_api.py
├── database/
│   ├── test_migrations.py
│   └── test_concurrent.py   # Race condition tests
└── performance/
    └── test_load.py         # Basic load tests
```

### 2.3 Test Fixtures (conftest.py)

```python
# Key fixtures needed:
@pytest.fixture
async def db_session():
    """Isolated database session per test (rollback after each)."""

@pytest.fixture
async def client(db_session):
    """FastAPI test client with database override."""

@pytest.fixture
async def admin_user(db_session):
    """Pre-created admin user."""

@pytest.fixture
async def sahabat_user(db_session):
    """Pre-created sahabat (public) user."""

@pytest.fixture
async def auth_headers(admin_user):
    """Authorization headers with valid JWT token."""

@pytest.fixture
async def sahabat_headers(sahabat_user):
    """Authorization headers for sahabat role."""
```

### 2.4 Critical Test Scenarios

#### Anti-Double-Booking
```python
async def test_concurrent_booking_same_slot():
    """Two users try to book the same date+slot simultaneously.
    Only one should succeed, the other should get 409 Conflict."""

async def test_booking_after_cancellation():
    """After a booking is cancelled, the slot becomes available again."""

async def test_booking_past_date_rejected():
    """Cannot create booking for past dates."""
```

#### Auction Bidding
```python
async def test_concurrent_bids():
    """Multiple bids on the same item - highest wins, no inconsistency."""

async def test_bid_below_minimum_increment():
    """Bid must be >= current_price + min_increment (Rp 5,000)."""

async def test_bid_on_own_item():
    """Donor cannot bid on their own auctioned item."""

async def test_bid_on_expired_auction():
    """Cannot bid after auction end_time."""
```

#### RBAC
```python
async def test_sahabat_cannot_approve_booking():
    """Sahabat role gets 403 on booking approval endpoint."""

async def test_admin_can_access_all():
    """Admin role can access all endpoints."""

async def test_relawan_only_assigned():
    """Relawan can only see/update tasks assigned to them."""
```

### 2.5 Running Tests

```bash
# All tests
cd backend && pytest tests/ -v

# With coverage
pytest tests/ -v --cov=app --cov-report=html --cov-report=term-missing

# Specific module
pytest tests/unit/services/test_booking_service.py -v

# Only integration tests
pytest tests/integration/ -v

# Parallel execution
pytest tests/ -v -n auto  # requires pytest-xdist
```

---

## 3. Mobile Testing

### 3.1 Test Framework & Tools

| Tool | Purpose |
|------|---------|
| `jest` | Test runner |
| `@testing-library/react-native` | Component testing |
| `@testing-library/jest-native` | Custom matchers |
| `msw` | API mocking (Mock Service Worker) |
| `jest-expo` | Expo-specific Jest preset |

### 3.2 Test Structure

```
mobile/__tests__/
├── setup.ts                   # Test setup & mocks
├── mocks/
│   ├── handlers.ts            # MSW API handlers
│   └── server.ts              # MSW server setup
├── components/
│   ├── Button.test.tsx
│   ├── Input.test.tsx
│   ├── Card.test.tsx
│   ├── Badge.test.tsx
│   └── ...
├── hooks/
│   ├── useAuth.test.ts
│   ├── useBookings.test.ts
│   └── ...
├── screens/
│   ├── Login.test.tsx
│   ├── Home.test.tsx
│   ├── BookingList.test.tsx
│   ├── DonationForm.test.tsx
│   └── ...
└── stores/
    ├── authStore.test.ts
    ├── bookingStore.test.ts
    └── ...
```

### 3.3 Component Test Example

```typescript
// Button.test.tsx
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '@/components/Button';

describe('Button', () => {
  it('renders with correct text', () => {
    const { getByText } = render(<Button title="Submit" onPress={() => {}} />);
    expect(getByText('Submit')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button title="Submit" onPress={onPress} />);
    fireEvent.press(getByText('Submit'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <Button title="Submit" onPress={onPress} disabled />
    );
    fireEvent.press(getByText('Submit'));
    expect(onPress).not.toHaveBeenCalled();
  });
});
```

### 3.4 Running Mobile Tests

```bash
cd mobile

# All tests
npm test

# With coverage
npm test -- --coverage

# Watch mode
npm test -- --watch

# Specific file
npm test -- Button.test.tsx
```

---

## 4. End-to-End Test Scenarios

### Critical User Journeys

| # | Journey | Steps | Expected Result |
|---|---------|-------|-----------------|
| 1 | **New User Registration** | Register → Login → View home | User sees home screen with greeting |
| 2 | **Book Pindahan** | Select date → Select slot → Fill address → Submit | Booking created, appears in history |
| 3 | **Make Donation** | Select type → Enter amount → Choose payment → Submit | Donation created with pending status |
| 4 | **Request Pickup** | Select type → Fill address → Choose schedule → Submit | Pickup request created |
| 5 | **Borrow Equipment** | Browse list → Request loan → Wait approval | Loan request created, stock unchanged |
| 6 | **Place Auction Bid** | Browse auctions → View detail → Enter bid → Submit | Bid recorded, current price updated |
| 7 | **Admin Booking Approval** | Login as admin → View bookings → Approve → Assign | Booking status changes to approved |
| 8 | **View Financial Report** | Open financial tab → View dashboard → Download PDF | Charts render, PDF downloads |

---

## 5. Coverage Targets

| Area | Target | Rationale |
|------|--------|-----------|
| Backend overall | ≥ 80% | Industry standard for production apps |
| Auth module | ≥ 90% | Security-critical code |
| Booking engine | ≥ 85% | Business-critical with race conditions |
| Auction bidding | ≥ 85% | Financial logic, concurrency |
| Mobile components | ≥ 70% | UI rendering coverage |
| Mobile hooks | ≥ 75% | Data fetching logic |
| Mobile screens | ≥ 60% | Integration-level coverage |

---

## 6. Test Data Seeding

### Development Seed Data

```python
# Seed script creates:
# - 1 admin user (admin@yski.or.id)
# - 2 pengurus users
# - 3 relawan users
# - 10 sahabat users
# - 20 bookings (various statuses)
# - 15 equipment items (various categories)
# - 10 active equipment loans
# - 30 donations (various types and statuses)
# - 8 pickup requests
# - 5 programs (with varying progress)
# - 15 news articles
# - 3 auction items (draft, active, sold)
# - 2 financial reports with entries
# - 50 notifications
```

### Test Environment Isolation

- Each test uses a fresh database transaction (rolled back after test)
- MinIO tests use separate test bucket
- Redis tests use separate database index
- No shared state between tests

---

*Last updated: 2026-02-18*

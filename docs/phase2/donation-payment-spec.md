# Donation & Payment Specification

> Online donations with pluggable payment gateway abstraction.

## Database Schema

```sql
CREATE TABLE donations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    donation_code   VARCHAR(16) NOT NULL UNIQUE,  -- format: CKY-XXXXXXXX
    donation_type   VARCHAR(20) NOT NULL,          -- infaq, zakat_mal, zakat_fitrah, sedekah

    -- Donor (nullable for anonymous donations)
    donor_id        UUID REFERENCES users(id),
    donor_name      VARCHAR(255) NOT NULL,
    donor_email     VARCHAR(255),
    donor_phone     VARCHAR(20),
    is_anonymous    BOOLEAN NOT NULL DEFAULT false,

    -- Amount
    amount          DECIMAL(15, 2) NOT NULL,
    currency        VARCHAR(3) NOT NULL DEFAULT 'IDR',

    -- Payment
    payment_method  VARCHAR(30),  -- qris, gopay, ovo, shopeepay, bca_va, mandiri_va, bni_va
    payment_url     VARCHAR(512), -- redirect URL from gateway
    gateway_ref     VARCHAR(255), -- reference ID from payment gateway
    gateway_name    VARCHAR(30),  -- midtrans, xendit

    -- Status
    status          VARCHAR(20) NOT NULL DEFAULT 'pending',
    paid_at         TIMESTAMPTZ,
    expired_at      TIMESTAMPTZ,  -- auto-set to created_at + 24 hours

    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_donations_status ON donations(status);
CREATE INDEX idx_donations_donor ON donations(donor_id);
CREATE INDEX idx_donations_type ON donations(donation_type);
CREATE INDEX idx_donations_code ON donations(donation_code);
```

## Donation Types

| Type          | Description                    |
|---------------|--------------------------------|
| infaq         | General voluntary contribution |
| zakat_mal     | Zakat on wealth                |
| zakat_fitrah  | Zakat al-Fitr (Ramadan)        |
| sedekah       | Charity / alms                 |

## Payment Methods

| Method      | Type            |
|-------------|-----------------|
| qris        | QR Code         |
| gopay       | E-Wallet        |
| ovo         | E-Wallet        |
| shopeepay   | E-Wallet        |
| bca_va      | Virtual Account |
| mandiri_va  | Virtual Account |
| bni_va      | Virtual Account |

## Donation Code Format

Format: `CKY-XXXXXXXX` where `X` is a random alphanumeric character (uppercase + digits).

```python
import secrets
import string

def generate_donation_code() -> str:
    charset = string.ascii_uppercase + string.digits
    random_part = "".join(secrets.choice(charset) for _ in range(8))
    return f"CKY-{random_part}"
```

Examples: `CKY-A3K9M2X7`, `CKY-R8T4W1P5`

## Payment Gateway Abstraction

```python
from abc import ABC, abstractmethod
from dataclasses import dataclass
from decimal import Decimal
from enum import Enum


class PaymentStatus(str, Enum):
    PENDING = "pending"
    PAID = "paid"
    EXPIRED = "expired"
    FAILED = "failed"


@dataclass
class PaymentResult:
    gateway_ref: str
    payment_url: str       # redirect URL for the user
    status: PaymentStatus
    raw_response: dict     # full gateway response for logging


@dataclass
class WebhookResult:
    gateway_ref: str
    status: PaymentStatus
    paid_at: datetime | None
    amount: Decimal
    raw_payload: dict


class PaymentProvider(ABC):
    """Abstract interface for payment gateway integrations."""

    @abstractmethod
    async def create_payment(
        self, amount: Decimal, method: str, ref_id: str
    ) -> PaymentResult:
        """Create a payment transaction and return a payment URL."""
        ...

    @abstractmethod
    async def check_status(self, gateway_ref: str) -> PaymentStatus:
        """Check the current status of a payment."""
        ...

    @abstractmethod
    async def handle_webhook(self, payload: dict) -> WebhookResult:
        """Parse and validate an incoming webhook from the gateway."""
        ...


class MidtransProvider(PaymentProvider):
    """Midtrans payment gateway implementation."""

    async def create_payment(self, amount, method, ref_id):
        # Midtrans Snap / Core API integration
        ...

    async def check_status(self, gateway_ref):
        ...

    async def handle_webhook(self, payload):
        # Validate signature, parse notification
        ...


class XenditProvider(PaymentProvider):
    """Xendit payment gateway implementation."""

    async def create_payment(self, amount, method, ref_id):
        # Xendit Invoice / E-Wallet API
        ...

    async def check_status(self, gateway_ref):
        ...

    async def handle_webhook(self, payload):
        # Validate callback token, parse event
        ...
```

Gateway selection is configured via environment variable (`PAYMENT_GATEWAY=midtrans`) and resolved at startup.

## Donation Flow

1. **User** selects donation type and enters amount.
2. **User** selects payment method.
3. **Backend** creates a `Donation` record with `status=pending` and `expired_at = now + 24h`.
4. **Backend** calls `PaymentProvider.create_payment()` to get a `payment_url`.
5. **User** is redirected to the payment URL to complete payment.
6. **Payment gateway** sends a webhook callback to `POST /donations/webhook`.
7. **Backend** calls `PaymentProvider.handle_webhook()`, validates the payload, and updates the donation `status` to `paid` with `paid_at` timestamp.
8. If no payment is received within 24 hours, a scheduled job marks the donation as `expired`.

## Expiry

Unpaid donations expire after 24 hours. A background job runs periodically:

```python
async def expire_pending_donations(db: AsyncSession):
    stmt = (
        update(Donation)
        .where(
            Donation.status == "pending",
            Donation.expired_at < func.now(),
        )
        .values(status="expired", updated_at=func.now())
    )
    await db.execute(stmt)
    await db.commit()
```

## Anonymous Donations

- `donor_id` is nullable. If the user is not logged in, `donor_id` is `NULL`.
- `donor_name` is always required (even for anonymous donors -- stored internally but not displayed publicly when `is_anonymous=true`).
- Anonymous donations do not appear in any user's donation history.

## API Endpoints

| Method | Path                      | Role(s)              | Description                          |
|--------|---------------------------|----------------------|--------------------------------------|
| POST   | /donations                | Any (auth optional)  | Create a donation                    |
| POST   | /donations/webhook        | Public (gateway)     | Payment gateway webhook callback     |
| GET    | /donations/my             | Authenticated user   | Donation history for current user    |
| GET    | /donations/{id}           | Owner, Pengurus      | Donation detail                      |
| GET    | /donations                | Pengurus, Admin      | List all donations (filterable)      |
| GET    | /donations/summary        | Pengurus, Admin      | Aggregated donation stats            |

# Database Entity Relationship Documentation

> PostgreSQL 16 — Yayasan Sahabat Khairat Indonesia

---

## 1. Entity Relationship Diagram (Text)

```
┌──────────────────┐     ┌────────────────────┐
│      users       │     │  role_permissions   │
├──────────────────┤     ├────────────────────┤
│ id (UUID) PK     │     │ id (SERIAL) PK     │
│ full_name        │     │ role               │
│ email (UNIQUE)   │     │ resource           │
│ phone            │     │ action             │
│ password_hash    │     │ UNIQUE(role,       │
│ avatar_url       │     │   resource, action)│
│ role             │     └────────────────────┘
│ is_active        │
│ created_at       │
│ updated_at       │
└──────┬───────────┘
       │
       │ 1:N relationships
       ├──────────────────────────────────────────┐
       │                                          │
       ▼                                          ▼
┌──────────────────┐                   ┌──────────────────┐
│ moving_bookings  │                   │   donations      │
├──────────────────┤                   ├──────────────────┤
│ id (UUID) PK     │                   │ id (UUID) PK     │
│ requester_id FK  │──→ users.id       │ donation_code UK │
│ booking_code     │                   │ donor_id FK      │──→ users.id (nullable)
│ booking_date     │                   │ donor_name       │
│ time_slot        │                   │ amount           │
│ pickup_address   │                   │ type             │
│ pickup_lat/lng   │                   │ payment_method   │
│ dest_address     │                   │ payment_status   │
│ dest_lat/lng     │                   │ proof_url        │
│ status           │                   │ paid_at          │
│ approved_by FK   │──→ users.id       │ created_at       │
│ assigned_to FK   │──→ users.id       │ updated_at       │
│ rating           │                   └──────────────────┘
│ review_text      │
│ UNIQUE(date,slot)│
│ created_at       │
│ updated_at       │
└──────────────────┘

       │
       ├──────────────────────────────────────────┐
       │                                          │
       ▼                                          ▼
┌──────────────────┐                   ┌──────────────────┐
│medical_equipment │                   │ pickup_requests  │
├──────────────────┤                   ├──────────────────┤
│ id (UUID) PK     │                   │ id (UUID) PK     │
│ name             │                   │ requester_name   │
│ description      │                   │ requester_phone  │
│ image_url        │                   │ donation_type    │
│ total_qty        │                   │ pickup_address   │
│ category         │                   │ pickup_lat/lng   │
│ condition_notes  │                   │ preferred_date   │
│ created_at       │                   │ preferred_slot   │
│ updated_at       │                   │ status           │
└───────┬──────────┘                   │ scheduled_date   │
        │                              │ assigned_to FK   │──→ users.id
        │ 1:N                          │ approved_by FK   │──→ users.id
        ▼                              │ collected_amount │
┌──────────────────┐                   │ proof_photo_url  │
│ equipment_loans  │                   │ created_at       │
├──────────────────┤                   │ updated_at       │
│ id (UUID) PK     │                   └──────────────────┘
│ equipment_id FK  │──→ medical_equipment.id
│ borrower_id FK   │──→ users.id
│ status           │
│ approved_by FK   │──→ users.id
│ loan_date        │
│ expected_return  │
│ actual_return    │
│ notes            │
│ created_at       │
│ updated_at       │
└──────────────────┘


┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│  auction_items   │      │  auction_images  │      │   auction_bids   │
├──────────────────┤      ├──────────────────┤      ├──────────────────┤
│ id (UUID) PK     │◄──┐  │ id (UUID) PK     │      │ id (UUID) PK     │
│ title            │   │  │ auction_item_id  │──→   │ auction_item_id  │──→
│ description      │   │  │ image_url        │      │ bidder_id FK     │──→ users.id
│ starting_price   │   │  │ sort_order       │      │ amount           │
│ current_price    │   └──│ FK CASCADE       │      │ created_at       │
│ min_increment    │      └──────────────────┘      └──────────────────┘
│ status           │
│ donor_id FK      │──→ users.id
│ winner_id FK     │──→ users.id (nullable)
│ start_time       │
│ end_time         │
│ created_at       │
│ updated_at       │
└──────────────────┘


┌──────────────────┐      ┌──────────────────┐
│    programs      │      │  news_articles   │
├──────────────────┤      ├──────────────────┤
│ id (UUID) PK     │      │ id (UUID) PK     │
│ title            │      │ title            │
│ description      │      │ content          │
│ cover_image_url  │      │ cover_image_url  │
│ category         │      │ category         │
│ status           │      │ author_id FK     │──→ users.id
│ participant_count│      │ is_published     │
│ start_date       │      │ published_at     │
│ end_date         │      │ created_at       │
│ created_at       │      └──────────────────┘
└──────────────────┘


┌────────────────────┐      ┌──────────────────┐
│ financial_reports  │      │financial_entries │
├────────────────────┤      ├──────────────────┤
│ id (UUID) PK       │◄──┐  │ id (UUID) PK     │
│ period_start       │   │  │ report_id FK     │──→
│ period_end         │   │  │ category         │
│ total_income       │   │  │ type (income/    │
│ total_expense      │   └──│   expense)       │
│ report_pdf_url     │      │ amount           │
│ is_audited         │      │ description      │
│ created_at         │      │ reference_id     │
└────────────────────┘      │ reference_type   │
                            │ entry_date       │
                            │ created_at       │
                            └──────────────────┘


┌──────────────────┐
│  notifications   │
├──────────────────┤
│ id (UUID) PK     │
│ user_id FK       │──→ users.id
│ title            │
│ body             │
│ type             │
│ reference_id     │
│ is_read          │
│ created_at       │
└──────────────────┘
```

---

## 2. Table Relationships

### users (Central Entity)

| Relationship | Related Table | Type | FK Column |
|-------------|---------------|------|-----------|
| Requester → Bookings | `moving_bookings` | 1:N | `requester_id` |
| Approver → Bookings | `moving_bookings` | 1:N | `approved_by` |
| Assignee → Bookings | `moving_bookings` | 1:N | `assigned_to` |
| Donor → Donations | `donations` | 1:N | `donor_id` (nullable) |
| Borrower → Loans | `equipment_loans` | 1:N | `borrower_id` |
| Approver → Loans | `equipment_loans` | 1:N | `approved_by` |
| Assignee → Pickups | `pickup_requests` | 1:N | `assigned_to` |
| Approver → Pickups | `pickup_requests` | 1:N | `approved_by` |
| Donor → Auctions | `auction_items` | 1:N | `donor_id` |
| Winner → Auctions | `auction_items` | 1:N | `winner_id` (nullable) |
| Bidder → Bids | `auction_bids` | 1:N | `bidder_id` |
| Author → News | `news_articles` | 1:N | `author_id` |
| Recipient → Notifications | `notifications` | 1:N | `user_id` |

### medical_equipment → equipment_loans
- One equipment can have many loan records
- FK: `equipment_loans.equipment_id` → `medical_equipment.id`

### auction_items → auction_images
- One auction item can have many images
- FK: `auction_images.auction_item_id` → `auction_items.id`
- ON DELETE CASCADE (images deleted with item)

### auction_items → auction_bids
- One auction item can have many bids
- FK: `auction_bids.auction_item_id` → `auction_items.id`

### financial_reports → financial_entries
- One report can have many entries
- FK: `financial_entries.report_id` → `financial_reports.id`

---

## 3. Indexes

| Table | Index | Columns | Purpose |
|-------|-------|---------|---------|
| `users` | PK | `id` | Primary key lookup |
| `users` | UNIQUE | `email` | Login lookup, prevent duplicates |
| `moving_bookings` | UNIQUE | `(booking_date, time_slot)` | Anti-double-booking |
| `moving_bookings` | idx | `(booking_date, status)` | Slot availability queries |
| `moving_bookings` | idx | `requester_id` | User's bookings lookup |
| `donations` | UNIQUE | `donation_code` | Code lookup |
| `donations` | idx | `(payment_status, created_at)` | Status + date filtering |
| `equipment_loans` | idx | `(equipment_id, status)` | Stock calculation |
| `auction_items` | idx | `status` | Active auction listing |
| `notifications` | idx | `(user_id, is_read) WHERE is_read = FALSE` | Unread count (partial) |
| `role_permissions` | UNIQUE | `(role, resource, action)` | Permission lookup |

---

## 4. Database Views

### equipment_stock

Real-time stock calculation view:

```sql
CREATE VIEW equipment_stock AS
SELECT
    me.id,
    me.name,
    me.image_url,
    me.total_qty,
    me.total_qty - COALESCE(active.count, 0) AS available,
    COALESCE(active.count, 0) AS on_loan,
    COALESCE(pending.count, 0) AS pending_requests
FROM medical_equipment me
LEFT JOIN (
    SELECT equipment_id, COUNT(*) as count
    FROM equipment_loans WHERE status IN ('active', 'approved')
    GROUP BY equipment_id
) active ON me.id = active.equipment_id
LEFT JOIN (
    SELECT equipment_id, COUNT(*) as count
    FROM equipment_loans WHERE status = 'requested'
    GROUP BY equipment_id
) pending ON me.id = pending.equipment_id;
```

**Usage:** Equipment listing with accurate availability counts.

---

## 5. Key Constraints

### CHECK Constraints

| Table | Column | Allowed Values |
|-------|--------|---------------|
| `users` | `role` | `admin`, `pengurus`, `relawan`, `sahabat` |
| `moving_bookings` | `time_slot` | `08:00`, `10:00`, `13:00`, `15:00` |
| `moving_bookings` | `status` | `pending`, `approved`, `rejected`, `in_progress`, `completed`, `cancelled` |
| `moving_bookings` | `rating` | 1-5 |
| `equipment_loans` | `status` | `requested`, `approved`, `active`, `returned`, `overdue`, `rejected` |
| `donations` | `type` | `infaq`, `zakat_mal`, `zakat_fitrah`, `sedekah` |
| `donations` | `payment_method` | `qris`, `gopay`, `ovo`, `shopeepay`, `bca_va`, `mandiri_va`, `bni_va` |
| `donations` | `payment_status` | `pending`, `paid`, `expired`, `failed`, `refunded` |
| `pickup_requests` | `donation_type` | `zakat`, `kencleng_infaq` |
| `pickup_requests` | `status` | `pending`, `scheduled`, `in_progress`, `completed`, `cancelled` |
| `auction_items` | `status` | `draft`, `active`, `sold`, `expired`, `cancelled` |
| `financial_entries` | `type` | `income`, `expense` |

### UNIQUE Constraints

| Table | Columns | Purpose |
|-------|---------|---------|
| `users` | `email` | One account per email |
| `moving_bookings` | `(booking_date, time_slot)` | One booking per slot (anti-double-booking) |
| `donations` | `donation_code` | Unique donation reference code |
| `role_permissions` | `(role, resource, action)` | No duplicate permission entries |

---

## 6. Soft Delete Strategy

All primary tables use `is_active` boolean for soft delete instead of hard delete:
- `users.is_active` — deactivated users cannot login
- Equipment and other resources — filtered in queries via `WHERE is_active = true`

Benefits:
- Data preserved for audit trail
- References from other tables remain valid
- Can be "undeleted" if needed

---

## 7. Timestamp Conventions

All tables include:
- `created_at TIMESTAMPTZ DEFAULT NOW()` — immutable, set on insert
- `updated_at TIMESTAMPTZ DEFAULT NOW()` — updated on every modification

PostgreSQL timezone: UTC (stored), displayed in Asia/Jakarta for users.

---

## 8. UUID Strategy

- All primary keys use UUID v4: `DEFAULT gen_random_uuid()`
- Benefits: no sequential enumeration, safe for distributed systems
- Exception: `role_permissions.id` uses SERIAL (auto-increment) — internal use only

---

## 9. Table Statistics (Expected Scale)

| Table | Expected Rows (Year 1) | Growth Rate |
|-------|----------------------|-------------|
| `users` | 500-2,000 | +50/month |
| `moving_bookings` | 500-1,500 | ~100/month |
| `donations` | 1,000-5,000 | ~300/month |
| `pickup_requests` | 200-800 | ~50/month |
| `medical_equipment` | 50-200 | +5/month |
| `equipment_loans` | 200-800 | ~50/month |
| `auction_items` | 50-200 | ~20/month |
| `auction_bids` | 500-2,000 | ~100/month |
| `programs` | 20-50 | +3/month |
| `news_articles` | 100-500 | ~30/month |
| `financial_reports` | 12-24 | 1-2/month |
| `financial_entries` | 500-2,000 | ~100/month |
| `notifications` | 5,000-20,000 | ~1,000/month |
| `role_permissions` | ~60 (seed data) | Static |

---

*Last updated: 2026-02-18*

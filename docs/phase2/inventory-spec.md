# Medical Equipment Inventory Specification (Alkes)

> Equipment catalog, real-time stock tracking via SQL VIEW, and loan management.

## Database Schema

### Equipment Catalog

```sql
CREATE TABLE medical_equipment (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    image_url   VARCHAR(512),          -- stored in MinIO
    category    VARCHAR(50) NOT NULL,
    condition   VARCHAR(20) NOT NULL DEFAULT 'good',  -- good, fair, needs_repair
    total_qty   INTEGER NOT NULL DEFAULT 0,
    is_active   BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_equipment_category ON medical_equipment(category);
CREATE INDEX idx_equipment_active ON medical_equipment(is_active);
```

### Equipment Loans

```sql
CREATE TABLE equipment_loans (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id      UUID NOT NULL REFERENCES medical_equipment(id),
    borrower_id       UUID NOT NULL REFERENCES users(id),       -- Sahabat
    borrower_name     VARCHAR(255) NOT NULL,
    borrower_phone    VARCHAR(20) NOT NULL,
    borrower_address  TEXT,

    quantity           INTEGER NOT NULL DEFAULT 1,
    status             VARCHAR(20) NOT NULL DEFAULT 'requested',

    -- Dates
    loan_date          DATE,             -- set on approval
    expected_return    DATE,             -- set on approval
    actual_return      DATE,             -- set when returned

    -- Workflow
    approved_by        UUID REFERENCES users(id),   -- Pengurus
    notes              TEXT,
    return_notes       TEXT,
    return_condition   VARCHAR(20),       -- good, fair, damaged

    created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_loans_equipment ON equipment_loans(equipment_id);
CREATE INDEX idx_loans_borrower ON equipment_loans(borrower_id);
CREATE INDEX idx_loans_status ON equipment_loans(status);
```

## Equipment Categories

| Category       | Indonesian Name          |
|----------------|--------------------------|
| wheelchair     | Kursi Roda               |
| oxygen_tank    | Tabung Oksigen           |
| hospital_bed   | Tempat Tidur Pasien      |
| crutches       | Tongkat / Kruk           |
| nebulizer      | Nebulizer                |
| walker         | Walker / Alat Bantu Jalan|
| commode_chair  | Kursi BAB                |
| suction_pump   | Suction Pump             |

## Real-Time Stock via SQL VIEW

```sql
CREATE OR REPLACE VIEW equipment_stock AS
SELECT
    e.id,
    e.name,
    e.category,
    e.condition,
    e.total_qty,
    e.total_qty - COALESCE(active_loans.loaned_qty, 0) AS available_qty,
    COALESCE(active_loans.loaned_qty, 0)                AS loaned_qty,
    e.is_active
FROM medical_equipment e
LEFT JOIN (
    SELECT
        equipment_id,
        SUM(quantity) AS loaned_qty
    FROM equipment_loans
    WHERE status IN ('approved', 'active')
    GROUP BY equipment_id
) active_loans ON active_loans.equipment_id = e.id;
```

Usage:

```sql
-- All available equipment
SELECT * FROM equipment_stock WHERE is_active = true AND available_qty > 0;

-- Stock for a specific item
SELECT * FROM equipment_stock WHERE id = '<uuid>';
```

## Status Flow

```
requested ──> approved ──> active ──> returned
    │
    └──> rejected

active ──> overdue  (set by scheduled job)
```

- **requested**: Sahabat submitted a loan request.
- **approved**: Pengurus approved; `loan_date` and `expected_return` are set.
- **active**: Equipment has been handed over to the borrower.
- **returned**: Borrower returned the equipment; `actual_return` and `return_condition` recorded.
- **rejected**: Pengurus declined the request.
- **overdue**: Scheduled job detected `expected_return < today` for active loans.

## Loan Flow

1. **Sahabat** browses available equipment (filtered by `equipment_stock` VIEW where `available_qty > 0`).
2. **Sahabat** submits a loan request specifying the equipment and quantity.
3. **Pengurus** reviews the request, approves it, and sets `loan_date` + `expected_return`.
4. Equipment is handed over; status moves to `active`.
5. When the borrower returns the equipment, **Pengurus** records `actual_return`, `return_condition`, and any `return_notes`.
6. Status moves to `returned`; `available_qty` in the VIEW increases accordingly.

## Overdue Detection

A scheduled background job (APScheduler or Celery Beat) runs daily:

```python
async def check_overdue_loans(db: AsyncSession):
    """Mark active loans past their expected return date as overdue."""
    stmt = (
        update(EquipmentLoan)
        .where(
            EquipmentLoan.status == "active",
            EquipmentLoan.expected_return < date.today(),
        )
        .values(status="overdue", updated_at=func.now())
    )
    await db.execute(stmt)
    await db.commit()
```

Overdue loans trigger a notification to both the borrower and the Pengurus.

## API Endpoints

| Method | Path                              | Role(s)          | Description                       |
|--------|-----------------------------------|------------------|-----------------------------------|
| GET    | /equipment                        | Any authenticated| List equipment with stock info    |
| GET    | /equipment/{id}                   | Any authenticated| Equipment detail + stock          |
| POST   | /equipment                        | Admin, Pengurus  | Add new equipment                 |
| PUT    | /equipment/{id}                   | Admin, Pengurus  | Update equipment info             |
| POST   | /equipment/loans                  | Sahabat          | Request a loan                    |
| GET    | /equipment/loans                  | Pengurus, Admin  | List all loans (filterable)       |
| GET    | /equipment/loans/my               | Sahabat          | List own loans                    |
| PATCH  | /equipment/loans/{id}/approve     | Pengurus         | Approve loan request              |
| PATCH  | /equipment/loans/{id}/reject      | Pengurus         | Reject loan request               |
| PATCH  | /equipment/loans/{id}/activate    | Pengurus         | Mark as handed over (active)      |
| PATCH  | /equipment/loans/{id}/return      | Pengurus         | Record return                     |

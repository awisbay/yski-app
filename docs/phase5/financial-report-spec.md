# Laporan Keuangan (Financial Transparency) Specification

> Public financial reporting system to maintain transparency of foundation income and expenses.

## Database Schema

```sql
CREATE TABLE financial_reports (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title           VARCHAR(255) NOT NULL,
    period_start    DATE NOT NULL,
    period_end      DATE NOT NULL,

    total_income    DECIMAL(15, 2) NOT NULL DEFAULT 0,
    total_expense   DECIMAL(15, 2) NOT NULL DEFAULT 0,

    pdf_url         TEXT,
    is_audited      BOOLEAN NOT NULL DEFAULT FALSE,
    is_published    BOOLEAN NOT NULL DEFAULT FALSE,

    generated_by    UUID NOT NULL REFERENCES users(id),

    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_financial_reports_period ON financial_reports(period_start, period_end);

CREATE TABLE financial_entries (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id       UUID NOT NULL REFERENCES financial_reports(id) ON DELETE CASCADE,

    category        VARCHAR(50) NOT NULL,
    type            VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
    amount          DECIMAL(15, 2) NOT NULL,
    description     TEXT,

    -- Reference to source (donation, auction, etc.)
    reference_type  VARCHAR(50),
    reference_id    UUID,

    entry_date      DATE NOT NULL,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_financial_entries_report ON financial_entries(report_id);
CREATE INDEX idx_financial_entries_category ON financial_entries(category);
CREATE INDEX idx_financial_entries_type ON financial_entries(type);
CREATE INDEX idx_financial_entries_date ON financial_entries(entry_date);
```

## Entry Categories

### Income Categories

| Category           | Description                               |
|--------------------|-------------------------------------------|
| donasi_masuk       | Direct donations (Donasi/Infaq)           |
| zakat_masuk        | Zakat collections (Jemput Zakat)          |
| lelang_masuk       | Auction proceeds (Lelang Barang)          |
| lain_lain_masuk    | Other income (misc)                       |

### Expense Categories

| Category               | Description                           |
|------------------------|---------------------------------------|
| penyaluran_bantuan     | Aid distribution to beneficiaries     |
| operasional            | Operational costs (fuel, maintenance) |
| gaji_relawan           | Volunteer allowances                  |
| pemeliharaan_alkes     | Medical equipment maintenance         |
| lain_lain_keluar       | Other expenses (misc)                 |

## Report Generation

Admin/Pengurus triggers report generation for a specific period:

```python
# app/services/financial_service.py (pseudocode)

class FinancialService:

    async def generate_report(
        self, period_start: date, period_end: date, generated_by: UUID
    ) -> FinancialReport:
        # 1. Create the report record
        report = FinancialReport(
            title=f"Laporan Keuangan {period_start.strftime('%B %Y')}",
            period_start=period_start,
            period_end=period_end,
            generated_by=generated_by,
        )
        self.db.add(report)
        await self.db.flush()

        # 2. Aggregate income entries from donations
        paid_donations = await self._get_paid_donations(period_start, period_end)
        for donation in paid_donations:
            entry = FinancialEntry(
                report_id=report.id,
                category=self._map_donation_category(donation),
                type="income",
                amount=donation.amount,
                description=f"Donasi dari {donation.donor_name}",
                reference_type="donation",
                reference_id=donation.id,
                entry_date=donation.paid_at.date(),
            )
            self.db.add(entry)

        # 3. Aggregate income from auctions
        sold_auctions = await self._get_sold_auctions(period_start, period_end)
        for auction in sold_auctions:
            entry = FinancialEntry(
                report_id=report.id,
                category="lelang_masuk",
                type="income",
                amount=auction.current_price,
                description=f"Lelang: {auction.title}",
                reference_type="auction",
                reference_id=auction.id,
                entry_date=auction.end_time.date(),
            )
            self.db.add(entry)

        # 4. Manual expense entries (pre-created by admin)
        # These are already in financial_entries with the report_id

        # 5. Calculate totals
        report.total_income = sum of all income entries
        report.total_expense = sum of all expense entries

        await self.db.commit()
        return report
```

## PDF Generation

Generated using `reportlab` or `weasyprint`:

- **Header**: Foundation logo, report title, period
- **Summary**: Total income, total expense, net balance
- **Income breakdown**: Table of income entries grouped by category, with subtotals
- **Expense breakdown**: Table of expense entries grouped by category, with subtotals
- **Charts**: Pie chart for income breakdown by category, pie chart for expense breakdown by category
- **Footer**: Generated date, audited status, signature placeholder

PDF is stored in MinIO under `financial-reports/{report_id}.pdf` and the URL is saved to `pdf_url`.

## Dashboard Data

The financial transparency screen shows aggregated data for quick overview:

```python
async def get_dashboard_data(self) -> dict:
    return {
        "total_income": Decimal,        # All-time total income
        "total_expense": Decimal,       # All-time total expense
        "balance": Decimal,             # Income - expense
        "income_by_category": [         # For pie/bar chart
            {"category": "donasi_masuk", "amount": Decimal},
            {"category": "zakat_masuk", "amount": Decimal},
            ...
        ],
        "expense_by_category": [        # For pie/bar chart
            {"category": "penyaluran_bantuan", "amount": Decimal},
            {"category": "operasional", "amount": Decimal},
            ...
        ],
        "monthly_trend": [              # For line chart (last 12 months)
            {"month": "2026-01", "income": Decimal, "expense": Decimal},
            {"month": "2026-02", "income": Decimal, "expense": Decimal},
            ...
        ],
    }
```

## API Endpoints

| Method | Path                              | Role(s)          | Description                          |
|--------|-----------------------------------|------------------|--------------------------------------|
| GET    | /financial/reports                | Any authenticated| List published reports               |
| GET    | /financial/reports/{id}           | Any authenticated| Report detail with entries            |
| GET    | /financial/reports/{id}/pdf       | Any authenticated| Download report PDF                  |
| POST   | /financial/reports                | Pengurus, Admin  | Generate a new report                |
| PATCH  | /financial/reports/{id}/publish   | Admin            | Publish report (make visible)        |
| POST   | /financial/entries                | Pengurus, Admin  | Add manual entry (expense)           |
| GET    | /financial/dashboard              | Any authenticated| Aggregated dashboard data            |

## Public Transparency

- All published reports are accessible to any authenticated user (read-only).
- Dashboard data is public within the app.
- Reports can be marked as `is_audited` by admin after external audit.
- PDF reports can be shared externally via download link.

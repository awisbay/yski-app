# Phase 5: Advanced Features (Lelang, Laporan, Notifikasi) - Checklist

**Objective:** Implement the auction (Lelang Barang) system, financial transparency reports (Laporan Keuangan), and in-app + push notification system.

**Estimated Duration:** 3 weeks

---

## Auction System (Lelang Barang)

- [ ] Create `AuctionItem` model with Alembic migration
- [ ] Create `AuctionImage` model (multiple images per item) with migration
- [ ] Create `AuctionBid` model with migration
- [ ] Implement `AuctionService` (create item, upload images, place bid with validation)
- [ ] Implement auto-close logic for expired auctions (scheduled job)
- [ ] Create auction API endpoints (list, detail, create, bid, close)
- [ ] Build mobile auction list screen (active auctions, search/filter)
- [ ] Build mobile auction detail screen (image carousel, bid history, place bid)

## Financial Transparency (Laporan Keuangan)

- [ ] Create `FinancialReport` model with Alembic migration
- [ ] Create `FinancialEntry` model with migration
- [ ] Implement `FinancialService` (generate report, aggregate income/expense by category)
- [ ] Implement PDF generation for financial reports (reportlab or weasyprint)
- [ ] Create financial API endpoints (list reports, detail, download PDF)
- [ ] Build mobile financial transparency screen (report list, category breakdown charts)

## Notification System

- [ ] Create `Notification` model with Alembic migration
- [ ] Implement `NotificationService` (create, send push via Expo, mark read)
- [ ] Create notification API endpoints (list, mark read, mark all read, unread count)
- [ ] Build mobile notification list screen (grouped by date, swipe to mark read)
- [ ] Integrate Expo Push Notifications (token registration, push delivery)
- [ ] Store push tokens per user (register on login, clear on logout)

## Scheduled Jobs

- [ ] Setup scheduled job runner (APScheduler or Celery Beat)
- [ ] Auction expiry job: check `end_time`, mark as sold or expired
- [ ] Overdue loan check job: flag overdue equipment loans
- [ ] Donation expiry job: expire unpaid donations past deadline

## Testing

- [ ] Write unit tests for auction bidding logic (validation, concurrency)
- [ ] Write unit tests for financial aggregation (income/expense totals, category breakdown)
- [ ] Write integration tests for notification delivery
- [ ] Write integration tests for auction API endpoints
- [ ] Write integration tests for financial report API endpoints

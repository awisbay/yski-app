# Phase 5: Sprint Backlog

> Advanced Features (Lelang, Laporan, Notifikasi) -- organized into 3 sprints.

## Sprint 5A: Auction System (Lelang Barang)

| # | Item                                                                  | Estimate |
|---|-----------------------------------------------------------------------|----------|
| 1 | Create `AuctionItem`, `AuctionImage`, `AuctionBid` models + migrations| 3h       |
| 2 | Implement `AuctionService` (create item, upload images to MinIO)      | 4h       |
| 3 | Implement bid placement with validation + concurrency control          | 5h       |
| 4 | Create auction API endpoints (list, detail, create, bid, cancel)      | 4h       |
| 5 | Implement auto-close scheduled job for expired auctions               | 3h       |
| 6 | Build mobile auction list screen (active auctions, search/filter)     | 4h       |
| 7 | Build mobile auction detail screen (carousel, bid history, place bid) | 5h       |
| 8 | Write unit + integration tests for auction logic                      | 4h       |

**Sprint 5A Total: ~32h**

## Sprint 5B: Financial Reports (Laporan Keuangan)

| # | Item                                                                  | Estimate |
|---|-----------------------------------------------------------------------|----------|
| 1 | Create `FinancialReport`, `FinancialEntry` models + migrations        | 3h       |
| 2 | Implement `FinancialService` (generate report, aggregate entries)     | 5h       |
| 3 | Implement PDF generation with charts (reportlab/weasyprint)           | 5h       |
| 4 | Create financial API endpoints (list, detail, PDF download, dashboard)| 4h       |
| 5 | Build mobile financial transparency screen (reports + charts)         | 5h       |
| 6 | Write unit tests for financial aggregation logic                      | 3h       |

**Sprint 5B Total: ~25h**

## Sprint 5C: Notifications (Backend + Mobile + Push)

| # | Item                                                                  | Estimate |
|---|-----------------------------------------------------------------------|----------|
| 1 | Create `Notification`, `PushToken` models + migrations                | 2h       |
| 2 | Implement `NotificationService` (create, push via Expo, mark read)    | 4h       |
| 3 | Create notification API endpoints (list, mark read, unread count)     | 3h       |
| 4 | Integrate notification triggers into all existing services            | 4h       |
| 5 | Build mobile notification list screen (grouped, swipe actions)        | 4h       |
| 6 | Implement Expo push token registration + push delivery                | 3h       |
| 7 | Setup scheduled job runner + all scheduled jobs                       | 4h       |
| 8 | Write integration tests for notifications                             | 3h       |

**Sprint 5C Total: ~27h**

---

**Phase 5 Grand Total: ~84h**

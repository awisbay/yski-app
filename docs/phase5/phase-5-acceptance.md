# Phase 5: Acceptance Criteria / Exit Criteria

> All criteria must be met before moving to Phase 6.

## Auction System (Lelang Barang)

- [ ] Auction items can be created with multiple images (stored in MinIO)
- [ ] Bids validate correctly: must exceed current_price + min_increment
- [ ] Bidder cannot bid on own donated item
- [ ] Concurrent bids are handled safely (no double-winning)
- [ ] Auto-close job marks expired auctions as sold (with winner) or expired (no bids)
- [ ] Winner receives push notification with payment instructions
- [ ] Mobile auction list displays active auctions with thumbnails
- [ ] Mobile auction detail shows image carousel, current price, bid history, and bid input

## Financial Transparency (Laporan Keuangan)

- [ ] Reports can be generated for a specified period
- [ ] Income and expense entries are correctly aggregated by category
- [ ] Report totals match the sum of individual entries
- [ ] PDF report is generated with income/expense tables and pie charts
- [ ] PDF is downloadable via API endpoint
- [ ] Mobile financial transparency screen shows report list and dashboard charts
- [ ] Dashboard data includes total income, total expense, balance, and category breakdowns

## Notification System

- [ ] Notifications are triggered on all key events (booking, donation, pickup, loan, auction)
- [ ] Push notifications delivered via Expo Push Notification service
- [ ] Push token registered on login, cleared on logout
- [ ] In-app notification list shows notifications grouped by date
- [ ] Mark individual notification as read works
- [ ] Mark all notifications as read works
- [ ] Unread count badge displays correctly on notification tab

## Scheduled Jobs

- [ ] Auction expiry job runs on schedule and correctly closes auctions
- [ ] Overdue loan check job flags overdue loans and sends notifications
- [ ] Donation expiry job expires unpaid donations past deadline
- [ ] Jobs are resilient to failures (retry logic, error logging)

## Testing

- [ ] Unit tests for auction bidding logic pass (including edge cases)
- [ ] Unit tests for financial aggregation pass
- [ ] Integration tests for auction API endpoints pass
- [ ] Integration tests for financial report API endpoints pass
- [ ] Integration tests for notification API endpoints pass
- [ ] All existing Phase 2-4 tests still pass (no regressions)

## Mobile Screens

- [ ] Auction list screen matches design mockup
- [ ] Auction detail screen matches design mockup
- [ ] Financial transparency screen matches design mockup
- [ ] Notification list screen matches design mockup
- [ ] All new screens are accessible via navigation

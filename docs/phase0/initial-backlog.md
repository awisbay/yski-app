# Product Backlog

## Priority Legend

| Priority | Meaning                         | Target        |
|----------|---------------------------------|---------------|
| **P0**   | Must have - MVP blocker         | Phase 1-2     |
| **P1**   | Should have - core experience   | Phase 2-3     |
| **P2**   | Nice to have - enhances product | Phase 4-5     |

---

## 1. Auth & User Management (P0)

| ID     | Story                                                    | Priority | Phase |
|--------|----------------------------------------------------------|----------|-------|
| AUTH-1 | User can register with email and password                | P0       | 1     |
| AUTH-2 | User can login and receive JWT tokens                    | P0       | 1     |
| AUTH-3 | User can refresh expired access token                    | P0       | 1     |
| AUTH-4 | User can logout (token blacklist)                        | P0       | 1     |
| AUTH-5 | User can view and edit own profile                       | P0       | 2     |
| AUTH-6 | User can upload profile avatar                           | P1       | 2     |
| AUTH-7 | Admin can list, create, update, deactivate users         | P0       | 1     |
| AUTH-8 | RBAC enforced on all protected endpoints                 | P0       | 1     |
| AUTH-9 | Password reset via email                                 | P1       | 3     |
| AUTH-10| Phone number verification (OTP)                         | P2       | 4     |

## 2. Booking Pindahan (P0)

| ID      | Story                                                   | Priority | Phase |
|---------|---------------------------------------------------------|----------|-------|
| BOOK-1  | Sahabat can create a moving booking request              | P0       | 2     |
| BOOK-2  | Sahabat can view available dates/slots                   | P0       | 2     |
| BOOK-3  | Pengurus can view all pending booking requests           | P0       | 2     |
| BOOK-4  | Pengurus can approve or reject a booking                 | P0       | 2     |
| BOOK-5  | Pengurus can assign a Relawan to approved booking        | P0       | 2     |
| BOOK-6  | Relawan can view assigned bookings                       | P0       | 2     |
| BOOK-7  | Relawan can update booking status (in progress, done)    | P0       | 2     |
| BOOK-8  | Sahabat can view own booking history and status          | P0       | 2     |
| BOOK-9  | Slot availability cached in Redis                        | P1       | 2     |
| BOOK-10 | Booking cancellation by Sahabat (before approval)        | P1       | 3     |
| BOOK-11 | Multi-armada scheduling                                  | P2       | 4     |

## 3. Donasi & Infaq (P0)

| ID      | Story                                                   | Priority | Phase |
|---------|---------------------------------------------------------|----------|-------|
| DON-1   | Sahabat can create a donation (select category, amount)  | P0       | 2     |
| DON-2   | Sahabat can upload bukti transfer (proof of payment)     | P0       | 2     |
| DON-3   | Pengurus can view pending donations                      | P0       | 2     |
| DON-4   | Pengurus can verify/confirm donations                    | P0       | 2     |
| DON-5   | Sahabat can view own donation history                    | P0       | 2     |
| DON-6   | Donation categories: infaq, sedekah, wakaf, zakat mal    | P0       | 2     |
| DON-7   | Payment gateway integration (Midtrans/Xendit)            | P1       | 3     |
| DON-8   | Automatic payment verification via webhook               | P1       | 3     |
| DON-9   | Donation receipt generation (PDF)                        | P2       | 4     |

## 4. Jemput Zakat / Kencleng (P0)

| ID      | Story                                                   | Priority | Phase |
|---------|---------------------------------------------------------|----------|-------|
| ZAK-1   | Sahabat can request zakat pickup                         | P0       | 2     |
| ZAK-2   | Sahabat can request kencleng (charity box) pickup        | P0       | 2     |
| ZAK-3   | Pengurus can view all pickup requests                    | P0       | 2     |
| ZAK-4   | Pengurus can schedule and assign pickup to Relawan       | P0       | 2     |
| ZAK-5   | Relawan can view assigned pickups                        | P0       | 2     |
| ZAK-6   | Relawan can mark pickup complete with proof photo        | P0       | 2     |
| ZAK-7   | Sahabat can view pickup history                          | P0       | 2     |
| ZAK-8   | Geolocation for pickup address                           | P2       | 4     |

## 5. Inventaris Alkes (P1)

| ID      | Story                                                   | Priority | Phase |
|---------|---------------------------------------------------------|----------|-------|
| ALK-1   | List available medical equipment with details            | P1       | 3     |
| ALK-2   | Sahabat can request to borrow equipment                  | P1       | 3     |
| ALK-3   | Pengurus can approve/reject loan requests                | P1       | 3     |
| ALK-4   | Track loan status (borrowed, returned, overdue)          | P1       | 3     |
| ALK-5   | Pengurus can manage equipment inventory (CRUD)           | P1       | 3     |
| ALK-6   | Equipment condition tracking                             | P2       | 4     |

## 6. Berita & Program (P1)

| ID      | Story                                                   | Priority | Phase |
|---------|---------------------------------------------------------|----------|-------|
| NEWS-1  | List published news articles                             | P1       | 3     |
| NEWS-2  | List upcoming programs/events                            | P1       | 3     |
| NEWS-3  | Pengurus/Admin can create and publish content            | P1       | 3     |
| NEWS-4  | Content with images (stored in MinIO)                    | P1       | 3     |
| NEWS-5  | Content categorization and tagging                       | P2       | 4     |
| NEWS-6  | Content search                                           | P2       | 4     |

## 7. Lelang Barang - Charity Auction (P2)

| ID      | Story                                                   | Priority | Phase |
|---------|---------------------------------------------------------|----------|-------|
| AUC-1   | Admin/Pengurus can create auction listings               | P2       | 5     |
| AUC-2   | Sahabat can place bids                                   | P2       | 5     |
| AUC-3   | Real-time bid updates                                    | P2       | 5     |
| AUC-4   | Auction countdown timer                                  | P2       | 5     |
| AUC-5   | Winner notification and payment flow                     | P2       | 5     |

## 8. Laporan Keuangan - Financial Reports (P1)

| ID      | Story                                                   | Priority | Phase |
|---------|---------------------------------------------------------|----------|-------|
| FIN-1   | Monthly financial summary (income vs expenses)           | P1       | 3     |
| FIN-2   | Breakdown by category (zakat, infaq, sedekah, ops)       | P1       | 3     |
| FIN-3   | Public-facing transparency page (all roles)              | P1       | 3     |
| FIN-4   | Basic charts/visualization                               | P1       | 3     |
| FIN-5   | Export to PDF/Excel                                      | P2       | 5     |
| FIN-6   | Advanced analytics dashboard (Admin)                     | P2       | 5     |

## 9. WordPress Sync (P2)

| ID      | Story                                                   | Priority | Phase |
|---------|---------------------------------------------------------|----------|-------|
| WP-1    | WP plugin syncs news content from API                    | P2       | 3     |
| WP-2    | WP plugin syncs program/event content                    | P2       | 3     |
| WP-3    | WP plugin displays financial transparency               | P2       | 4     |
| WP-4    | WP Cron-based pull scheduling                            | P2       | 3     |

## 10. Push Notifications (P1)

| ID      | Story                                                   | Priority | Phase |
|---------|---------------------------------------------------------|----------|-------|
| NOTIF-1 | Booking status change notification                       | P1       | 3     |
| NOTIF-2 | Donation verification notification                       | P1       | 3     |
| NOTIF-3 | Pickup assignment notification (Relawan)                 | P1       | 3     |
| NOTIF-4 | New booking request notification (Pengurus)              | P1       | 3     |
| NOTIF-5 | Expo Push Notifications integration                      | P1       | 3     |

---

## Backlog Summary

| Feature Area            | P0 Items | P1 Items | P2 Items | Total |
|------------------------|----------|----------|----------|-------|
| Auth & User Management | 6        | 2        | 1        | 9     |
| Booking Pindahan       | 8        | 2        | 1        | 11    |
| Donasi & Infaq         | 6        | 2        | 1        | 9     |
| Jemput Zakat           | 7        | 0        | 1        | 8     |
| Inventaris Alkes       | 0        | 5        | 1        | 6     |
| Berita & Program       | 0        | 4        | 2        | 6     |
| Lelang Barang          | 0        | 0        | 5        | 5     |
| Laporan Keuangan       | 0        | 4        | 2        | 6     |
| WordPress Sync         | 0        | 0        | 4        | 4     |
| Push Notifications     | 0        | 5        | 0        | 5     |
| **Total**              | **27**   | **24**   | **18**   | **69**|

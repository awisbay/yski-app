# Phase 2: Sprint Backlog

> Backend Core Features -- organized into 4 sprints.

## Sprint 2A: Booking Engine (Armada Pindahan)

| # | Item                                                                  | Estimate |
|---|-----------------------------------------------------------------------|----------|
| 1 | Create `MovingBooking` model, Alembic migration, and seed data        | 3h       |
| 2 | Implement `BookingService` with 3-layer anti double-booking           | 5h       |
| 3 | Create booking CRUD API endpoints (create, list, detail, cancel)      | 4h       |
| 4 | Create booking workflow endpoints (approve, reject, assign, status)   | 4h       |
| 5 | Create slot availability + calendar endpoints, write integration tests| 4h       |

**Sprint 2A Total: ~20h**

## Sprint 2B: Equipment & Loans (Alkes)

| # | Item                                                                  | Estimate |
|---|-----------------------------------------------------------------------|----------|
| 1 | Create `MedicalEquipment` + `EquipmentLoan` models, migrations, seed | 3h       |
| 2 | Create `equipment_stock` VIEW migration                               | 2h       |
| 3 | Implement `EquipmentService` (loan request, approve, return, overdue) | 5h       |
| 4 | Create equipment + loan API endpoints, write integration tests        | 5h       |

**Sprint 2B Total: ~15h**

## Sprint 2C: Donations & Payment

| # | Item                                                                  | Estimate |
|---|-----------------------------------------------------------------------|----------|
| 1 | Create `Donation` model, Alembic migration, and seed data             | 3h       |
| 2 | Implement `PaymentProvider` abstract interface + stub provider        | 3h       |
| 3 | Implement `DonationService` (create, status update, expiry)           | 4h       |
| 4 | Create donation API endpoints + webhook handler                       | 4h       |
| 5 | Add donation history + summary endpoints, write integration tests     | 3h       |

**Sprint 2C Total: ~17h**

## Sprint 2D: Pickup & Content

| # | Item                                                                  | Estimate |
|---|-----------------------------------------------------------------------|----------|
| 1 | Create `PickupRequest` model, migration, and seed data                | 3h       |
| 2 | Implement `PickupService` (request, schedule, assign, complete)       | 5h       |
| 3 | Create pickup API endpoints + proof photo upload, integration tests   | 4h       |
| 4 | Create `Program` + `NewsArticle` models, CRUD endpoints, tests       | 5h       |

**Sprint 2D Total: ~17h**

---

**Phase 2 Grand Total: ~69h**

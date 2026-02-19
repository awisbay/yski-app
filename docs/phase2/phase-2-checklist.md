# Phase 2: Backend Core Features - Checklist

> Yayasan Sahabat Khairat (Yayasan Sahabat Khairat Indonesia)
> Stack: FastAPI, PostgreSQL, Redis, MinIO

## Booking Engine (Armada Pindahan)

- [x] Create `MovingBooking` model + Alembic migration
- [x] Implement `BookingService` with anti double-booking (3-layer: UNIQUE constraint, SELECT FOR UPDATE, business validation)
- [x] Create booking API endpoints (CRUD, slots, approve/reject/assign/status/review)

## Medical Equipment Inventory (Alkes)

- [x] Create `MedicalEquipment` + `EquipmentLoan` models
- [x] Create `equipment_stock` VIEW (implemented in service layer)
- [x] Implement `EquipmentService` (loan request, approve, return, stock tracking)
- [x] Create equipment API endpoints

## Donations & Payment

- [x] Create `Donation` model
- [x] Implement `DonationService` with payment gateway abstraction (`PaymentProvider` interface)
- [x] Create donation API endpoints + webhook handler

## Pickup (Jemput Zakat & Kencleng)

- [x] Create `PickupRequest` model
- [x] Implement `PickupService` (request, schedule, assign, complete with proof)
- [x] Create pickup API endpoints

## Programs & News

- [x] Create `Program` + `NewsArticle` models
- [x] Create programs & news API endpoints

## Quality & DevEx

- [ ] Write integration tests for each feature
- [ ] Seed sample data for development

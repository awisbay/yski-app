# Phase 2: Backend Core Features - Checklist

> Yayasan Sahabat Khairat (Clicky Foundation)
> Stack: FastAPI, PostgreSQL, Redis, MinIO

## Booking Engine (Armada Pindahan)

- [x] Create `MovingBooking` model + Alembic migration
- [x] Implement `BookingService` with anti double-booking (3-layer: UNIQUE constraint, SELECT FOR UPDATE, business validation)
- [x] Create booking API endpoints (CRUD, slots, approve/reject/assign/status/review)

## Medical Equipment Inventory (Alkes)

- [x] Create `MedicalEquipment` + `EquipmentLoan` models
- [ ] Create `equipment_stock` VIEW
- [ ] Implement `EquipmentService` (loan request, approve, return, stock tracking)
- [ ] Create equipment API endpoints

## Donations & Payment

- [x] Create `Donation` model
- [ ] Implement `DonationService` with payment gateway abstraction (`PaymentProvider` interface)
- [ ] Create donation API endpoints + webhook handler

## Pickup (Jemput Zakat & Kencleng)

- [x] Create `PickupRequest` model
- [ ] Implement `PickupService` (request, schedule, assign, complete with proof)
- [ ] Create pickup API endpoints

## Programs & News

- [x] Create `Program` + `NewsArticle` models
- [ ] Create programs & news API endpoints

## Quality & DevEx

- [ ] Write integration tests for each feature
- [ ] Seed sample data for development

# Phase 2: Backend Core Features - Checklist

> Yayasan Sahabat Khairat (Clicky Foundation)
> Stack: FastAPI, PostgreSQL, Redis, MinIO

## Booking Engine (Armada Pindahan)

- [ ] Create `MovingBooking` model + Alembic migration
- [ ] Implement `BookingService` with anti double-booking (3-layer: UNIQUE constraint, SELECT FOR UPDATE, business validation)
- [ ] Create booking API endpoints (CRUD, slots, approve/reject/assign/status/review)

## Medical Equipment Inventory (Alkes)

- [ ] Create `MedicalEquipment` + `EquipmentLoan` models + Alembic migrations
- [ ] Create `equipment_stock` VIEW
- [ ] Implement `EquipmentService` (loan request, approve, return, stock tracking)
- [ ] Create equipment API endpoints

## Donations & Payment

- [ ] Create `Donation` model + Alembic migration
- [ ] Implement `DonationService` with payment gateway abstraction (`PaymentProvider` interface)
- [ ] Create donation API endpoints + webhook handler

## Pickup (Jemput Zakat & Kencleng)

- [ ] Create `PickupRequest` model + Alembic migration
- [ ] Implement `PickupService` (request, schedule, assign, complete with proof)
- [ ] Create pickup API endpoints

## Programs & News

- [ ] Create `Program` + `NewsArticle` models + Alembic migrations
- [ ] Create programs & news API endpoints

## Quality & DevEx

- [ ] Write integration tests for each feature
- [ ] Seed sample data for development

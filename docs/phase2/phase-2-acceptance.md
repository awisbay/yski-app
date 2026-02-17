# Phase 2: Acceptance Criteria / Exit Checklist

> All items must be checked before Phase 2 is considered complete.

## Booking Engine

- [ ] Can create a booking for a future date and valid time slot
- [ ] Anti double-booking works: concurrent requests for the same slot result in only one success
- [ ] Slot availability endpoint returns correct available/booked status
- [ ] Calendar endpoint correctly flags fully-booked dates
- [ ] Full status flow works: pending -> approved -> in_progress -> completed
- [ ] Reject and cancel flows free up the slot
- [ ] Sahabat can submit a rating and review after completion

## Medical Equipment Inventory

- [ ] Equipment CRUD works (create, read, update, list with filters)
- [ ] Loan request -> approve -> activate -> return flow works end to end
- [ ] Loan rejection flow works
- [ ] `equipment_stock` VIEW accurately reflects available quantity
- [ ] Overdue detection job correctly marks overdue loans

## Donations & Payment

- [ ] Create donation returns a payment URL (stub in dev, real in staging)
- [ ] Webhook handler correctly updates donation status to paid
- [ ] Expired donations are automatically marked after 24 hours
- [ ] Anonymous donations work (no donor_id required)
- [ ] Donation history endpoint returns correct results for authenticated user
- [ ] Donation summary/stats endpoint returns aggregated data

## Pickup (Jemput Zakat & Kencleng)

- [ ] Pickup request submission works with GPS coordinates
- [ ] Schedule + assign flow works (Pengurus sets date, slot, relawan)
- [ ] Status update flow works: pending -> scheduled -> in_progress -> completed
- [ ] Photo proof upload works (stored in MinIO, URL saved)
- [ ] Collected amount is recorded on completion
- [ ] Cancel flow works

## Programs & News

- [ ] Program CRUD works (create, read, update, delete, list)
- [ ] News article CRUD works (create, read, update, delete, list)
- [ ] Listing endpoints support pagination (limit/offset or cursor)

## Cross-Cutting

- [ ] All integration tests pass
- [ ] API docs (Swagger/OpenAPI) are complete and accurate for all new endpoints
- [ ] All endpoints enforce proper role-based access (Admin, Pengurus, Relawan, Sahabat)
- [ ] Error responses follow a consistent format across all endpoints

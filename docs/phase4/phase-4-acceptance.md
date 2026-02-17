# Phase 4: Acceptance Criteria & Exit Checklist

## Overview

Phase 4 is complete when all 8 mockup screens are implemented in the mobile app with full API integration, form validation, and proper loading/error/empty states. All items below must be verified before moving to Phase 5.

---

## Exit Criteria Checklist

### Screen 1: Home / Beranda
- [ ] Impact dashboard shows donation total and social action count
  - Data fetched from API and displayed correctly
  - Loading skeleton shown during fetch
  - Pull-to-refresh refetches all data
- [ ] Quick action buttons navigate to correct screens
  - Pindah Gratis -> `/booking/pindahan`
  - Alat Medis -> `/alkes`
  - Zakat & Donasi -> `/donasi/nominal`
  - Laporan Darurat -> opens modal/external
- [ ] Program carousel displays latest programs
  - Horizontal scroll with snap behavior
  - Program cards show image, title, description, participant count
  - "Lihat Semua" navigates to program list
- [ ] "Jadi Relawan?" CTA banner is functional
- [ ] Notification bell shows unread count badge

### Screen 2: Booking Pindahan
- [ ] Calendar picker shows current month with availability
  - Past dates disabled
  - Fully booked dates indicated
  - Selected date highlighted
- [ ] Time slot picker shows 4 slots with availability
  - Booked slots disabled
  - Selected slot highlighted
- [ ] Address fields work with map picker
  - "Pilih dari Peta" opens map modal
  - Reverse geocoding fills address text
  - Both pickup and destination required
- [ ] Form submission works
  - `POST /bookings` called with correct payload
  - Success: navigates to booking detail
  - Error: shows inline validation errors
  - Double-booking returns 409 Conflict handled gracefully

### Screen 3: Donasi Step 1 - Pilih Nominal
- [ ] Preset amounts selectable (Rp 50.000, 100.000, 500.000)
  - Visual selection state on chosen amount
  - Only one amount selected at a time
- [ ] Custom amount input works
  - Thousand separator formatting
  - Minimum Rp 10.000 validated
  - Info text displayed
- [ ] "Lanjut ke Pembayaran" navigates to Step 2
  - Disabled when no amount selected
  - Amount passed to next screen via store

### Screen 4: Donasi Step 2 - Metode Pembayaran
- [ ] Total amount displayed correctly from previous step
- [ ] Payment methods grouped and selectable
  - QRIS, GoPay, OVO, ShopeePay, BCA, Mandiri
  - Radio selection (single choice)
- [ ] Form submission works
  - `POST /donations` called with amount + method
  - Success: navigates to Step 3 with donationId
  - Error: shows error toast
  - Loading spinner during submission
- [ ] Back navigation preserves form state

### Screen 5: Donasi Step 3 - Sukses
- [ ] Success animation and message displayed
- [ ] Transaction summary shows correct data
  - ID Donasi, Tanggal, Metode, Total
  - Data fetched from `GET /donations/{id}`
- [ ] "Bagikan ke WhatsApp" opens WhatsApp with message
- [ ] "Kembali ke Beranda" resets store and navigates home

### Screen 6: Form Penjemputan Donasi
- [ ] Donation type toggle works (Zakat / Kencleng-Infaq)
- [ ] Donor info pre-filled from user profile
- [ ] Location picker works with map
  - Auto-detect current location
  - Manual selection via map
  - Address text displayed
- [ ] Schedule fields work (date picker + time slots)
- [ ] Form submission works
  - `POST /pickups` called with correct payload
  - Success: shows confirmation
  - Error: shows inline validation errors

### Screen 7: Inventory Alat Medis
- [ ] Dashboard stats show correct counts
  - Total, Dipinjam, Permintaan, Tersedia
- [ ] Equipment cards display with photos and availability
  - Tap navigates to equipment detail
- [ ] Active loans table shows correct data (Pengurus/Admin)
- [ ] "Permintaan Baru" banner shows pending count
- [ ] Role-based view works
  - Sahabat: catalog view only
  - Pengurus/Admin: full dashboard with loans table

### Screen 8: Berita & Dampak
- [ ] Category filter tabs work
  - Semua, Kesehatan, Bencana, Pendidikan
  - Filter changes API query
- [ ] News cards display with images, titles, descriptions
- [ ] News detail screen renders full article
- [ ] Pagination works (infinite scroll or load more)
- [ ] Empty state shown for categories with no articles

### Cross-Screen Requirements
- [ ] All forms validate with Zod schemas
- [ ] TanStack Query hooks work for all API calls
- [ ] Zustand stores manage form state correctly
- [ ] Loading skeletons displayed during data fetch
- [ ] Error states with retry buttons on API failure
- [ ] Empty states with helpful messages
- [ ] Pull-to-refresh on all list screens
- [ ] All screens render on iOS and Android without errors

---

## Verification Steps

### Manual Verification Sequence

1. **Login as Sahabat:** Open app, login with sahabat credentials
2. **Home screen:** Verify impact stats, quick actions, program carousel, CTA banner
3. **Booking flow:** Tap "Pindah Gratis", select date, time, addresses, submit
4. **Donation flow:** Tap "Zakat & Donasi", select Rp 100.000, select QRIS, submit, verify success screen
5. **WhatsApp share:** Tap "Bagikan ke WhatsApp" on success screen
6. **Pickup form:** Navigate to pickup, fill form, submit
7. **Equipment:** Navigate to Alat Medis, browse catalog
8. **News:** Navigate to Berita, filter by category, read article
9. **Login as Pengurus:** Logout, login as pengurus
10. **Admin equipment view:** Verify dashboard stats, loans table, "Permintaan Baru"
11. **Error handling:** Disable network, verify error states and retry buttons
12. **Android test:** Repeat key flows on Android emulator

### Automated Test Commands

```bash
# Run mobile component tests
cd mobile && npx jest --watchAll=false

# Run specific screen tests
npx jest --testPathPattern="__tests__/screens/Home"
npx jest --testPathPattern="__tests__/screens/Booking"
npx jest --testPathPattern="__tests__/screens/Donation"

# Run with coverage
npx jest --coverage --watchAll=false
```

---

## Definition of Done

- All 8 screens implemented and matching mockup designs
- All API integrations working against backend
- Form validation working with Zod schemas
- Loading, error, and empty states implemented
- Role-based UI working (sahabat vs pengurus/admin)
- No TypeScript errors or console warnings
- Tested on both iOS simulator and Android emulator
- Pull-to-refresh working on all list screens
- Accessibility labels on all interactive elements
- Code reviewed and merged to develop branch

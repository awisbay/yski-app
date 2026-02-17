# Phase 4: Sprint Backlog

> Mobile Feature Screens -- organized into 4 sprints.

## Sprint 4A: Home Screen + Shared Components

| # | Item                                                                  | Estimate |
|---|-----------------------------------------------------------------------|----------|
| 1 | Build shared components: ScreenWrapper, SectionHeader, StatCard, FilterTabBar | 4h |
| 2 | Build ImpactDashboard + QuickAccessMenu components                    | 3h       |
| 3 | Build ProgramCarousel + ProgramCard components                        | 3h       |
| 4 | Build VolunteerCTABanner, integrate pull-to-refresh                   | 2h       |
| 5 | Create TanStack Query hooks: useImpactStats, usePrograms              | 2h       |
| 6 | Integration test: Home screen renders with API data                   | 2h       |

**Sprint 4A Total: ~16h**

### User Stories

**US-4A-1: As a sahabat, I want to see the impact dashboard on the home screen so that I know the foundation's achievements.**

Acceptance Criteria:
- [ ] "Total Dampak" section shows Donasi total and Aksi Sosial count
- [ ] Data fetched from API on screen load
- [ ] Loading skeleton shown while fetching
- [ ] Pull-to-refresh refetches data
- [ ] Error state with retry button on API failure

**US-4A-2: As a sahabat, I want quick action buttons so that I can access key features with one tap.**

Acceptance Criteria:
- [ ] 4 buttons displayed in a grid: Pindah Gratis, Alat Medis, Zakat & Donasi, Laporan Darurat
- [ ] Each button navigates to the correct screen
- [ ] Icons match the mockup design

**US-4A-3: As a sahabat, I want to see the latest programs in a carousel so that I can discover ways to contribute.**

Acceptance Criteria:
- [ ] Horizontal scrollable list of program cards
- [ ] Each card shows image, title, description, participant count
- [ ] "Ikut Serta" button on each card
- [ ] "Lihat Semua" link navigates to full program list

---

## Sprint 4B: Booking + Donation Flow

| # | Item                                                                  | Estimate |
|---|-----------------------------------------------------------------------|----------|
| 1 | Build CalendarPicker + TimeSlotPicker components                      | 4h       |
| 2 | Build LocationMapPicker + AddressField components                     | 4h       |
| 3 | Build StatusStepper + booking form integration                        | 3h       |
| 4 | Build AmountSelector + donation step 1 screen                         | 3h       |
| 5 | Build PaymentMethodCard + donation step 2 screen                      | 3h       |
| 6 | Build donation success screen (step 3) + WhatsApp share               | 2h       |
| 7 | Create mutations: useCreateBooking, useCreateDonation                 | 2h       |
| 8 | Integration tests: booking + donation flows end-to-end                | 3h       |

**Sprint 4B Total: ~24h**

### User Stories

**US-4B-1: As a sahabat, I want to book a free moving service by selecting a date, time, and location so that I can schedule a pickup.**

Acceptance Criteria:
- [ ] Calendar shows current month with available/unavailable dates
- [ ] Time slot picker shows 4 slots with availability status
- [ ] Map picker allows selecting pickup and destination addresses
- [ ] Form validates all required fields before submission
- [ ] Successful booking shows confirmation and navigates to detail
- [ ] Double-booking prevented (slot becomes unavailable after booking)

**US-4B-2: As a sahabat, I want to donate by choosing an amount and payment method in a 3-step flow so that the process is clear and simple.**

Acceptance Criteria:
- [ ] Step 1: Can select preset amount or enter custom amount (min Rp 10.000)
- [ ] Step 2: Can select from QRIS, e-wallets, or bank transfer
- [ ] Step 3: Shows success animation and transaction summary
- [ ] "Bagikan ke WhatsApp" opens WhatsApp with donation message
- [ ] "Kembali ke Beranda" resets form and navigates home
- [ ] Back navigation between steps preserves form state

---

## Sprint 4C: Pickup Form + Equipment Inventory

| # | Item                                                                  | Estimate |
|---|-----------------------------------------------------------------------|----------|
| 1 | Build pickup form (type toggle, donor info, location, schedule)       | 4h       |
| 2 | Build equipment dashboard stats row                                   | 2h       |
| 3 | Build equipment cards list with availability badges                   | 3h       |
| 4 | Build active loans table (Pengurus/Admin view)                        | 3h       |
| 5 | Build "Permintaan Baru" action banner                                 | 1h       |
| 6 | Role-based UI switching (sahabat vs pengurus/admin)                   | 2h       |
| 7 | Create mutations: useCreatePickup, query hooks for equipment          | 2h       |
| 8 | Integration tests: pickup + equipment flows                           | 3h       |

**Sprint 4C Total: ~20h**

### User Stories

**US-4C-1: As a sahabat, I want to request a zakat/donation pickup by filling out a form with my info and location so that a volunteer can come to collect it.**

Acceptance Criteria:
- [ ] Can toggle between Zakat and Kencleng/Infaq types
- [ ] Name and phone pre-filled from user profile
- [ ] Map shows current location with option to change
- [ ] Date and time slot are optional
- [ ] Successful submission shows confirmation
- [ ] Validation errors display inline

**US-4C-2: As a pengurus, I want to see the equipment inventory dashboard so that I can manage medical equipment loans.**

Acceptance Criteria:
- [ ] Stats cards show Total, Dipinjam, Permintaan, Tersedia counts
- [ ] Equipment cards show photos with availability badges
- [ ] Active loans table shows borrower, item, and return date
- [ ] "Permintaan Baru" banner shows pending request count
- [ ] "Setujui Permintaan" navigates to request approval screen

---

## Sprint 4D: News & Polish

| # | Item                                                                  | Estimate |
|---|-----------------------------------------------------------------------|----------|
| 1 | Build news list with category filter tabs                             | 3h       |
| 2 | Build news detail screen (article view + share)                       | 2h       |
| 3 | Implement infinite scroll pagination on news list                     | 2h       |
| 4 | Add accessibility labels to all interactive elements                  | 2h       |
| 5 | Polish loading states, error states, empty states across all screens  | 3h       |
| 6 | Cross-device testing (iOS + Android, various screen sizes)            | 3h       |
| 7 | Fix bugs and UI polish from testing                                   | 3h       |

**Sprint 4D Total: ~18h**

### User Stories

**US-4D-1: As a sahabat, I want to browse news and impact stories by category so that I can stay informed about the foundation's activities.**

Acceptance Criteria:
- [ ] Tab filters: Semua, Kesehatan, Bencana, Pendidikan
- [ ] News cards show cover image, title, description snippet
- [ ] "Baca Selengkapnya" opens full article
- [ ] Infinite scroll loads more articles
- [ ] Empty state shown when no articles in category
- [ ] Pull-to-refresh refetches data

**US-4D-2: As a user, I want all screens to be accessible and polished so that the app feels professional.**

Acceptance Criteria:
- [ ] All buttons have accessibilityLabel
- [ ] Touch targets are minimum 44px
- [ ] Loading skeletons shown during data fetch
- [ ] Error states have retry buttons
- [ ] Empty states have helpful messages
- [ ] No console warnings in development mode

---

**Phase 4 Grand Total: ~78h**

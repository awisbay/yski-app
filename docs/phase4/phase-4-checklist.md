# Phase 4: Mobile Feature Screens - Checklist

**Objective:** Mengimplementasi semua 8 screen mockup ke dalam aplikasi mobile React Native + Expo, lengkap dengan API integration, state management, dan form validation.

**Stack:** React Native + Expo SDK 52, NativeWind v4, Expo Router, Zustand, React Hook Form + Zod, Axios + TanStack Query

**Estimated Duration:** 3 minggu

**Prerequisite:** Phase 3 (Mobile App Foundation) selesai -- design system, navigation, auth flow, API client sudah siap.

---

## Screen 1: Home / Beranda

- [x] Implement `ImpactDashboard` component (Total Dampak section) - UI ONLY
  - [x] Display "Donasi Rp500jt+" stat card with donation icon
  - [x] Display "Aksi Sosial 1.2k+" stat card with handshake icon
  - [ ] Fetch impact stats from `GET /donations/summary` and `GET /bookings/stats`
  - [ ] Animate counter numbers on load (optional: `react-native-reanimated`)
- [x] Implement `QuickAccessMenu` component (4 quick action buttons) - UI ONLY
  - [x] "Pindah Gratis" button -> navigates to `/booking/pindahan`
  - [x] "Alat Medis" button -> navigates to `/alkes`
  - [x] "Zakat & Donasi" button -> navigates to `/donasi/nominal`
  - [ ] "Laporan Darurat" button -> navigates to emergency modal
- [x] Implement "Program Sosial Terbaru" horizontal carousel - UI ONLY
  - [ ] Fetch programs from `GET /programs?limit=5&sort=created_at:desc`
  - [x] Build `ProgramCard` component with image, title, description, progress bar
  - [ ] Implement horizontal `FlatList` with snap behavior
  - [ ] "Lihat Semua" link -> navigate to full programs list
- [x] Implement "Jadi Relawan?" CTA banner - UI ONLY
  - [x] CTA card with handshake icon and "Daftar Sekarang" button
  - [ ] Navigate to volunteer registration or info screen on tap
- [ ] Integrate pull-to-refresh on home screen
- [ ] Implement loading skeleton placeholders
- [ ] Implement error state with retry button

## Screen 2: Booking Pindahan

- [x] Implement `StatusStepper` component - UI ONLY
  - [ ] 3-step visual stepper: Menunggu -> Disetujui -> Proses
  - [ ] Active/completed/pending state styling per step
  - [ ] Step label: "Langkah 1/3"
- [x] Implement `CalendarPicker` component - UI ONLY
  - [ ] Calendar grid showing current month with navigation arrows
  - [ ] Disable past dates and fully-booked dates
  - [ ] Fetch availability from `GET /bookings/slots?date=YYYY-MM-DD`
  - [x] Highlight selected date with primary color
- [x] Implement `TimeSlotPicker` component - UI ONLY
  - [x] Display 4 time slots: 08:00, 10:00, 13:00, 15:00
  - [ ] Disable booked slots, highlight selected slot
  - [x] Pill/chip style for each slot
- [x] Implement address fields - UI ONLY
  - [x] "Alamat Penjemputan" text input
  - [x] "Alamat Tujuan" text input
  - [ ] "Pilih dari Peta" button -> opens `LocationMapPicker`
- [ ] Implement `LocationMapPicker` component
  - [ ] MapView with draggable marker (`react-native-maps`)
  - [ ] Reverse geocoding to fill address (`expo-location`)
  - [ ] "Gunakan Lokasi Ini" confirmation button
  - [ ] Location permission handling
- [ ] Implement form validation (React Hook Form + Zod)
  - [ ] Required: date, time slot, both addresses, coordinates
  - [ ] Submit to `POST /bookings`
  - [ ] Handle success -> navigate to booking detail
  - [ ] Handle error -> show inline errors or toast
- [x] Implement "Konfirmasi Pemesanan" submit button - UI ONLY
- [ ] Display terms & conditions note at bottom

## Screen 3: Donasi Step 1 - Pilih Nominal

- [x] Implement step indicator (Langkah 1 dari 3) with progress bar - UI ONLY
- [x] Implement donation type header ("Pilih Nominal Infaq")
- [x] Implement `AmountSelector` component - UI ONLY
  - [x] 3 preset amounts with labels:
    - [x] Rp 50.000 - "Nominal Minimal"
    - [x] Rp 100.000 - "Sering Dipilih"
    - [x] Rp 500.000 - "Sangat Berarti"
  - [x] Visual selection state (primary border + background)
  - [x] Custom amount input field with "Rp" prefix
  - [x] Format input with thousand separators (e.g., 1.000.000)
  - [ ] Minimum validation: Rp 10.000
  - [x] Info text: "Minimal donasi via aplikasi adalah Rp 10.000"
- [ ] Store selected amount in `donationStore`
- [x] Implement "Lanjut ke Pembayaran" button - UI ONLY
  - [x] Disabled state when no amount selected
  - [x] Navigate to `/donasi/pembayaran`

## Screen 4: Donasi Step 2 - Metode Pembayaran

- [x] Implement step indicator (Langkah 2 dari 3) - UI ONLY
- [x] Display "Total Infaq Anda" summary card - UI ONLY
- [x] Implement `PaymentMethodCard` component - UI ONLY
  - [x] Radio-style selection with circle indicator
  - [x] Icon + payment method name + description
- [x] Implement payment method groups - UI ONLY
  - [x] "Paling Populer": QRIS (Gopay, OVO, LinkAja, Dana, & Mobile Banking)
  - [x] "E-Wallet": GoPay, OVO, ShopeePay (with branded icons)
  - [x] "Transfer Bank (Virtual Account)": Bank BCA, Bank Mandiri (with "Verifikasi otomatis" label)
- [ ] Store selected payment method in `donationStore`
- [x] Implement "Lanjut ke Pembayaran" button - UI ONLY
  - [x] Disabled when no method selected
  - [ ] Submit donation to `POST /donations`
  - [ ] Loading spinner during submission
  - [x] On success: navigate to `/donasi/sukses`
  - [ ] On error: show error toast
- [x] Display security note: "Pembayaran Anda diproses secara aman oleh Clicky Foundation."
- [ ] Back navigation preserves form state

## Screen 5: Donasi Step 3 - Sukses

- [x] Implement success animation - UI ONLY
  - [x] Large green checkmark icon
  - [x] "Terima Kasih!" heading
  - [x] Gratitude message text
- [x] Implement "Ringkasan Transaksi" card - UI ONLY
  - [ ] ID Donasi (e.g., #CKY-12345678)
  - [ ] Tanggal (formatted: "24 Mei 2024, 14:20")
  - [ ] Metode (e.g., "Transfer Bank / E-Wallet")
  - [ ] Total Donasi (e.g., "Rp 150.000")
- [ ] Fetch donation detail from `GET /donations/{donationId}`
- [x] Implement "Bagikan ke WhatsApp" button (green) - UI ONLY
  - [ ] Open WhatsApp with pre-filled share message via `Linking.openURL`
- [x] Implement "Kembali ke Beranda" button (primary)
  - [x] Navigate to `/(tabs)`
  - [ ] Reset `donationStore` on screen unmount
- [x] "Butuh bantuan dengan donasi Anda?" help link

## Screen 6: Form Penjemputan Donasi

- [x] Implement donation type toggle - UI ONLY
  - [x] Segment control: Zakat | Kencleng/Infaq
  - [x] Pill style with active state
- [x] Implement "Informasi Donatur" section - UI ONLY
  - [x] "Nama Lengkap" input with person icon
  - [x] "Nomor Telepon (WhatsApp)" input with phone icon, tel keyboard
  - [ ] Pre-fill from `authStore.user` if logged in
- [x] Implement "Lokasi Penjemputan" section - UI ONLY
  - [ ] MapView preview showing selected location
  - [x] Address text below map
  - [ ] "Pilih dari Peta" button -> opens LocationMapPicker
  - [ ] Auto-detect current location on mount
- [x] Implement "Jadwal Penjemputan" section (Optional) - UI ONLY
  - [x] "Pilih Tanggal" date picker with calendar icon
  - [x] "Slot Waktu" time slot chips: 09:00-12:00, 13:00-15:00, 16:00-18:00
- [x] Implement info banner: "Layanan penjemputan resmi dari Clicky Foundation. Aman dan Terpercaya."
- [ ] Implement form validation (React Hook Form + Zod)
  - [ ] Required: donation_type, name, phone, address, coordinates
  - [ ] Phone: min 10 digits, Indonesian format
  - [ ] Optional: date, time slot
- [x] Implement "Ajukan Penjemputan" submit button - UI ONLY
  - [ ] Submit to `POST /pickups`
  - [ ] Success: show success modal, navigate to riwayat
  - [ ] Error: show inline validation errors
- [ ] Display terms note at bottom

## Screen 7: Inventory Alat Medis

- [x] Implement dashboard stats row (4 cards) - UI ONLY
  - [x] "Total Alat" card with count
  - [x] "Dipinjam" card with count
  - [x] "Permintaan" card with count
  - [x] "Tersedia" card with count
  - [ ] Fetch from `GET /equipment` with aggregation
- [x] Implement "Ketersediaan Alat" section with "Lihat Semua" link - UI ONLY
- [x] Implement equipment cards list - UI ONLY
  - [ ] Card with equipment photo, name
  - [x] Availability badges: "Tersedia: X" (green), "Dipinjam: Y" (blue)
  - [x] Equipment types: Kursi Roda, Tabung Oksigen, Tempat Tidur Pasien
  - [ ] Tap card -> navigate to `/alkes/[id]` for detail + loan request
- [x] Implement "Peminjaman Aktif" table (Pengurus/Admin view) - UI ONLY
  - [x] Columns: Peminjam, Item, Tgl. Kembali
  - [x] Show borrower avatar, name, equipment name, return date
  - [ ] Fetch from `GET /equipment/loans?status=active`
- [x] Implement "Permintaan Baru" action banner - UI ONLY
  - [x] "Ada 3 Permintaan Baru" notification banner
  - [x] "Setujui Permintaan" button
  - [x] "Segera verifikasi permintaan peminjaman yang masuk"
- [ ] Role-based UI: Sahabat sees catalog only, Pengurus/Admin sees full dashboard
- [ ] Implement pull-to-refresh and loading skeletons

## Screen 8: Berita & Dampak

- [x] Implement tab filter bar - UI ONLY
  - [x] Filter tabs: Semua, Kesehatan, Bencana, Pendidikan
  - [x] Horizontal scrollable with active indicator
  - [ ] Filter maps to `GET /news?category={category}`
- [x] Implement news card list - UI ONLY
  - [ ] Card with cover image (aspect-video ratio)
  - [x] Title, description snippet (2-3 lines)
  - [x] "Baca Selengkapnya" button
  - [ ] Fetch from `GET /news?page=1&limit=10`
- [ ] Implement news detail screen (`/berita/[id]`)
  - [ ] Full article view with header image
  - [ ] Article body content
  - [ ] Share button
  - [ ] Fetch from `GET /news/{id}`
- [ ] Implement pagination (infinite scroll or load more)
- [ ] Implement pull-to-refresh
- [ ] Implement loading skeleton for news cards
- [ ] Implement empty state per category

---

## Cross-Screen Tasks

### TanStack Query Integration
- [ ] Create query hooks for each API:
  - [ ] `useImpactStats()` -- home dashboard stats
  - [ ] `usePrograms()` -- program carousel
  - [ ] `useBookingSlots(date)` -- available booking slots
  - [ ] `useCreateBooking()` -- mutation for creating booking
  - [ ] `useCreateDonation()` -- mutation for creating donation
  - [ ] `useDonationDetail(id)` -- donation detail
  - [ ] `useCreatePickup()` -- mutation for creating pickup
  - [ ] `useEquipmentList()` -- equipment catalog
  - [ ] `useEquipmentLoans()` -- active loans list
  - [ ] `useNewsList(category, page)` -- news list with filters
  - [ ] `useNewsDetail(id)` -- single news article

### Zustand Store Updates
- [ ] Update `donationStore` with multi-step form state management
- [ ] Create `pickupStore` for pickup form state
- [ ] Create `bookingStore` with calendar/slot selection state

### Form Validation Schemas (Zod)
- [ ] `bookingSchema` -- booking pindahan form
- [ ] `donationAmountSchema` -- donation step 1
- [ ] `pickupSchema` -- pickup request form

### Shared Components
- [ ] Build `ScreenWrapper` component (SafeAreaView + scroll + padding)
- [ ] Build `SectionHeader` component (title + optional "Lihat Semua" link)
- [ ] Build `StatCard` component (icon + number + label)
- [ ] Build `FilterTabBar` component (horizontal scrollable tabs)
- [ ] Build `MapPreview` component (static map thumbnail)

### Accessibility
- [ ] Add `accessibilityLabel` to all interactive elements
- [ ] Add `accessibilityRole` to buttons, links, headers
- [ ] Ensure minimum 44px touch targets
- [ ] Test with VoiceOver (iOS) and TalkBack (Android)

---

## Verification

- [ ] All 8 screens render correctly on iOS simulator
- [ ] All 8 screens render correctly on Android emulator
- [ ] All API integrations work against backend
- [ ] Navigation flow between all screens works correctly
- [ ] Forms validate and submit correctly
- [ ] Loading, error, and empty states display correctly
- [ ] Pull-to-refresh works on list screens
- [ ] No console errors or warnings in development mode

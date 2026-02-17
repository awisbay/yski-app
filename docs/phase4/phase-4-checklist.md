# Phase 4: Mobile Feature Screens - Checklist

**Objective:** Mengimplementasi semua 8 screen mockup ke dalam aplikasi mobile React Native + Expo, lengkap dengan API integration, state management, dan form validation.

**Stack:** React Native + Expo SDK 52, NativeWind v4, Expo Router, Zustand, React Hook Form + Zod, Axios + TanStack Query

**Estimated Duration:** 3 minggu

**Prerequisite:** Phase 3 (Mobile App Foundation) selesai -- design system, navigation, auth flow, API client sudah siap.

---

## Screen 1: Home / Beranda

- [ ] Implement `ImpactDashboard` component (Total Dampak section)
  - [ ] Display "Donasi Rp500jt+" stat card with donation icon
  - [ ] Display "Aksi Sosial 1.2k+" stat card with handshake icon
  - [ ] Fetch impact stats from `GET /donations/summary` and `GET /bookings/stats`
  - [ ] Animate counter numbers on load (optional: `react-native-reanimated`)
- [ ] Implement `QuickAccessMenu` component (4 quick action buttons)
  - [ ] "Pindah Gratis" button -> navigates to `/booking/pindahan`
  - [ ] "Alat Medis" button -> navigates to `/alkes`
  - [ ] "Zakat & Donasi" button -> navigates to `/donasi/nominal`
  - [ ] "Laporan Darurat" button -> navigates to emergency modal
- [ ] Implement "Program Sosial Terbaru" horizontal carousel
  - [ ] Fetch programs from `GET /programs?limit=5&sort=created_at:desc`
  - [ ] Build `ProgramCard` component with image, title, description, progress bar
  - [ ] Implement horizontal `FlatList` with snap behavior
  - [ ] "Lihat Semua" link -> navigate to full programs list
- [ ] Implement "Jadi Relawan?" CTA banner
  - [ ] CTA card with handshake icon and "Daftar Sekarang" button
  - [ ] Navigate to volunteer registration or info screen on tap
- [ ] Integrate pull-to-refresh on home screen
- [ ] Implement loading skeleton placeholders
- [ ] Implement error state with retry button

## Screen 2: Booking Pindahan

- [ ] Implement `StatusStepper` component
  - [ ] 3-step visual stepper: Menunggu -> Disetujui -> Proses
  - [ ] Active/completed/pending state styling per step
  - [ ] Step label: "Langkah 1/3"
- [ ] Implement `CalendarPicker` component
  - [ ] Calendar grid showing current month with navigation arrows
  - [ ] Disable past dates and fully-booked dates
  - [ ] Fetch availability from `GET /bookings/slots?date=YYYY-MM-DD`
  - [ ] Highlight selected date with primary color
- [ ] Implement `TimeSlotPicker` component
  - [ ] Display 4 time slots: 08:00, 10:00, 13:00, 15:00
  - [ ] Disable booked slots, highlight selected slot
  - [ ] Pill/chip style for each slot
- [ ] Implement address fields
  - [ ] "Alamat Penjemputan" text input with map preview
  - [ ] "Alamat Tujuan" text input with map preview
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
- [ ] Implement "Konfirmasi Pemesanan" submit button
- [ ] Display terms & conditions note at bottom

## Screen 3: Donasi Step 1 - Pilih Nominal

- [ ] Implement step indicator (Langkah 1 dari 3) with progress bar
- [ ] Implement donation type header ("Pilih Nominal Infaq")
- [ ] Implement `AmountSelector` component
  - [ ] 3 preset amounts with labels:
    - [ ] Rp 50.000 - "Nominal Minimal"
    - [ ] Rp 100.000 - "Sering Dipilih"
    - [ ] Rp 500.000 - "Sangat Berarti"
  - [ ] Visual selection state (primary border + background)
  - [ ] Custom amount input field with "Rp" prefix
  - [ ] Format input with thousand separators (e.g., 1.000.000)
  - [ ] Minimum validation: Rp 10.000
  - [ ] Info text: "Minimal donasi via aplikasi adalah Rp 10.000"
- [ ] Store selected amount in `donationStore`
- [ ] Implement "Lanjut ke Pembayaran" button
  - [ ] Disabled state when no amount selected
  - [ ] Navigate to `/donasi/pembayaran`

## Screen 4: Donasi Step 2 - Metode Pembayaran

- [ ] Implement step indicator (Langkah 2 dari 3)
- [ ] Display "Total Infaq Anda" summary card (e.g., Rp 150.000)
- [ ] Implement `PaymentMethodCard` component
  - [ ] Radio-style selection with circle indicator
  - [ ] Icon + payment method name + description
- [ ] Implement payment method groups
  - [ ] "Paling Populer": QRIS (Gopay, OVO, LinkAja, Dana, & Mobile Banking)
  - [ ] "E-Wallet": GoPay, OVO, ShopeePay (with branded icons)
  - [ ] "Transfer Bank (Virtual Account)": Bank BCA, Bank Mandiri (with "Verifikasi otomatis" label)
- [ ] Store selected payment method in `donationStore`
- [ ] Implement "Lanjut ke Pembayaran" button
  - [ ] Disabled when no method selected
  - [ ] Submit donation to `POST /donations`
  - [ ] Loading spinner during submission
  - [ ] On success: navigate to `/donasi/sukses`
  - [ ] On error: show error toast
- [ ] Display security note: "Pembayaran Anda diproses secara aman oleh Clicky Foundation."
- [ ] Back navigation preserves form state

## Screen 5: Donasi Step 3 - Sukses

- [ ] Implement success animation
  - [ ] Large green checkmark icon with scale animation
  - [ ] "Terima Kasih!" heading
  - [ ] Gratitude message text
- [ ] Implement "Ringkasan Transaksi" card
  - [ ] ID Donasi (e.g., #CKY-12345678)
  - [ ] Tanggal (formatted: "24 Mei 2024, 14:20")
  - [ ] Metode (e.g., "Transfer Bank / E-Wallet")
  - [ ] Total Donasi (e.g., "Rp 150.000")
- [ ] Fetch donation detail from `GET /donations/{donationId}`
- [ ] Implement "Bagikan ke WhatsApp" button (green)
  - [ ] Open WhatsApp with pre-filled share message via `Linking.openURL`
- [ ] Implement "Kembali ke Beranda" button (primary)
  - [ ] Navigate to `/(tabs)` and reset `donationStore`
- [ ] "Butuh bantuan dengan donasi Anda?" help link
- [ ] Reset `donationStore` on screen unmount

## Screen 6: Form Penjemputan Donasi

- [ ] Implement donation type toggle
  - [ ] Segment control: Zakat | Kencleng/Infaq
  - [ ] Pill style with active state
- [ ] Implement "Informasi Donatur" section
  - [ ] "Nama Lengkap" input with person icon
  - [ ] "Nomor Telepon (WhatsApp)" input with phone icon, tel keyboard
  - [ ] Pre-fill from `authStore.user` if logged in
- [ ] Implement "Lokasi Penjemputan" section
  - [ ] MapView preview showing selected location
  - [ ] Address text below map
  - [ ] "Pilih dari Peta" button -> opens LocationMapPicker
  - [ ] Auto-detect current location on mount
- [ ] Implement "Jadwal Penjemputan" section (Optional)
  - [ ] "Pilih Tanggal" date picker with calendar icon
  - [ ] "Slot Waktu" time slot chips: 09:00-12:00, 13:00-15:00, 16:00-18:00
- [ ] Implement info banner: "Layanan penjemputan resmi dari Clicky Foundation. Aman dan Terpercaya."
- [ ] Implement form validation (React Hook Form + Zod)
  - [ ] Required: donation_type, name, phone, address, coordinates
  - [ ] Phone: min 10 digits, Indonesian format
  - [ ] Optional: date, time slot
- [ ] Implement "Ajukan Penjemputan" submit button
  - [ ] Submit to `POST /pickups`
  - [ ] Success: show success modal, navigate to riwayat
  - [ ] Error: show inline validation errors
- [ ] Display terms note at bottom

## Screen 7: Inventory Alat Medis

- [ ] Implement dashboard stats row (4 cards)
  - [ ] "Total Alat" card with count
  - [ ] "Dipinjam" card with count
  - [ ] "Permintaan" card with count
  - [ ] "Tersedia" card with count
  - [ ] Fetch from `GET /equipment` with aggregation
- [ ] Implement "Ketersediaan Alat" section with "Lihat Semua" link
- [ ] Implement equipment cards list
  - [ ] Card with equipment photo, name
  - [ ] Availability badges: "Tersedia: X" (green), "Dipinjam: Y" (blue)
  - [ ] Equipment types: Kursi Roda, Tabung Oksigen, Tempat Tidur Pasien
  - [ ] Tap card -> navigate to `/alkes/[id]` for detail + loan request
- [ ] Implement "Peminjaman Aktif" table (Pengurus/Admin view)
  - [ ] Columns: Peminjam, Item, Tgl. Kembali
  - [ ] Show borrower avatar, name, equipment name, return date
  - [ ] Fetch from `GET /equipment/loans?status=active`
- [ ] Implement "Permintaan Baru" action banner
  - [ ] "Ada 3 Permintaan Baru" notification banner
  - [ ] "Setujui Permintaan" button
  - [ ] "Segera verifikasi permintaan peminjaman yang masuk"
- [ ] Role-based UI: Sahabat sees catalog only, Pengurus/Admin sees full dashboard
- [ ] Implement pull-to-refresh and loading skeletons

## Screen 8: Berita & Dampak

- [ ] Implement tab filter bar
  - [ ] Filter tabs: Semua, Kesehatan, Bencana, Pendidikan
  - [ ] Horizontal scrollable with active indicator
  - [ ] Filter maps to `GET /news?category={category}`
- [ ] Implement news card list
  - [ ] Card with cover image (aspect-video ratio)
  - [ ] Title, description snippet (2-3 lines)
  - [ ] "Baca Selengkapnya" button
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
- [ ] Update `bookingStore` with calendar/slot selection state

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

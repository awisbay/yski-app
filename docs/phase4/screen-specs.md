# Phase 4: Screen Specifications

Detailed UI/UX specifications for all 8 mockup screens based on the Clicky Foundation design mockups.

---

## 1. Home / Beranda

**Route:** `/(tabs)/index.tsx`

### Layout Structure

```
┌─────────────────────────────────┐
│  Header: Logo + Notification 🔔 │
├─────────────────────────────────┤
│  Total Dampak                    │
│  ┌──────────┐ ┌──────────┐     │
│  │ DONASI   │ │AKSI SOSIAL│     │
│  │Rp 500jt+ │ │  1.2k+   │     │
│  └──────────┘ └──────────┘     │
├─────────────────────────────────┤
│  Quick Actions (4 icons)         │
│  [Pindah] [Alkes] [Zakat] [📊]  │
├─────────────────────────────────┤
│  Program Sosial Terbaru  →       │
│  ┌─────┐ ┌─────┐               │
│  │Card │ │Card │  (horizontal)  │
│  └─────┘ └─────┘               │
├─────────────────────────────────┤
│  Jadi Relawan? CTA Banner       │
│  [Daftar Sekarang]              │
├─────────────────────────────────┤
│  Bottom Tabs                     │
│  Beranda | Kegiatan | Riwayat | Profil │
└─────────────────────────────────┘
```

### Component Hierarchy

```
HomeScreen
├── ScrollView (pull-to-refresh)
│   ├── Header (logo + notification bell with badge)
│   ├── ImpactDashboard
│   │   ├── StatCard (Donasi - Rp 500jt+)
│   │   └── StatCard (Aksi Sosial - 1.2k+)
│   ├── QuickAccessMenu
│   │   ├── QuickActionButton (Pindah Gratis)
│   │   ├── QuickActionButton (Alat Medis)
│   │   ├── QuickActionButton (Zakat & Donasi)
│   │   └── QuickActionButton (Laporan Darurat)
│   ├── SectionHeader (Program Sosial Terbaru + Lihat Semua)
│   ├── ProgramCarousel (horizontal FlatList)
│   │   └── ProgramCard[] (image, title, desc, progress, "Ikut Serta" btn)
│   └── VolunteerCTABanner
│       └── Button (Daftar Sekarang)
└── BottomTabBar
```

### State Management
- `useImpactStats()` - TanStack Query hook for dashboard stats
- `usePrograms({ limit: 5 })` - TanStack Query for program carousel
- `notificationStore.unreadCount` - badge count on bell icon

### API Endpoints Consumed
- `GET /api/v1/donations/summary` - total donation stats
- `GET /api/v1/programs?limit=5&sort=created_at:desc` - latest programs
- `GET /api/v1/notifications/unread-count` - notification badge

### User Interactions
- Pull-to-refresh: refetch all data
- Tap quick action: navigate to respective screen
- Tap program card "Ikut Serta": navigate to program detail or donation
- Tap "Lihat Semua": navigate to full program list
- Tap "Daftar Sekarang": navigate to volunteer registration
- Tap notification bell: navigate to notification list

---

## 2. Booking Pindahan

**Route:** `/booking/pindahan.tsx`

### Layout Structure

```
┌─────────────────────────────────┐
│  ← Pesan Layanan Pindah Gratis  │
├─────────────────────────────────┤
│  Status Permohonan    Langkah 1/3│
│  ○──────○──────○                 │
│  MENUNGGU DISETUJUI PROSES      │
├─────────────────────────────────┤
│  📅 Pilih Tanggal Penjemputan    │
│  ┌─ Oktober 2023 ──── < > ─┐   │
│  │ S S R K J S M            │   │
│  │ 3 [4] 5 ⑥ 7 8 9         │   │
│  └──────────────────────────┘   │
├─────────────────────────────────┤
│  🕐 Pilih Waktu                  │
│  [08:00] (10:00) (13:00) (15:0) │
├─────────────────────────────────┤
│  📍 Detail Lokasi                │
│  ALAMAT PENJEMPUTAN             │
│  ┌────── Map ──────┐           │
│  │                  │ [Pilih]   │
│  └──────────────────┘           │
│  ALAMAT TUJUAN                  │
│  ┌────── Map ──────┐           │
│  │                  │ [Pilih]   │
│  └──────────────────┘           │
├─────────────────────────────────┤
│  ℹ️ Info: Layanan gratis...      │
│  [Konfirmasi Pemesanan →]       │
└─────────────────────────────────┘
```

### Component Hierarchy

```
BookingScreen
├── ScrollView
│   ├── Header (back button + title)
│   ├── StatusStepper (3 steps)
│   ├── Section: Pilih Tanggal
│   │   └── CalendarPicker (month grid, navigation)
│   ├── Section: Pilih Waktu
│   │   └── TimeSlotPicker (4 pill buttons)
│   ├── Section: Detail Lokasi
│   │   ├── AddressField (Alamat Penjemputan)
│   │   │   ├── MapPreview
│   │   │   └── Button (Pilih dari Peta)
│   │   └── AddressField (Alamat Tujuan)
│   │       ├── MapPreview
│   │       └── Button (Pilih dari Peta)
│   └── InfoBanner (free service notice)
└── FixedBottom
    └── Button (Konfirmasi Pemesanan →)
```

### Form Validation (Zod Schema)

```typescript
const bookingSchema = z.object({
  booking_date: z.string().min(1, "Pilih tanggal penjemputan"),
  time_slot: z.enum(["08:00", "10:00", "13:00", "15:00"], {
    required_error: "Pilih waktu penjemputan"
  }),
  pickup_address: z.string().min(5, "Masukkan alamat penjemputan"),
  pickup_lat: z.number(),
  pickup_lng: z.number(),
  dropoff_address: z.string().min(5, "Masukkan alamat tujuan"),
  dropoff_lat: z.number(),
  dropoff_lng: z.number(),
  notes: z.string().optional(),
});
```

### API Endpoints Consumed
- `GET /api/v1/bookings/slots?date=YYYY-MM-DD` - check slot availability
- `GET /api/v1/bookings/slots/calendar?month=YYYY-MM` - calendar availability
- `POST /api/v1/bookings` - create booking

---

## 3. Donasi Step 1 - Pilih Nominal

**Route:** `/donasi/nominal.tsx`

### Layout Structure

```
┌─────────────────────────────────┐
│  ← Donasi Clicky Foundation     │
├─────────────────────────────────┤
│  LANGKAH 1 DARI 3  Pilih Nominal│
│  ████████░░░░░░░░░░░░░░ (33%)   │
├─────────────────────────────────┤
│  Pilih Nominal Infaq             │
│  Berapa banyak yang ingin Anda   │
│  donasikan hari ini?             │
├─────────────────────────────────┤
│  ┌──────────────────────┐       │
│  │ Nominal Minimal      │ ✓     │
│  │ Rp 50.000            │       │
│  └──────────────────────┘       │
│  ┌──────────────────────┐       │
│  │ Sering Dipilih       │       │
│  │ Rp 100.000           │       │
│  └──────────────────────┘       │
│  ┌──────────────────────┐       │
│  │ Sangat Berarti       │       │
│  │ Rp 500.000           │       │
│  └──────────────────────┘       │
│  Nominal Lainnya                │
│  ┌──────────────────────┐       │
│  │ Rp  Contoh: 1.000.000│       │
│  └──────────────────────┘       │
│  ℹ️ Minimal donasi Rp 10.000    │
├─────────────────────────────────┤
│  [Lanjut ke Pembayaran →]       │
└─────────────────────────────────┘
```

### State Management (donationStore)

```typescript
// Selected in this screen, carried to next steps
donationStore.setType("infaq");
donationStore.setAmount(100000);
// or custom:
donationStore.setAmount(250000);
```

### API Endpoints Consumed
- None (client-side state only, submitted in Step 2)

---

## 4. Donasi Step 2 - Metode Pembayaran

**Route:** `/donasi/pembayaran.tsx`

### Layout Structure

```
┌─────────────────────────────────┐
│  ← Metode Pembayaran            │
├─────────────────────────────────┤
│  LANGKAH 2 DARI 3  Pilih Pembayaran│
│  ████████████████░░░░░░ (66%)   │
├─────────────────────────────────┤
│  Total Infaq Anda     📋        │
│  Rp 150.000                     │
├─────────────────────────────────┤
│  PALING POPULER                 │
│  ┌ QRIS                    ◉ ┐ │
│  │ Gopay, OVO, LinkAja...    │ │
│  └───────────────────────────┘ │
│  E-WALLET                       │
│  ┌ GoPay                   ○ ┐ │
│  ├ OVO                     ○ ┤ │
│  └ ShopeePay               ○ ┘ │
│  TRANSFER BANK (VIRTUAL ACCOUNT)│
│  ┌ Bank BCA                ○ ┐ │
│  │ Verifikasi otomatis       │ │
│  ├ Bank Mandiri            ○ ┤ │
│  │ Verifikasi otomatis       │ │
│  └───────────────────────────┘ │
├─────────────────────────────────┤
│  [Lanjut ke Pembayaran →]       │
│  Pembayaran diproses aman...    │
└─────────────────────────────────┘
```

### API Endpoints Consumed
- `POST /api/v1/donations` - submit donation with amount + payment method

---

## 5. Donasi Step 3 - Sukses

**Route:** `/donasi/sukses.tsx`

### Layout Structure

```
┌─────────────────────────────────┐
│  🏠 Clicky Foundation       ✕   │
├─────────────────────────────────┤
│           ✅                     │
│      Terima Kasih!              │
│  Terima kasih atas kebaikan     │
│  Anda. Infaq Anda sangat       │
│  berarti bagi mereka yang       │
│  membutuhkan.                   │
├─────────────────────────────────┤
│  RINGKASAN TRANSAKSI            │
│  ID Donasi    #CKY-12345678    │
│  Tanggal      24 Mei 2024, 14:20│
│  Metode       Transfer Bank     │
│  Total Donasi Rp 150.000       │
├─────────────────────────────────┤
│  [📤 Bagikan ke WhatsApp]       │
│  [🏠 Kembali ke Beranda]        │
│  Butuh bantuan dengan donasi?   │
└─────────────────────────────────┘
```

### API Endpoints Consumed
- `GET /api/v1/donations/{id}` - fetch donation detail for summary

---

## 6. Form Penjemputan Donasi

**Route:** `/pickup/donasi.tsx`

### Layout Structure

```
┌─────────────────────────────────┐
│  ← Penjemputan Donasi           │
├─────────────────────────────────┤
│  ℹ️ Layanan penjemputan resmi... │
├─────────────────────────────────┤
│  JENIS DONASI                   │
│  [Zakat] (Kencleng/Infaq)       │
├─────────────────────────────────┤
│  INFORMASI DONATUR              │
│  👤 Nama Lengkap [________]     │
│  📞 Nomor Telepon [________]    │
├─────────────────────────────────┤
│  LOKASI PENJEMPUTAN             │
│  ┌────── Map ──────┐           │
│  │  📍               │          │
│  └──────────────────┘           │
│  Jl. Kebon Jeruk Raya No. 12... │
│  [📍 Pilih dari Peta]           │
├─────────────────────────────────┤
│  JADWAL PENJEMPUTAN    Opsional │
│  📅 Pilih Tanggal [mm/dd/yyyy] │
│  🕐 Slot Waktu                  │
│  [09:00-12:00] (13:00-15:00)   │
│  (16:00-18:00)                  │
├─────────────────────────────────┤
│  [Ajukan Penjemputan >>]        │
│  Terms & conditions note        │
└─────────────────────────────────┘
```

### Form Validation (Zod Schema)

```typescript
const pickupSchema = z.object({
  donation_type: z.enum(["zakat", "kencleng_infaq"]),
  requester_name: z.string().min(2, "Nama minimal 2 karakter"),
  requester_phone: z.string()
    .min(10, "Nomor telepon minimal 10 digit")
    .regex(/^(\+62|62|0)8[1-9][0-9]{6,10}$/, "Format nomor telepon tidak valid"),
  pickup_address: z.string().min(5, "Masukkan alamat penjemputan"),
  pickup_lat: z.number(),
  pickup_lng: z.number(),
  preferred_date: z.string().optional(),
  preferred_slot: z.enum(["09:00-12:00", "13:00-15:00", "16:00-18:00"]).optional(),
  notes: z.string().optional(),
});
```

### API Endpoints Consumed
- `POST /api/v1/pickups` - submit pickup request

---

## 7. Inventory Alat Medis

**Route:** `/alkes/index.tsx` (Admin/Pengurus view)

### Layout Structure

```
┌─────────────────────────────────┐
│  INVENTORY ALAT MEDIS    👤 ⚙️  │
│  Clicky Foundation Dashboard    │
├─────────────────────────────────┤
│  ┌─────┐ ┌─────┐               │
│  │Total│ │Dipin│ ┌─────┐┌─────┐│
│  │ 42  │ │jam 7│ │Perm.││Ters.││
│  └─────┘ └─────┘ │ 3  ││ 35 ││
│                   └─────┘└─────┘│
├─────────────────────────────────┤
│ 🔧 Ketersediaan Alat  Lihat Semua│
│  ┌──────────────────┐           │
│  │ [photo]          │           │
│  │ Kursi Roda       │           │
│  │ Tersedia:5 Dipinjam:2│       │
│  └──────────────────┘           │
│  ┌──────────────────┐           │
│  │ [photo]          │           │
│  │ Tabung Oksigen   │           │
│  │ Tersedia:12 Dipinjam:4│      │
│  └──────────────────┘           │
├─────────────────────────────────┤
│ ☑️ Peminjaman Aktif              │
│  PEMINJAM    ITEM      TGL.KEMB │
│  Budi S.    Kursi Roda  12 Okt  │
│  Susi S.    Tabung O2   15 Okt  │
├─────────────────────────────────┤
│  ┌─ Ada 3 Permintaan Baru ────┐│
│  │ Segera verifikasi...        ││
│  │ [Setujui Permintaan]       ││
│  └────────────────────────────┘│
└─────────────────────────────────┘
```

### API Endpoints Consumed
- `GET /api/v1/equipment` - equipment list with stock info
- `GET /api/v1/equipment/loans?status=active` - active loans
- `GET /api/v1/equipment/loans?status=requested` - pending requests count

---

## 8. Berita & Dampak

**Route:** `/berita/index.tsx`

### Layout Structure

```
┌─────────────────────────────────┐
│  Berita & Dampak                │
├─────────────────────────────────┤
│  (Semua) (Kesehatan) (Bencana)  │
│  (Pendidikan)                   │
├─────────────────────────────────┤
│  ┌──────────────────────┐      │
│  │ [cover image]        │      │
│  │ 100 Anak Mengikuti   │      │
│  │ Khitanan Massal...   │      │
│  │ [Baca Selengkapnya]  │      │
│  └──────────────────────┘      │
│  ┌──────────────────────┐      │
│  │ [cover image]        │      │
│  │ Bantuan Pangan...    │      │
│  │ [Baca Selengkapnya]  │      │
│  └──────────────────────┘      │
│  ┌──────────────────────┐      │
│  │ [cover image]        │      │
│  │ Beasiswa Mencetak... │      │
│  │ [Baca Selengkapnya]  │      │
│  └──────────────────────┘      │
│  [Load More / Infinite Scroll]  │
└─────────────────────────────────┘
```

### API Endpoints Consumed
- `GET /api/v1/news?category={category}&page={page}&limit=10` - news list
- `GET /api/v1/news/{id}` - news detail (on detail screen)

---

## Loading / Error / Empty States

### Loading States
- **Skeleton placeholders** for each card type (shimmer effect)
- **Spinner overlay** for form submissions
- **Progress bar** for multi-step donation flow

### Error States
- **Network error:** "Tidak ada koneksi internet. Periksa jaringan Anda." + Retry button
- **Server error:** "Terjadi kesalahan. Silakan coba lagi." + Retry button
- **Auth error:** Auto-redirect to login on 401 after failed refresh

### Empty States
- **No programs:** "Belum ada program aktif saat ini."
- **No news:** "Belum ada berita untuk kategori ini."
- **No equipment:** "Semua alat sedang dipinjam. Silakan cek kembali nanti."
- **No bookings:** "Anda belum memiliki riwayat booking."

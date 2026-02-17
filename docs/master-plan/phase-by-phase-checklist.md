# Clicky Foundation App - Phase-by-Phase Checklist

Checklist implementasi untuk setiap phase pengembangan aplikasi Clicky Foundation (Yayasan Sahabat Khairat).

---

## Phase 0: Project Setup & Architecture

**Goal:** Fondasi project siap untuk development.

### Monorepo Init
- [x] Inisialisasi Git repository
- [x] Setup monorepo structure (`backend/`, `mobile/`, `wp-plugin/`, `mockup/`, `docs/`)
- [x] Buat `.gitignore` untuk Python, Node.js, dan environment files
- [x] Setup `.editorconfig` untuk konsistensi formatting
- [x] Buat `README.md` project utama

### Docker Compose
- [x] Buat `docker-compose.yml` dengan semua services
- [x] Setup **Nginx** container (reverse proxy)
- [x] Setup **FastAPI** container dengan hot-reload
- [x] Setup **PostgreSQL 16** container dengan persistent volume
- [x] Setup **Redis 7** container
- [x] Setup **MinIO** container dengan console access
- [x] Buat `.env.example` untuk environment variables
- [ ] Test: semua containers berjalan dengan `docker compose up`

### CI/CD Skeleton
- [x] Setup GitHub Actions workflow skeleton
- [x] Workflow: lint & format check (backend)
- [x] Workflow: lint & format check (mobile)
- [x] Workflow: run tests (placeholder)
- [x] Workflow: build Docker images

### Docs Structure
- [x] Buat `docs/master-plan/` - implementation plan & checklist
- [x] Buat `docs/api/` - placeholder untuk API docs
- [x] Buat `docs/guides/` - placeholder untuk developer guides
- [x] Dokumentasi setup instructions di README

---

## Phase 1: Backend Foundation + Auth + RBAC

**Goal:** Backend bisa handle authentication dan role-based access control.

### FastAPI Project Setup
- [x] Inisialisasi FastAPI project di `backend/`
- [x] Setup project structure (api, core, models, schemas, services, repositories)
- [x] Konfigurasi `settings.py` dengan Pydantic Settings (env-based config)
- [x] Setup logging configuration
- [x] Setup CORS middleware
- [x] Buat health check endpoint (`GET /health`)

### Database + SQLAlchemy + Alembic
- [x] Setup SQLAlchemy 2.0 async engine
- [x] Konfigurasi Alembic untuk migrations
- [x] Buat base model dengan `created_at`, `updated_at`, `id` (UUID)
- [x] Buat `User` model (email, phone, password_hash, role, is_active, profile fields)
- [x] Buat `RolePermission` model untuk RBAC (admin, pengurus, relawan, sahabat)
- [x] Jalankan initial migration
- [x] Buat seed script untuk admin user pertama

### JWT Authentication
- [x] Implement password hashing (bcrypt)
- [x] Implement JWT token generation (access + refresh token)
- [x] `POST /api/v1/auth/register` - registrasi sahabat baru
- [x] `POST /api/v1/auth/login` - login dengan email/phone + password
- [x] `POST /api/v1/auth/refresh` - refresh access token
- [ ] `POST /api/v1/auth/logout` - invalidate refresh token
- [x] Dependency injection: `get_current_user`
- [ ] Token blacklist di Redis (untuk logout)

### RBAC (Role-Based Access Control)
- [x] Buat permission system (role -> permissions mapping)
- [x] Implement `require_role()` dependency untuk endpoint protection
- [x] Implement `require_permission()` untuk granular access
- [ ] Test: Admin bisa akses semua endpoint
- [ ] Test: Sahabat hanya bisa akses endpoint publik
- [ ] Test: Unauthorized request mendapat 401/403

### User CRUD
- [x] `GET /api/v1/users/me` - profile sendiri
- [x] `PUT /api/v1/users/me` - update profile sendiri
- [x] `GET /api/v1/users` - list users (admin/pengurus only)
- [x] `GET /api/v1/users/{id}` - detail user (admin/pengurus only)
- [x] `PUT /api/v1/users/{id}` - update user (admin only)
- [x] `DELETE /api/v1/users/{id}` - soft delete (admin only)
- [x] Pagination untuk list endpoint
- [x] Search/filter users by name, role, status

---

## Phase 2: Backend Core Features

**Goal:** Semua core business logic ter-implementasi di backend.

### Booking Pindahan (Anti Double-Booking)
- [x] Buat `MovingBooking` model (single armada model)
- [x] `POST /api/v1/bookings` - buat booking baru
- [x] `GET /api/v1/bookings` - list bookings (filtered by role)
- [x] `GET /api/v1/bookings/{id}` - detail booking
- [x] `PUT /api/v1/bookings/{id}/status` - update status (pengurus/relawan)
- [x] `PUT /api/v1/bookings/{id}/cancel` - cancel booking
- [x] `GET /api/v1/bookings/slots` - cek ketersediaan slot per tanggal
- [x] Implement **UNIQUE constraint** untuk prevent double-booking (Layer 1)
- [x] Implement **pessimistic lock** di booking creation (Layer 2)
- [x] Implement **business validation** (Layer 3)
- [ ] Auto-cancel expired pending bookings (Celery task)
- [ ] Test: concurrent booking requests tidak menghasilkan double-book

### Equipment / Peminjaman Alkes
- [x] Buat `MedicalEquipment` model (nama, kategori, deskripsi, stok_total, stok_tersedia, foto, kondisi)
- [x] Buat `EquipmentLoan` model (user, equipment, tanggal_pinjam, tanggal_kembali, status)
- [ ] `GET /api/v1/equipment` - list alkes (semua user)
- [ ] `GET /api/v1/equipment/{id}` - detail alkes
- [ ] `POST /api/v1/equipment` - tambah alkes (admin/pengurus)
- [ ] `POST /api/v1/equipment/{id}/borrow` - ajukan peminjaman
- [ ] `PUT /api/v1/equipment-loans/{id}/status` - approve/reject/return
- [ ] Stok otomatis berkurang saat approved, bertambah saat returned
- [ ] Foto upload ke MinIO

### Donasi / Infaq + Payment Abstraction
- [x] Buat `Donation` model (user, amount, type, payment_method, payment_status, bukti_transfer)
- [ ] Buat `PaymentTransaction` model (abstraksi untuk semua pembayaran)
- [ ] Implement `PaymentGateway` abstract class
- [ ] Implement `ManualTransferGateway` (transfer bank manual + upload bukti)
- [ ] Implement `MidtransGateway` (placeholder/sandbox)
- [ ] `POST /api/v1/donations` - buat donasi baru
- [ ] `GET /api/v1/donations` - list donasi (filtered by role)
- [ ] `PUT /api/v1/donations/{id}/verify` - verifikasi donasi (pengurus)
- [ ] `POST /api/v1/donations/{id}/upload-proof` - upload bukti transfer
- [ ] Payment callback endpoint untuk payment gateway

### Jemput Zakat / Donasi
- [x] Buat `PickupRequest` model (user, tipe_zakat, alamat, jadwal, relawan, status, catatan)
- [ ] `POST /api/v1/pickups` - request jemput zakat
- [ ] `GET /api/v1/pickups` - list pickup requests
- [ ] `PUT /api/v1/pickups/{id}/assign` - assign relawan (pengurus)
- [ ] `PUT /api/v1/pickups/{id}/status` - update status (relawan)
- [ ] Notifikasi ke relawan saat di-assign

### Programs & News CRUD
- [x] Buat `Program` model (judul, deskripsi, target_dana, dana_terkumpul, status, foto)
- [x] Buat `NewsArticle` model (judul, konten, kategori, thumbnail, published_at)
- [ ] CRUD endpoints untuk Programs (admin/pengurus manage, semua bisa view)
- [ ] CRUD endpoints untuk News/Berita
- [ ] Image upload ke MinIO untuk thumbnail
- [ ] Pagination dan search

---

## Phase 3: Mobile App Foundation

**Goal:** Aplikasi mobile siap dengan design system dan navigation.

### Expo Project Setup
- [x] Inisialisasi Expo project (SDK 52) di `mobile/`
- [x] Konfigurasi `app.json` / `app.config.js`
- [x] Setup TypeScript
- [x] Setup ESLint + Prettier
- [x] Setup path aliases (`@/components`, `@/hooks`, dll)

### NativeWind v4 Setup
- [x] Install dan konfigurasi NativeWind v4
- [x] Setup `tailwind.config.js` dengan custom theme
- [x] Definisikan color palette sesuai branding Sahabat Khairat
- [x] Definisikan typography scale
- [ ] Test: NativeWind className berfungsi di komponen

### Design System (dari Mockups)
- [ ] Analisis 8 screen mockups
- [ ] Buat `Button` component (primary, secondary, outline, disabled states)
- [ ] Buat `Input` component (text, phone, number, textarea)
- [ ] Buat `Card` component (berbagai variant)
- [ ] Buat `Header` / `AppBar` component
- [ ] Buat `BottomSheet` component
- [ ] Buat `Badge` component (status indicators)
- [ ] Buat `Avatar` component
- [ ] Buat `LoadingSpinner` dan `Skeleton` component
- [ ] Buat `EmptyState` component
- [ ] Dokumentasi design system components

### Navigation Structure
- [x] Setup Expo Router (file-based routing)
- [x] Buat layout structure:
  - `(auth)/` - login, register screens
  - `(tabs)/` - main app with bottom tabs
  - `(tabs)/home` - beranda
  - `(tabs)/services` - layanan
  - `(tabs)/activity` - aktivitas/riwayat
  - `(tabs)/profile` - profil
- [x] Bottom tab navigation dengan icons
- [ ] Stack navigation untuk detail screens
- [x] Auth guard (redirect ke login jika belum auth)

### Auth Screens
- [x] Screen: **Login** (email/phone + password)
- [x] Screen: **Register** (nama, email, phone, password)
- [ ] Screen: **Forgot Password** (placeholder)
- [ ] Implement form validation (React Hook Form + Zod)
- [ ] Integrasi dengan auth API endpoints
- [ ] Secure token storage (expo-secure-store)
- [ ] Auto-refresh token logic

### API Client Setup
- [ ] Setup Axios instance dengan base URL dan interceptors
- [ ] Setup React Query (TanStack Query) provider
- [ ] Implement token refresh interceptor
- [ ] Implement error handling global (toast/alert)
- [ ] Buat typed API hooks per-resource:
  - `useAuth()` - login, register, logout
  - `useUser()` - profile management
  - `useBookings()` - booking operations
  - `useDonations()` - donation operations
  - `useEquipment()` - alkes operations

---

## Phase 4: Mobile Feature Screens

**Goal:** Semua 8 mockup screens ter-implementasi dengan integrasi API.

### Home / Beranda
- [ ] Hero section dengan greeting dan info user
- [ ] Quick action buttons (Booking, Donasi, Jemput Zakat, Alkes)
- [ ] Program highlight carousel
- [ ] Berita terbaru list
- [ ] Transparansi keuangan ringkasan
- [ ] Pull-to-refresh

### Booking Pindahan Form
- [ ] Step 1: Pilih tanggal dan armada (calendar picker)
- [ ] Step 2: Input alamat asal dan tujuan
- [ ] Step 3: Catatan tambahan dan konfirmasi
- [ ] Availability check real-time saat pilih tanggal
- [ ] Booking confirmation screen
- [ ] Booking history / riwayat list
- [ ] Booking detail screen dengan status tracking

### Donasi Flow (3-Step)
- [ ] Step 1: Pilih program / jenis donasi, input nominal
- [ ] Step 2: Pilih metode pembayaran (transfer manual / payment gateway)
- [ ] Step 3: Konfirmasi dan instruksi pembayaran
- [ ] Upload bukti transfer (camera / gallery)
- [ ] Donasi success screen
- [ ] Riwayat donasi list

### Jemput Donasi / Zakat Form
- [ ] Pilih jenis zakat/donasi
- [ ] Input alamat penjemputan (dengan map picker jika memungkinkan)
- [ ] Pilih jadwal penjemputan
- [ ] Catatan tambahan
- [ ] Konfirmasi dan submit
- [ ] Tracking status penjemputan

### Alkes - List + Detail
- [ ] Equipment list dengan search dan filter kategori
- [ ] Equipment detail (foto, deskripsi, ketersediaan)
- [ ] Form peminjaman alkes
- [ ] Riwayat peminjaman
- [ ] Status tracking peminjaman

### Berita & Dampak
- [ ] News/Berita list dengan thumbnail
- [ ] News detail screen (rich content)
- [ ] Program list dengan progress bar (target vs terkumpul)
- [ ] Program detail screen
- [ ] Share functionality (deep link)

### Additional Screens (dari Mockup)
- [ ] Profile screen dengan edit profile
- [ ] Settings screen (notification preferences, dll)
- [ ] Notification list screen
- [ ] About / Tentang Yayasan screen

---

## Phase 5: Advanced Features

**Goal:** Fitur lanjutan yang menambah value aplikasi.

### Lelang / Auction
- [ ] Backend: `Auction` model (item, foto, harga_awal, harga_tertinggi, waktu_mulai, waktu_selesai)
- [ ] Backend: `AuctionBid` model (user, auction, bid_amount, timestamp)
- [ ] `POST /api/v1/auctions` - buat lelang baru (admin/pengurus)
- [ ] `GET /api/v1/auctions` - list lelang aktif
- [ ] `POST /api/v1/auctions/{id}/bid` - pasang bid
- [ ] Validasi bid: harus lebih tinggi dari bid terakhir
- [ ] Auto-close auction saat waktu habis (Celery)
- [ ] Mobile: Auction list screen
- [ ] Mobile: Auction detail + bidding interface
- [ ] Mobile: Real-time bid updates (polling / WebSocket)
- [ ] Notifikasi: outbid, auction won, auction ending soon

### Financial Reports / Transparansi Keuangan
- [ ] Backend: `FinancialReport` model (periode, pemasukan, pengeluaran, kategori)
- [ ] `GET /api/v1/reports/financial` - laporan keuangan publik
- [ ] `GET /api/v1/reports/donations` - ringkasan donasi per-periode
- [ ] `GET /api/v1/reports/programs` - progress per-program
- [ ] `POST /api/v1/reports/generate` - generate report (admin)
- [ ] Mobile: Financial report screen dengan charts
- [ ] Mobile: Donation impact visualization
- [ ] Export ke PDF (Celery background task)

### Notification System
- [ ] Backend: `Notification` model (user, title, body, type, read_at, data)
- [ ] Setup Expo Push Notifications (expo-notifications)
- [ ] Register device push token saat login
- [ ] `GET /api/v1/notifications` - list notifikasi user
- [ ] `PUT /api/v1/notifications/{id}/read` - mark as read
- [ ] `PUT /api/v1/notifications/read-all` - mark all as read
- [ ] Trigger notifications untuk events:
  - [ ] Booking confirmed / status changed
  - [ ] Donasi terverifikasi
  - [ ] Pickup assigned / status changed
  - [ ] Auction outbid / won
  - [ ] Peminjaman alkes approved / reminder kembali
- [ ] Notification preferences per-user

---

## Phase 6: WordPress Integration

**Goal:** Website WordPress ter-sinkronisasi dengan data dari aplikasi.

### WP Plugin Development
- [ ] Buat plugin skeleton `clicky-foundation`
- [ ] Plugin activation/deactivation hooks
- [ ] Settings page di WP Admin (API URL, API key)
- [ ] Custom Post Types: `clicky_program`, `clicky_news`
- [ ] REST API endpoints di WP side untuk receive data

### Content Sync
- [ ] Sync programs dari FastAPI ke WP (cron-based / webhook)
- [ ] Sync news/berita dari FastAPI ke WP
- [ ] Sync financial reports (summary) ke WP
- [ ] Two-way sync: content edited di WP bisa push balik ke FastAPI
- [ ] Error handling dan retry logic untuk sync failures

### Shortcodes
- [ ] `[clicky_donation_form]` - embed donation form di website
- [ ] `[clicky_financial_report]` - tampilkan laporan keuangan
- [ ] `[clicky_equipment_list]` - list alkes tersedia
- [ ] `[clicky_program_progress]` - progress program dengan bar
- [ ] `[clicky_news_feed]` - feed berita terbaru
- [ ] Styling shortcode output sesuai WP theme

---

## Phase 7: QA, Security, Performance & Deploy

**Goal:** Aplikasi siap production dengan kualitas dan keamanan terjamin.

### Testing
- [ ] Backend unit tests (pytest) - coverage target 80%
- [ ] Backend integration tests (API endpoint tests)
- [ ] Test database transactions dan edge cases (double-booking, concurrent bids)
- [ ] Mobile component tests (Jest + React Native Testing Library)
- [ ] Mobile screen tests (navigation, form submission)
- [ ] End-to-end test scenarios (critical paths)
- [ ] Load testing untuk booking engine (Locust / k6)

### Security Hardening
- [ ] Input validation di semua endpoints (Pydantic)
- [ ] SQL injection prevention (parameterized queries via SQLAlchemy)
- [ ] XSS prevention di mobile app
- [ ] Rate limiting (Nginx + Redis)
- [ ] CORS configuration production
- [ ] Secure headers (Nginx)
- [ ] File upload validation (type, size, content)
- [ ] Audit log untuk operasi sensitif (admin actions)
- [ ] Environment variables untuk semua secrets (no hardcoded)
- [ ] Dependency vulnerability scan (safety, npm audit)

### CI/CD Pipeline
- [ ] GitHub Actions: lint, test, build pada setiap PR
- [ ] GitHub Actions: build Docker images pada merge ke main
- [ ] GitHub Actions: auto-deploy ke staging server
- [ ] GitHub Actions: manual trigger deploy ke production
- [ ] Database migration check di CI
- [ ] Mobile: EAS Build configuration (Expo Application Services)
- [ ] Mobile: OTA update setup (Expo Updates)

### Monitoring & Logging
- [ ] Structured logging (JSON format)
- [ ] Health check endpoints untuk semua services
- [ ] Uptime monitoring (external)
- [ ] Error alerting (email / Telegram bot)
- [ ] Database performance monitoring
- [ ] API response time tracking

---

## Phase 8: Beta Launch

**Goal:** Aplikasi dirilis ke beta users untuk validasi dan feedback.

### Beta Testing
- [ ] Internal testing oleh tim pengurus yayasan
- [ ] Distribusi via TestFlight (iOS) dan Internal Testing (Android)
- [ ] Onboard 20-50 beta users (sahabat terpilih)
- [ ] Bug reporting mechanism (in-app feedback form)
- [ ] Collect user feedback secara berkala

### KPI Tracking
- [ ] Track jumlah registrasi baru
- [ ] Track jumlah booking pindahan berhasil
- [ ] Track total donasi via aplikasi
- [ ] Track jumlah peminjaman alkes
- [ ] Track engagement rate (DAU/MAU)
- [ ] Track crash rate dan error rate
- [ ] Dashboard KPI sederhana untuk admin

### Feedback & Iteration
- [ ] Analisis feedback dari beta users
- [ ] Prioritasi bug fixes berdasarkan severity
- [ ] Iterasi UI/UX berdasarkan feedback
- [ ] Performance optimization berdasarkan real usage data
- [ ] Dokumentasi lessons learned
- [ ] Rencana untuk public launch (Phase 9+)

---

## Progress Tracker

| Phase | Status | Progress |
|-------|--------|----------|
| Phase 0 | ✅ Completed | 95% |
| Phase 1 | 🔄 In Progress | 90% |
| Phase 2 | 🔄 In Progress | 40% |
| Phase 3 | 🔄 In Progress | 50% |
| Phase 4 | 🔄 In Progress | 40% |
| Phase 5 | 📋 Not Started | 0% |
| Phase 6 | 📋 Not Started | 0% |
| Phase 7 | 📋 Not Started | 0% |
| Phase 8 | 📋 Not Started | 0% |

---

*Last updated: 2026-02-17*

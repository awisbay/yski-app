# Clicky Foundation App - Implementation Plan

## 1. Project Overview

**Clicky Foundation** adalah aplikasi mobile untuk Yayasan "Sahabat Khairat" (YSKI) yang bertujuan mendigitalisasi layanan sosial yayasan. Aplikasi ini menjadi jembatan antara yayasan, relawan, dan masyarakat (sahabat) untuk mempermudah akses terhadap layanan pindahan, peminjaman alat kesehatan, donasi, pengumpulan zakat, lelang barang, dan transparansi keuangan.

### Fitur Utama

| Fitur | Deskripsi |
|-------|-----------|
| **Booking Pindahan** | Pemesanan armada untuk pindahan rumah/kantor |
| **Peminjaman Alkes** | Peminjaman alat kesehatan (kursi roda, tongkat, dll) |
| **Donasi / Infaq** | Penerimaan donasi dengan berbagai metode pembayaran |
| **Jemput Zakat** | Penjemputan zakat ke lokasi donatur |
| **Lelang Barang** | Sistem lelang barang donasi untuk penggalangan dana |
| **Transparansi Keuangan** | Laporan keuangan publik yang transparan |
509
### User Levels (RBAC)

| Level | Role | Akses |
|-------|------|-------|
| 1 | **Admin** | Full access, manage all resources, financial reports, user management |
| 2 | **Pengurus** | Manage bookings, equipment, donations, approve requests |
| 3 | **Relawan** | Handle assigned tasks, update status, pickup operations |
| 4 | **Sahabat** | Public user - booking, donate, borrow, view reports |

---

## 2. Tech Stack

### Backend
- **Framework:** FastAPI (Python 3.11+)
- **ORM:** SQLAlchemy 2.0 + Alembic (migrations)
- **Database:** PostgreSQL 16
- **Cache:** Redis 7
- **Object Storage:** MinIO (S3-compatible)
- **Auth:** JWT (access + refresh tokens)
- **Task Queue:** Celery + Redis (background jobs)

### Mobile
- **Framework:** React Native + Expo SDK 52
- **Styling:** NativeWind v4 (Tailwind CSS for React Native)
- **State Management:** Zustand
- **API Client:** Axios + React Query (TanStack Query)
- **Navigation:** Expo Router (file-based routing)
- **Forms:** React Hook Form + Zod validation

### WordPress Integration
- **Custom WP Plugin** untuk sinkronisasi konten
- REST API bridge antara FastAPI dan WordPress
- Shortcodes untuk embed komponen di website

### DevOps & Infrastructure
- **Containerization:** Docker + Docker Compose
- **Reverse Proxy:** Nginx
- **CI/CD:** GitHub Actions
- **Monitoring:** Basic health checks + logging

---

## 3. Monorepo Structure

```
yski-app/
├── backend/                    # FastAPI backend
│   ├── app/
│   │   ├── api/               # API routes (v1/)
│   │   ├── core/              # Config, security, dependencies
│   │   ├── models/            # SQLAlchemy models
│   │   ├── schemas/           # Pydantic schemas
│   │   ├── services/          # Business logic
│   │   ├── repositories/      # Data access layer
│   │   └── utils/             # Helpers
│   ├── alembic/               # Database migrations
│   ├── tests/                 # Backend tests
│   ├── Dockerfile
│   └── requirements.txt
│
├── mobile/                     # React Native + Expo
│   ├── app/                   # Expo Router pages
│   ├── components/            # Reusable UI components
│   ├── hooks/                 # Custom hooks
│   ├── services/              # API client & services
│   ├── stores/                # Zustand stores
│   ├── constants/             # Theme, config
│   ├── assets/                # Images, fonts
│   └── app.json
│
├── wp-plugin/                  # WordPress plugin
│   ├── clicky-foundation/
│   │   ├── includes/          # Plugin logic
│   │   ├── templates/         # Shortcode templates
│   │   └── clicky-foundation.php
│   └── README.md
│
├── mockup/                     # Design mockups & assets
│   └── screens/               # Screen mockups (8 screens)
│
├── docs/                       # Documentation
│   ├── master-plan/           # This directory
│   ├── api/                   # API documentation
│   └── guides/                # Developer guides
│
├── docker-compose.yml          # Local dev environment
├── .github/                    # GitHub Actions workflows
└── README.md
```

---

## 4. High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Mobile App                           │
│              (React Native + Expo SDK 52)                │
│              NativeWind v4 | Expo Router                 │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTPS / REST API
                       ▼
┌─────────────────────────────────────────────────────────┐
│                      Nginx                               │
│              (Reverse Proxy + SSL)                        │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│                    FastAPI                                │
│            (Backend Application Server)                   │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐             │
│  │ Auth/JWT │  │  RBAC    │  │  Services  │             │
│  └──────────┘  └──────────┘  └───────────┘             │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐             │
│  │ Booking  │  │ Payment  │  │ Notif     │             │
│  │ Engine   │  │ Gateway  │  │ Service   │             │
│  └──────────┘  └──────────┘  └───────────┘             │
└───┬──────────────┬──────────────┬───────────────────────┘
    │              │              │
    ▼              ▼              ▼
┌────────┐  ┌──────────┐  ┌──────────┐
│Postgres│  │  Redis   │  │  MinIO   │
│  (DB)  │  │ (Cache)  │  │(Storage) │
└────────┘  └──────────┘  └──────────┘

    ◄──── Sync ────►

┌─────────────────────────────────────────────────────────┐
│              WordPress Website                           │
│         (WP Plugin: clicky-foundation)                   │
│         Shortcodes | REST API Sync                       │
└─────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Mobile App** -> Nginx -> FastAPI -> PostgreSQL (primary data store)
2. **FastAPI** -> Redis (caching, session, rate limiting)
3. **FastAPI** -> MinIO (file uploads: bukti transfer, foto alkes, dll)
4. **FastAPI** <-> WordPress (content sync via WP REST API + custom plugin)
5. **Celery Workers** -> Background tasks (email, push notification, report generation)

---

## 5. Phase Overview

| Phase | Nama | Fokus | Estimasi |
|-------|------|-------|----------|
| **0** | Project Setup & Architecture | Monorepo, Docker, CI/CD skeleton | 1 minggu |
| **1** | Backend Foundation | Auth, RBAC, User management | 2 minggu |
| **2** | Backend Core Features | Booking, Alkes, Donasi, Jemput Zakat | 3 minggu |
| **3** | Mobile App Foundation | Expo setup, design system, navigation, auth | 2 minggu |
| **4** | Mobile Feature Screens | Semua 8 screen mockup diimplementasi | 3 minggu |
| **5** | Advanced Features | Lelang, Financial reports, Notifications | 2 minggu |
| **6** | WordPress Integration | WP plugin, content sync, shortcodes | 1 minggu |
| **7** | QA, Security & Deploy | Testing, hardening, CI/CD pipeline | 2 minggu |
| **8** | Beta Launch | Beta testing, KPI tracking, feedback | 1 minggu |

**Total estimasi: ~17 minggu (4-5 bulan)**

---

## 6. Key Architectural Decisions

### 6.1 Single Armada = 1 Slot

Setiap armada (unit kendaraan pindahan) hanya dapat di-booking untuk **1 slot per waktu**. Ini mencegah double-booking dan menyederhanakan scheduling logic.

- Booking engine menggunakan **optimistic locking** di database level
- Slot check dilakukan dengan query `SELECT ... FOR UPDATE` untuk mencegah race condition
- Calendar view menampilkan ketersediaan armada secara real-time

### 6.2 Pluggable Payment Gateway

Payment gateway didesain dengan **abstraction layer** sehingga mudah menambahkan provider baru:

```python
# Payment gateway abstraction
class PaymentGateway(ABC):
    @abstractmethod
    async def create_payment(self, amount, metadata) -> PaymentResult: ...

    @abstractmethod
    async def check_status(self, transaction_id) -> PaymentStatus: ...

    @abstractmethod
    async def handle_callback(self, payload) -> CallbackResult: ...

# Implementations
class MidtransGateway(PaymentGateway): ...
class ManualTransferGateway(PaymentGateway): ...
# Future: class XenditGateway(PaymentGateway): ...
```

### 6.3 RBAC (Role-Based Access Control)

4 roles dengan **hierarchical permissions**:

```
Admin > Pengurus > Relawan > Sahabat
```

- Permissions disimpan di database, bukan hardcoded
- Middleware FastAPI melakukan role check per-endpoint
- Mobile app menyesuaikan UI berdasarkan role user

### 6.4 Anti Double-Booking Strategy

```
1. User pilih tanggal & armada
2. Backend check availability (SELECT ... WHERE NOT EXISTS)
3. Jika tersedia, lock row (SELECT ... FOR UPDATE)
4. Create booking record
5. Release lock
6. Kirim konfirmasi
```

- Menggunakan database-level locking, bukan application-level
- Booking memiliki status: `pending` -> `confirmed` -> `in_progress` -> `completed` / `cancelled`
- Expired pending bookings otomatis di-cancel oleh Celery scheduled task

### 6.5 File Storage Strategy

- Semua file uploads disimpan di **MinIO** (S3-compatible)
- Presigned URLs untuk upload langsung dari mobile app
- Thumbnails di-generate oleh background worker
- Bucket structure: `donations/`, `equipment/`, `auctions/`, `reports/`

---

## 7. Integration Points

### 7.1 WordPress Integration

Custom WordPress plugin `clicky-foundation`:

- **Content Sync:** Berita dan program dari FastAPI di-push ke WordPress sebagai custom post type
- **Shortcodes:** `[clicky_donation_form]`, `[clicky_financial_report]`, `[clicky_equipment_list]`
- **Webhook:** WordPress mengirim webhook ke FastAPI saat konten diupdate dari WP admin
- **Auth Bridge:** Optional SSO antara WP dan Clicky app

### 7.2 Payment Gateway Abstraction

```
Mobile App
    │
    ▼
FastAPI Payment Service
    │
    ├── Midtrans (primary)
    ├── Manual Transfer (fallback)
    └── [Future providers]
    │
    ▼
Callback Handler -> Update transaction status -> Push notification
```

### 7.3 Push Notifications

- **Expo Push Notifications** untuk mobile app
- Triggered by events: booking confirmed, payment received, pickup scheduled, auction update
- Background processing via Celery worker
- Notification preferences per-user (configurable di settings)

---

## 8. Deployment Architecture

### Docker Compose (Development & Production)

```yaml
services:
  nginx:
    # Reverse proxy, SSL termination
    ports: ["80:80", "443:443"]

  fastapi:
    # Backend application
    build: ./backend
    depends_on: [postgres, redis, minio]

  postgres:
    # Primary database
    image: postgres:16
    volumes: [pg_data:/var/lib/postgresql/data]

  redis:
    # Cache, session store, Celery broker
    image: redis:7-alpine

  minio:
    # Object storage (S3-compatible)
    image: minio/minio
    volumes: [minio_data:/data]

  celery_worker:
    # Background task worker
    build: ./backend
    command: celery -A app.worker worker

  celery_beat:
    # Scheduled tasks
    build: ./backend
    command: celery -A app.worker beat
```

### Environment Configuration

| Service | Port | Keterangan |
|---------|------|------------|
| Nginx | 80/443 | Public-facing |
| FastAPI | 8000 | Internal only (via Nginx) |
| PostgreSQL | 5432 | Internal only |
| Redis | 6379 | Internal only |
| MinIO | 9000/9001 | Console di 9001 |

### Production Considerations

- SSL certificates via Let's Encrypt (certbot)
- Database backups: daily automated pg_dump
- MinIO replication untuk data redundancy
- Log aggregation dan monitoring
- Rate limiting di Nginx level
- Health check endpoints untuk semua services

---

## 9. Development Workflow

1. **Branch Strategy:** `main` (production) <- `develop` <- `feature/*`
2. **PR Review:** Minimal 1 reviewer sebelum merge
3. **Testing:** Unit tests (pytest) + integration tests wajib sebelum merge
4. **Database Changes:** Semua perubahan schema via Alembic migrations
5. **API Documentation:** Auto-generated via FastAPI OpenAPI/Swagger

---

*Dokumen ini adalah living document dan akan di-update seiring perkembangan project.*

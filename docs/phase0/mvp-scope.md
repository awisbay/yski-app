# MVP Scope Definition

## Product Overview

Yayasan Sahabat Khairat (YSKI) mobile application to digitize the foundation's charitable services, including moving assistance, medical equipment lending, donation collection, and zakat pickup.

## MVP (v1.0) - Included Features

### 1. Authentication & User Management
- User registration (email + password)
- Login / logout with JWT tokens
- 4 roles: Admin, Pengurus, Relawan, Sahabat
- Profile management (view and edit own profile)
- Admin user management (CRUD)

### 2. Booking Pindahan (Moving Assistance)
- Sahabat can create a moving booking request
- Single armada model (1 slot = 1 booking per day)
- Pengurus can approve/reject/assign bookings
- Relawan can view assigned bookings and update status
- Basic booking flow: Request -> Approved -> In Progress -> Completed
- Date and address input with notes

### 3. Donasi & Infaq (Online Donations)
- Sahabat can make online donations
- Multiple donation categories (infaq, sedekah, wakaf, dll)
- Manual payment confirmation (upload bukti transfer)
- Pengurus can verify and confirm donations
- Donation history for donors

### 4. Jemput Zakat / Kencleng (Zakat & Charity Box Pickup)
- Sahabat can request zakat pickup at their location
- Sahabat can request kencleng (charity box) pickup
- Pengurus schedules and assigns pickup to Relawan
- Relawan marks pickup as completed with proof photo
- Pickup history and tracking

### 5. Inventaris Alkes (Medical Equipment Inventory)
- List available medical equipment (kursi roda, tongkat, etc.)
- Sahabat can request to borrow equipment
- Pengurus approves/rejects loan requests
- Track loan status (borrowed, returned)
- Basic inventory count

### 6. Berita & Program (News & Programs)
- List of news articles and program announcements
- Pengurus/Admin can create and publish content
- Content with images
- Basic categorization

### 7. Transparansi Keuangan (Financial Transparency)
- Monthly financial summary (income vs expenses)
- Breakdown by category (zakat, infaq, sedekah, operational)
- Public-facing (visible to all roles)
- Basic charts/visualization

## Deferred to Later Phases

### Phase 2-3 (Near-term)
- Push notifications for booking status changes
- Payment gateway integration (Midtrans/Xendit)
- WordPress sync plugin for website

### Phase 4 (Mid-term)
- Advanced analytics and reporting dashboards
- Multi-armada support (multiple vehicles, fleet scheduling)
- Real-time chat between Relawan and Sahabat
- Geolocation tracking for pickups

### Phase 5 (Long-term)
- Lelang Barang (Charity Auction) module
- Social media auto-publish (Instagram, Facebook)
- Advanced financial reporting with export (PDF, Excel)
- Volunteer gamification and leaderboard
- Multi-language support (ID, EN, AR)

## User Roles in MVP

| Role     | Description                              | Key Capabilities                                   |
|----------|------------------------------------------|---------------------------------------------------|
| Admin    | System administrator                     | Full access, user management, system config        |
| Pengurus | Foundation board/staff                   | Manage all services, approve/reject, assign tasks  |
| Relawan  | Volunteer                                | View assigned tasks, update status, upload proofs  |
| Sahabat  | Beneficiary / Donor / Community member   | Request services, make donations, view content     |

## MVP Success Metrics

- Users can register, login, and manage their accounts
- Complete booking pindahan flow from request to completion
- At least one successful online donation with manual confirmation
- Zakat/kencleng pickup flow from request to completion
- Equipment inventory visible and loan request flow works
- News and program content is publishable and viewable
- Financial summary page shows basic transparency data

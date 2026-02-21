# YSKI Website Dashboard — Implementation Plan & Progress Tracker

> **Purpose**: Reference document for the full dashboard implementation. Use this if the conversation runs out of tokens or needs to be resumed.

---

## Current Status (as of last update)

| Phase | Status |
|---|---|
| Phase 1: DB Migrations | ✅ DONE |
| Phase 2: Backend API Additions | ✅ DONE |
| Phase 3: Website Scaffold | ✅ DONE (Next.js created, packages pending) |
| Phase 4: Core Layout & Auth | ⏳ IN PROGRESS |
| Phase 5: Dashboard Pages | ⏳ PENDING |
| Phase 6: Shared UI Components | ⏳ PENDING |

---

## Phase 1: Database Migrations ✅ DONE

### Migration 011 — `last_login_at` to users
- **File created**: `backend/alembic/versions/011_user_last_login.py`
- **Model updated**: `backend/app/models/user.py` — added `last_login_at: Optional[datetime]`
- **Schema updated**: `backend/app/schemas/user.py` — added `last_login_at` to `UserResponse`, added `UserRoleUpdate`

### Migration 012 — Content enhancements (news_articles)
- **File created**: `backend/alembic/versions/012_content_enhancements.py`
- **Model updated**: `backend/app/models/content.py` — added `status`, `scheduled_at`, `reviewed_by`, `reviewed_at`, `rejection_reason`, `meta_title`, `meta_description`, `tags` to `NewsArticle`
- **Schema updated**: `backend/app/schemas/content.py` — added new fields to `NewsUpdate`, `NewsResponse`; added `NewsReject` schema

**To apply migrations**: `cd backend && alembic upgrade head`

---

## Phase 2: Backend API Additions ✅ DONE

### 2.1 Auth endpoint updated
- **File**: `backend/app/api/v1/auth/routes.py`
- Sets `user.last_login_at = datetime.now(timezone.utc)` on successful login

### 2.2 User Management endpoints added
- **File**: `backend/app/api/v1/users/routes.py`
- Added: `GET /users/export` (CSV streaming)
- Added: `PUT /users/{id}/role` (change role, admin only)
- Added: `POST /users/{id}/deactivate` (soft delete, admin only)
- Added: `POST /users/{id}/activate` (reactivate, admin only)
- Added: `POST /users/{id}/reset-password` (trigger email reset, admin only)
- Updated: `GET /users` and `GET /users/{id}` now accept `admin` OR `pengurus`
- **Service updated**: `backend/app/services/user.py` — `list()` now accepts `is_active` filter

### 2.3 Dashboard metrics endpoints (NEW FILE)
- **File created**: `backend/app/api/v1/dashboard.py`
- `GET /api/v1/dashboard/overview` — totals + donation trend + bookings by status
- `GET /api/v1/dashboard/users/metrics` — by role, active/inactive, signups per month
- `GET /api/v1/dashboard/donations/metrics` — by type, monthly trend, totals
- `GET /api/v1/dashboard/auctions/metrics` — by status, total sold value
- `GET /api/v1/dashboard/bookings/metrics` — by status, weekly trend
- `GET /api/v1/dashboard/equipment/metrics` — by category/condition, loan breakdown
- **Router updated**: `backend/app/api/v1/router.py` — registered dashboard router

### 2.4 Content approval endpoints added
- **File**: `backend/app/api/v1/content/routes.py`
- Added: `POST /content/news/{id}/submit` — submit draft for review
- Added: `POST /content/news/{id}/approve` — approve pending article
- Added: `POST /content/news/{id}/reject` — reject with reason body `{ "reason": "..." }`
- Updated: `PATCH /content/news/{id}/publish` — now toggles publish/unpublish
- Added: `POST /content/programs/{id}/publish` — toggle program active/hidden
- Updated: `GET /content/news` — now accepts optional `news_status` query param
- **Service updated**: `backend/app/services/content.py` — `list_news()` accepts `news_status`, added `toggle_publish_news()`

---

## Phase 3: Website Scaffold ✅ DONE

- **Directory**: `yski-app/website/`
- Created with: `npx create-next-app@latest website --typescript --tailwind --app`
- Next step: install additional packages

### Package Installation (TODO if not done)

```bash
cd website

# Core dependencies
npm install axios zustand @tanstack/react-query @tanstack/react-table
npm install react-hook-form @hookform/resolvers zod
npm install recharts lucide-react date-fns xlsx
npm install sonner

# shadcn/ui
npx shadcn@latest init
# Select: Default style, Zinc base color, yes CSS variables

# shadcn components
npx shadcn@latest add button card dialog table form badge sheet tabs select input textarea dropdown-menu toast avatar separator skeleton alert
```

---

## Phase 4: Core Files to Create

### Directory structure to build:
```
website/
├── app/
│   ├── (auth)/login/page.tsx
│   ├── (dashboard)/layout.tsx        ← role guard + sidebar
│   ├── (dashboard)/page.tsx          ← overview
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── layout/Sidebar.tsx
│   ├── layout/Topbar.tsx
│   ├── data-table/DataTable.tsx
│   ├── data-table/DataTableToolbar.tsx
│   ├── data-table/DataTablePagination.tsx
│   ├── charts/MetricCard.tsx
│   ├── charts/AreaChart.tsx
│   ├── charts/BarChart.tsx
│   ├── charts/DonutChart.tsx
│   └── shared/
│       ├── StatusBadge.tsx
│       ├── ConfirmDialog.tsx
│       └── ExportButton.tsx
├── hooks/
│   ├── useAuth.ts
│   └── useTable.ts
├── lib/
│   ├── api.ts                         ← axios + interceptors
│   ├── utils.ts                       ← cn(), formatCurrency(), formatDate()
│   └── export.ts                      ← xlsx helpers
├── stores/
│   └── authStore.ts                   ← Zustand auth store
├── types/
│   └── index.ts                       ← API response types
└── middleware.ts                      ← Next.js role guard middleware
```

### Key file specs:

#### `stores/authStore.ts`
```typescript
// Zustand store with:
// - user: { id, email, full_name, role, avatar_url } | null
// - accessToken: string | null
// - refreshToken: string | null
// - setAuth(user, access, refresh): void
// - clearAuth(): void
// - isAuthenticated: boolean (derived)
// - can(action, resource): boolean  ← role-based checks
```

#### `lib/api.ts`
```typescript
// Axios instance with baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
// Request interceptor: attach Authorization: Bearer {accessToken} from authStore
// Response interceptor: on 401, attempt refresh then retry; on failure, clearAuth + redirect /login
```

#### `middleware.ts`
```typescript
// Reads token from cookie 'access_token'
// Decodes JWT role — if not admin/pengurus → redirect /login?error=access_denied
// Protects all routes except /login
```

#### `app/(auth)/login/page.tsx`
```typescript
// React Hook Form + Zod
// Schema: { email: string, password: string }
// On submit: POST /auth/login
// Validate role is admin or pengurus — show "Akses ditolak" if not
// On success: save tokens + user → redirect /
```

---

## Phase 5: Dashboard Pages

### 5.1 Overview Dashboard (`/`)
**API**: `GET /dashboard/overview`
**Components**: 6x MetricCard, AreaChart (donation trend), BarChart (bookings by status)

### 5.2 User Management (`/users`, `/users/[id]`)
**APIs**: `GET /users`, `GET /users/{id}`, `PUT /users/{id}`, `PUT /users/{id}/role`, `POST /users/{id}/deactivate`, `POST /users/{id}/activate`, `POST /users/{id}/reset-password`, `GET /users/export`
**APIs (metrics)**: `GET /dashboard/users/metrics`

### 5.3 Donation Management (`/donations`, `/donations/[id]`)
**APIs**: `GET /donations`, `GET /donations/{id}`, `POST /donations/{id}/verify` (if exists)
**APIs (metrics)**: `GET /dashboard/donations/metrics`

### 5.4 Auction Management (`/auctions`, `/auctions/new`, `/auctions/[id]`)
**APIs**: `GET /auctions`, `GET /auctions/{id}`, `POST /auctions`, `PUT /auctions/{id}`, `DELETE /auctions/{id}`, `PUT /auctions/{id}/bids/{bid_id}/approve`, `PUT /auctions/{id}/bids/{bid_id}/reject`
**APIs (metrics)**: `GET /dashboard/auctions/metrics`

### 5.5 Booking Management (`/bookings`, `/bookings/[id]`)
**APIs**: `GET /bookings`, `GET /bookings/{id}`, approve/reject endpoints
**APIs (metrics)**: `GET /dashboard/bookings/metrics`

### 5.6 Equipment Management (`/equipment`, `/equipment/new`, `/equipment/[id]`)
**APIs**: `GET /equipment`, `GET /equipment/{id}`, `POST /equipment`, `PUT /equipment/{id}`, equipment loan approve/reject
**APIs (metrics)**: `GET /dashboard/equipment/metrics`

### 5.7 Finance Management (`/finance`, `/finance/[id]`)
**APIs**: `GET /financial/reports`, `GET /financial/reports/{id}`, `POST /financial/reports`, `POST /financial/reports/{id}/entries`

### 5.8 Content Management (`/content`, `/content/news/*`, `/content/programs/*`)
**APIs**: All `/content/news` and `/content/programs` endpoints including submit/approve/reject/publish

---

## Phase 6: Design Principles

### Color Scheme
- Primary: `emerald` (Tailwind) — `emerald-600` for buttons, `emerald-50` for backgrounds
- Text: `gray-900`, `gray-600`, `gray-400`
- Status badge colors:
  - `pending` / `pending_review` → `yellow-100 text-yellow-800`
  - `approved` / `active` / `published` → `green-100 text-green-800`
  - `rejected` / `cancelled` → `red-100 text-red-800`
  - `completed` / `sold` / `paid` → `blue-100 text-blue-800`
  - `in_progress` / `borrowed` → `orange-100 text-orange-800`
  - `draft` → `gray-100 text-gray-600`

### Role Permissions
```typescript
// can() helper
const permissions = {
  admin: {
    users: ['view', 'edit', 'delete', 'change_role', 'deactivate'],
    content: ['view', 'create', 'edit', 'delete', 'approve', 'publish'],
    donations: ['view', 'verify'],
    auctions: ['view', 'create', 'edit', 'delete', 'approve_bid'],
    bookings: ['view', 'approve', 'reject', 'assign'],
    equipment: ['view', 'create', 'edit', 'delete', 'approve_loan'],
    finance: ['view', 'create', 'edit', 'publish'],
  },
  pengurus: {
    users: ['view'],
    content: ['view', 'create', 'edit', 'approve', 'publish'],
    donations: ['view', 'verify'],
    auctions: ['view', 'approve_bid'],
    bookings: ['view', 'approve', 'reject', 'assign'],
    equipment: ['view', 'approve_loan'],
    finance: ['view'],
  },
}
```

---

## Environment Variables

### Backend (`.env`)
```
DATABASE_URL=postgresql+asyncpg://yski:changeme@localhost:5432/yski_db
JWT_SECRET_KEY=your-secret-key
...
```

### Website (`.env.local`)
```
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

---

## Quick Commands

```bash
# Apply DB migrations
cd backend && alembic upgrade head

# Start backend
cd backend && uvicorn app.main:app --reload --port 8000

# Start website dev server
cd website && npm run dev

# Install website packages (if not done)
cd website && npm install axios zustand @tanstack/react-query @tanstack/react-table react-hook-form @hookform/resolvers zod recharts lucide-react date-fns xlsx sonner

# Initialize shadcn/ui (if not done)
cd website && npx shadcn@latest init
cd website && npx shadcn@latest add button card dialog table form badge sheet tabs select input textarea dropdown-menu avatar separator skeleton alert
```

---

## Files Changed / Created (Backend)

| File | Action |
|---|---|
| `backend/alembic/versions/011_user_last_login.py` | Created |
| `backend/alembic/versions/012_content_enhancements.py` | Created |
| `backend/app/models/user.py` | Modified (added `last_login_at`) |
| `backend/app/models/content.py` | Modified (added 8 new columns to NewsArticle) |
| `backend/app/schemas/user.py` | Modified (added `UserRoleUpdate`, `last_login_at` in `UserResponse`) |
| `backend/app/schemas/content.py` | Modified (added new fields, `NewsReject`) |
| `backend/app/api/v1/auth/routes.py` | Modified (set `last_login_at` on login) |
| `backend/app/api/v1/users/routes.py` | Modified (added 5 new endpoints + export) |
| `backend/app/services/user.py` | Modified (`list()` accepts `is_active`) |
| `backend/app/api/v1/dashboard.py` | Created (6 metrics endpoints) |
| `backend/app/api/v1/router.py` | Modified (registered dashboard router) |
| `backend/app/api/v1/content/routes.py` | Modified (added submit/approve/reject/publish) |
| `backend/app/services/content.py` | Modified (added `toggle_publish_news`, updated `list_news`) |

---

## Next Steps When Resuming

1. **Install website packages** (see Phase 3 package installation commands above)
2. **Initialize shadcn/ui** in `website/`
3. **Create core website files** in this order:
   - `website/types/index.ts`
   - `website/stores/authStore.ts`
   - `website/lib/api.ts`
   - `website/lib/utils.ts`
   - `website/lib/export.ts`
   - `website/middleware.ts`
   - `website/app/layout.tsx` (root)
   - `website/app/globals.css`
   - `website/app/(auth)/login/page.tsx`
   - `website/components/layout/Sidebar.tsx`
   - `website/components/layout/Topbar.tsx`
   - `website/app/(dashboard)/layout.tsx`
   - Shared components (StatusBadge, ConfirmDialog, ExportButton)
   - Chart components (MetricCard, AreaChart, BarChart, DonutChart)
   - DataTable components
4. **Build dashboard pages** in order listed in Phase 5

---

## Notes

- The existing mobile app uses the same backend — do not break existing mobile endpoints
- `is_published` boolean stays in `news_articles` for mobile backwards-compatibility
- New `status` field drives the web dashboard publishing workflow
- Dashboard routes (`/api/v1/dashboard/*`) are protected by `require_role("admin", "pengurus")`
- Website middleware reads JWT from cookie `access_token` (set at login for SSR compatibility)

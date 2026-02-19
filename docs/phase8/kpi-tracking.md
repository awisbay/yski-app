# Phase 8: KPI Tracking Specification

> Metrik dan mekanisme pelacakan untuk beta dan post-launch.

---

## 1. KPI Categories

### 1.1 User Acquisition & Retention

| Metric | Definition | Query / Source | Target |
|--------|-----------|---------------|--------|
| Total Registrations | Total users in system | `SELECT COUNT(*) FROM users WHERE is_active = true` | 50+ (beta) |
| Daily Active Users (DAU) | Unique users with API calls per day | API access logs (unique user_id per day) | 15+ |
| Weekly Active Users (WAU) | Unique users with API calls per week | API access logs | 30+ |
| Monthly Active Users (MAU) | Unique users with API calls per month | API access logs | 40+ |
| Day-1 Retention | % users active 1 day after register | Users active D+1 / registered D+0 | >60% |
| Day-7 Retention | % users active 7 days after register | Users active D+7 / registered D+0 | >40% |
| Day-30 Retention | % users active 30 days after register | Users active D+30 / registered D+0 | >25% |
| Churn Rate | % users inactive for 14+ days | Inactive users / total users | <30% |

### 1.2 Feature Adoption

| Feature | Metric | Query | Target (Weekly) |
|---------|--------|-------|-----------------|
| **Booking** | Bookings created | `SELECT COUNT(*) FROM moving_bookings WHERE created_at > NOW() - INTERVAL '7 days'` | 5+ |
| **Booking** | Booking completion rate | Completed / (Created - Cancelled) | >70% |
| **Booking** | Average rating | `SELECT AVG(rating) FROM moving_bookings WHERE rating IS NOT NULL` | ≥4.0 |
| **Donation** | Donations count | `SELECT COUNT(*) FROM donations WHERE created_at > NOW() - INTERVAL '7 days'` | 10+ |
| **Donation** | Total donation amount | `SELECT SUM(amount) FROM donations WHERE payment_status = 'paid'` | Track |
| **Donation** | Donation completion rate | Paid / Created | >50% |
| **Pickup** | Pickup requests | `SELECT COUNT(*) FROM pickup_requests WHERE created_at > NOW() - INTERVAL '7 days'` | 3+ |
| **Pickup** | Pickup completion rate | Completed / Created | >70% |
| **Equipment** | Loan requests | `SELECT COUNT(*) FROM equipment_loans WHERE created_at > NOW() - INTERVAL '7 days'` | 3+ |
| **Equipment** | Loan return rate | Returned / (Active + Overdue) | >80% |
| **Auction** | Bids placed | `SELECT COUNT(*) FROM auction_bids WHERE created_at > NOW() - INTERVAL '7 days'` | 5+ |
| **Auction** | Average bids per item | `SELECT AVG(bid_count) FROM ...` | 3+ |
| **Financial** | Report views | API access log for `/financial/reports` | 10+ |
| **Notifications** | Read rate | `SELECT COUNT(*) WHERE is_read = true / total` | >50% |

### 1.3 Technical Performance

| Metric | Definition | Source | Target |
|--------|-----------|--------|--------|
| API Uptime | % time API responds to health check | UptimeRobot | >99.5% |
| Response Time (p50) | Median API response time | Application logs | <100ms |
| Response Time (p95) | 95th percentile response time | Application logs | <500ms |
| Error Rate | % of 5xx responses | Nginx logs | <1% |
| Crash-Free Rate | % sessions without crash | Sentry / Expo | >99% |
| Push Delivery Rate | % push notifications delivered | Expo push receipts | >90% |
| Database Query Time (p95) | 95th percentile query time | Slow query log | <100ms |
| Memory Usage | Peak memory per container | Docker stats | <512MB |

### 1.4 Business Impact

| Metric | Definition | Target |
|--------|-----------|--------|
| Total Funds Raised | Sum of paid donations + auction revenue | Track (no target for beta) |
| Equipment Utilization | Active loans / total equipment | Track |
| Volunteer Engagement | Relawan with completed tasks per week | Track |
| Content Engagement | News article views per week | Track |
| Transparency Score | Published financial reports | 1+ per month |

---

## 2. Data Collection Methods

### 2.1 Database Queries (Primary)

Most KPIs are derived from existing database tables:

```sql
-- Daily KPI snapshot (run via Celery Beat, daily at 23:59)
INSERT INTO kpi_snapshots (date, metric, value)
VALUES
  (CURRENT_DATE, 'total_users', (SELECT COUNT(*) FROM users WHERE is_active = true)),
  (CURRENT_DATE, 'dau', (SELECT COUNT(DISTINCT user_id) FROM api_access_log WHERE date = CURRENT_DATE)),
  (CURRENT_DATE, 'bookings_today', (SELECT COUNT(*) FROM moving_bookings WHERE DATE(created_at) = CURRENT_DATE)),
  (CURRENT_DATE, 'donations_today', (SELECT COUNT(*) FROM donations WHERE DATE(created_at) = CURRENT_DATE)),
  (CURRENT_DATE, 'donation_amount_today', (SELECT COALESCE(SUM(amount), 0) FROM donations WHERE DATE(created_at) = CURRENT_DATE AND payment_status = 'paid'));
```

### 2.2 API Access Logging

Middleware that logs each authenticated API call:

```python
@app.middleware("http")
async def log_api_access(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    duration = (time.time() - start) * 1000

    if hasattr(request.state, 'user_id'):
        logger.info("api_access", extra={
            "user_id": request.state.user_id,
            "method": request.method,
            "path": request.url.path,
            "status": response.status_code,
            "duration_ms": round(duration, 2),
        })

    return response
```

### 2.3 External Services

| Service | Metrics Collected |
|---------|------------------|
| UptimeRobot | Uptime percentage, response time |
| Sentry | Crash reports, error tracking |
| Expo | Push notification delivery receipts |

---

## 3. KPI Dashboard

### Admin Dashboard Endpoint

```python
@router.get("/api/v1/admin/kpi")
async def get_kpi_dashboard(
    period: str = "week",  # day, week, month
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    return {
        "period": period,
        "users": {
            "total": ...,
            "new": ...,
            "active": ...,
        },
        "bookings": {
            "total": ...,
            "completed": ...,
            "pending": ...,
            "completion_rate": ...,
        },
        "donations": {
            "count": ...,
            "total_amount": ...,
            "by_type": [...],
        },
        "pickups": {
            "total": ...,
            "completed": ...,
        },
        "equipment": {
            "active_loans": ...,
            "overdue": ...,
        },
        "auctions": {
            "active": ...,
            "total_bids": ...,
        },
        "technical": {
            "uptime": ...,
            "avg_response_ms": ...,
            "error_rate": ...,
        }
    }
```

### Mobile Admin Dashboard

The admin screen at `/(admin)/index.tsx` displays:

```
┌─────────────────────────────┐
│ 📊 Dashboard Clicky         │
│ Periode: Minggu ini ▼       │
├─────────────────────────────┤
│ ┌──────┐ ┌──────┐ ┌──────┐│
│ │  52  │ │  15  │ │  8   ││
│ │Users │ │ DAU  │ │ New  ││
│ └──────┘ └──────┘ └──────┘│
├─────────────────────────────┤
│ Booking: 12 (8 selesai)    │
│ ████████░░ 67%              │
│                             │
│ Donasi: Rp 2.500.000       │
│ 15 transaksi                │
│                             │
│ Jemput: 5 (4 selesai)      │
│ ████████░ 80%               │
│                             │
│ Alkes: 6 aktif, 1 overdue  │
│ Lelang: 3 aktif, 12 bids   │
├─────────────────────────────┤
│ 🟢 API: 99.8% uptime       │
│ ⚡ Avg response: 85ms       │
│ ❌ Error rate: 0.3%         │
└─────────────────────────────┘
```

---

## 4. Weekly Report Template

```markdown
# Yayasan Sahabat Khairat Indonesia - Laporan Mingguan

## Periode: [Tanggal Mulai] - [Tanggal Selesai]

### Ringkasan
| Metrik | Minggu Ini | Minggu Lalu | Trend |
|--------|-----------|-------------|-------|
| Pengguna Aktif | 25 | 18 | ↑ 39% |
| Booking Baru | 8 | 5 | ↑ 60% |
| Total Donasi | Rp 1.200.000 | Rp 800.000 | ↑ 50% |
| Jemput Zakat | 4 | 3 | ↑ 33% |
| Pinjam Alkes | 3 | 2 | ↑ 50% |
| Crash-Free Rate | 99.5% | 99.2% | ↑ |

### Highlights
- [Notable achievement or event]
- [User feedback theme]

### Issues
- [Open P0/P1 bugs]
- [Infrastructure concerns]

### Action Items
- [ ] [Next steps for coming week]
```

---

## 5. KPI Review Schedule

| Frequency | Audience | Focus |
|-----------|----------|-------|
| Daily | Developer team | Crash reports, error logs, P0 bugs |
| Weekly | Project team | All KPIs, user feedback, iteration plan |
| Monthly | Stakeholders | Business impact, adoption trends, roadmap |

---

*Last updated: 2026-02-18*

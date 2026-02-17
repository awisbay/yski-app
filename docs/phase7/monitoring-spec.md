# Phase 7: Monitoring & Logging Specification

> Observability stack for the Clicky Foundation production environment.

---

## 1. Health Check Endpoints

### FastAPI Health Endpoints

| Endpoint | Method | Response | Purpose |
|----------|--------|----------|---------|
| `/health` | GET | `{"status": "ok", "version": "1.0.0"}` | Application liveness |
| `/health/db` | GET | `{"status": "ok", "latency_ms": 5}` | PostgreSQL connectivity |
| `/health/redis` | GET | `{"status": "ok", "latency_ms": 2}` | Redis connectivity |
| `/health/minio` | GET | `{"status": "ok", "buckets": ["uploads"]}` | MinIO connectivity |
| `/health/ready` | GET | `{"status": "ok", "services": {...}}` | Full readiness check |

### Docker Compose Health Checks

```yaml
services:
  fastapi:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 15s

  postgres:
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U clicky"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  minio:
    healthcheck:
      test: ["CMD", "mc", "ready", "local"]
      interval: 30s
      timeout: 10s
      retries: 3
```

---

## 2. Structured Logging

### Log Format (JSON)

```json
{
  "timestamp": "2026-02-18T10:30:00.000Z",
  "level": "INFO",
  "logger": "app.api.bookings",
  "message": "Booking created successfully",
  "request_id": "req-abc123",
  "user_id": "uuid-...",
  "method": "POST",
  "path": "/api/v1/bookings",
  "status_code": 201,
  "duration_ms": 45,
  "ip": "203.0.113.50",
  "user_agent": "ClickyApp/1.0"
}
```

### Log Levels by Environment

| Level | Development | Staging | Production |
|-------|------------|---------|------------|
| DEBUG | Yes | Yes | No |
| INFO | Yes | Yes | Yes |
| WARNING | Yes | Yes | Yes |
| ERROR | Yes | Yes | Yes |
| CRITICAL | Yes | Yes | Yes |

### What to Log

| Event | Level | Fields |
|-------|-------|--------|
| Request received | INFO | method, path, ip, user_agent |
| Request completed | INFO | method, path, status_code, duration_ms |
| Authentication success | INFO | user_id, method (login/refresh) |
| Authentication failure | WARNING | ip, email_attempted, reason |
| Authorization denied | WARNING | user_id, role, resource, action |
| Booking created | INFO | booking_id, user_id, date, slot |
| Booking conflict (double-booking) | WARNING | date, slot, user_id |
| Donation created | INFO | donation_id, amount, type |
| Auction bid placed | INFO | auction_id, bidder_id, amount |
| Bid rejected (below minimum) | WARNING | auction_id, bidder_id, amount, min_required |
| File upload | INFO | user_id, file_type, file_size, bucket |
| Database error | ERROR | query_context, error_message |
| External API call (WP, payment) | INFO | service, endpoint, status, duration_ms |
| Celery task started | INFO | task_name, args |
| Celery task completed | INFO | task_name, duration_ms, result_summary |
| Celery task failed | ERROR | task_name, error_message, traceback |
| Push notification sent | INFO | user_id, notification_type, expo_response |
| Push notification failed | ERROR | user_id, error_message |

### What NOT to Log

- Passwords, tokens, API keys
- Full request/response bodies (only in DEBUG mode)
- Personal data beyond user_id (email, phone, address)
- Credit card or payment details
- MinIO presigned URLs (contain signatures)

---

## 3. Log Management

### Log Rotation

```
# /etc/logrotate.d/clicky-foundation
/var/log/clicky/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    postrotate
        docker compose -f /opt/clicky-foundation/docker-compose.yml restart fastapi
    endscript
}
```

### Log Storage

| Environment | Storage | Retention |
|------------|---------|-----------|
| Development | stdout (Docker logs) | Session only |
| Staging | File + Docker logs | 7 days |
| Production | File + centralized (optional) | 30 days |

### Centralized Logging (Optional)

For production scale, consider:
- **Loki + Grafana** — lightweight, works well with Docker
- **AWS CloudWatch** — if deployed on AWS
- **Datadog** — comprehensive but paid

---

## 4. Error Alerting

### Alert Channels

| Channel | Severity | Response Time |
|---------|----------|---------------|
| Telegram Bot | Critical, Error | Immediate |
| Email | Warning, Summary | Within 1 hour |
| Dashboard | All | Async review |

### Telegram Bot Integration

```python
# Alert service
import httpx

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID")

async def send_alert(title: str, message: str, severity: str = "error"):
    """Send alert to Telegram group."""
    emoji = {"critical": "🔴", "error": "🟠", "warning": "🟡", "info": "🔵"}
    text = f"{emoji.get(severity, '⚪')} *{title}*\n\n{message}\n\n🕐 {datetime.now().isoformat()}"

    await httpx.AsyncClient().post(
        f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage",
        json={
            "chat_id": TELEGRAM_CHAT_ID,
            "text": text,
            "parse_mode": "Markdown"
        }
    )
```

### Alert Rules

| Alert | Condition | Severity | Cooldown |
|-------|-----------|----------|----------|
| Service Down | Health check fails 3x in a row | Critical | 5 min |
| High Error Rate | >10 5xx errors in 5 minutes | Error | 10 min |
| Database Down | DB health check fails | Critical | 5 min |
| Redis Down | Redis health check fails | Error | 5 min |
| Deployment Failed | CI/CD deploy step fails | Error | None |
| Slow Response | p95 > 2s for 5 minutes | Warning | 15 min |
| Disk Space Low | >85% usage | Warning | 1 hour |
| Disk Space Critical | >95% usage | Critical | 15 min |
| Backup Failed | Backup script exits non-zero | Error | None |
| WP Sync Failed | 3 consecutive sync failures | Warning | 1 hour |
| SSL Certificate Expiry | <14 days to expiry | Warning | 1 day |

### Alert Deduplication
- Same alert not re-sent within cooldown period
- Alert "resolved" notification when issue clears
- Daily summary email with all warnings/errors from past 24h

---

## 5. External Uptime Monitoring

### Recommended: UptimeRobot (Free Tier)

| Monitor | URL | Interval | Alert |
|---------|-----|----------|-------|
| API Health | `https://api.clicky.or.id/health` | 5 min | Telegram + Email |
| API Ready | `https://api.clicky.or.id/health/ready` | 5 min | Telegram |
| Website | `https://www.sahabatkhairat.or.id` | 5 min | Email |
| MinIO Console | `https://storage.clicky.or.id/minio/health/live` | 15 min | Telegram |

---

## 6. Application Metrics (Optional)

### Key Metrics to Track

| Category | Metric | Collection Method |
|----------|--------|-------------------|
| **Traffic** | Requests per minute | Nginx access log |
| **Traffic** | Active users (DAU/MAU) | Database query (cron) |
| **Performance** | API response time (p50, p95, p99) | Middleware timer |
| **Performance** | Database query time | SQLAlchemy event listener |
| **Errors** | 4xx rate per endpoint | Middleware counter |
| **Errors** | 5xx rate per endpoint | Middleware counter |
| **Business** | Bookings per day | Database query |
| **Business** | Donations per day / total amount | Database query |
| **Business** | Active auctions | Database query |
| **Business** | Equipment loan rate | Database query |
| **System** | CPU usage | Docker stats |
| **System** | Memory usage per container | Docker stats |
| **System** | Disk usage | `df -h` |
| **System** | PostgreSQL connections | `pg_stat_activity` |
| **System** | Redis memory | `INFO memory` |

### Simple Metrics Endpoint

```python
@router.get("/metrics")
async def get_metrics(db: AsyncSession = Depends(get_db)):
    """Simple metrics for admin dashboard."""
    return {
        "users": {
            "total": await count_users(db),
            "active_today": await count_active_today(db),
        },
        "bookings": {
            "pending": await count_bookings_by_status(db, "pending"),
            "today": await count_bookings_today(db),
        },
        "donations": {
            "total_amount": await sum_donations(db),
            "today_count": await count_donations_today(db),
        },
        "system": {
            "uptime_seconds": time.time() - app_start_time,
            "version": settings.APP_VERSION,
        }
    }
```

---

## 7. Dashboard (Admin)

### Admin Dashboard Metrics

The admin panel at `/(admin)/index.tsx` should display:

| Section | Metrics |
|---------|---------|
| Overview | Total users, new users today, active sessions |
| Bookings | Pending, today's bookings, completion rate |
| Donations | Total amount, today's donations, top programs |
| Equipment | Total items, active loans, overdue loans |
| Auctions | Active auctions, total bids today, revenue |
| System | API status, last sync, error count |

---

*Last updated: 2026-02-18*

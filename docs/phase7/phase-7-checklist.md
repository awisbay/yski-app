# Phase 7: QA, Security, Performance & Deploy - Checklist

**Objective:** Memastikan aplikasi siap production dengan kualitas, keamanan, dan performa terjamin. Setup CI/CD pipeline dan monitoring untuk deployment.

**Estimated Duration:** 2 minggu

**Prerequisite:** Phase 6 (WordPress Integration) selesai.

---

## Backend Testing (Pytest)

### Unit Tests
- [ ] Auth service tests: register, login, refresh, logout
- [ ] User service tests: CRUD, search, pagination
- [ ] Booking service tests: create, slots, approve, reject, cancel
- [ ] Booking anti-double-booking test: concurrent requests
- [ ] Equipment service tests: CRUD, stock management
- [ ] Equipment loan tests: request, approve, return, overdue
- [ ] Donation service tests: create, verify, summary
- [ ] Pickup service tests: create, schedule, complete
- [ ] Content service tests: programs CRUD, news CRUD
- [ ] Auction service tests: create, bid, activate, auto-close
- [ ] Auction bid validation: min increment, self-bid prevention, expired auction
- [ ] Financial service tests: report create, aggregate, dashboard
- [ ] Notification service tests: create, mark read, push token
- [ ] RBAC tests: permission checks per role
- [ ] JWT tests: token generation, validation, refresh, expiry

### Integration Tests
- [ ] Auth flow end-to-end: register → login → access protected → refresh → logout
- [ ] Booking flow: create → approve → assign → in_progress → complete → rate
- [ ] Donation flow: create → upload proof → verify
- [ ] Pickup flow: request → schedule → assign → in_progress → complete
- [ ] Equipment loan flow: request → approve → active → return
- [ ] Auction flow: create → activate → bid → auto-close → winner
- [ ] Financial flow: create report → add entries → generate → publish
- [ ] Notification delivery: event trigger → notification created → push sent
- [ ] RBAC integration: admin, pengurus, relawan, sahabat access levels
- [ ] File upload integration: MinIO upload → URL stored → accessible

### Database Tests
- [ ] Migration up/down tests (Alembic)
- [ ] Concurrent booking creation (race condition test)
- [ ] Concurrent auction bidding (race condition test)
- [ ] Equipment stock calculation accuracy
- [ ] Cascading deletes / soft delete behavior
- [ ] Index performance verification (EXPLAIN ANALYZE)

### Coverage Target
- [ ] Overall coverage: ≥ 80%
- [ ] Auth module: ≥ 90%
- [ ] Booking module: ≥ 85%
- [ ] Generate HTML coverage report: `pytest --cov=app --cov-report=html`

---

## Mobile Testing

### Component Tests (Jest + React Native Testing Library)
- [ ] Button component: all variants, disabled state, onPress
- [ ] Input component: text input, validation error display
- [ ] Card component: rendering with props
- [ ] Badge component: status variants
- [ ] Header component: title, back button
- [ ] LoadingSpinner and Skeleton components
- [ ] EmptyState component: with/without action
- [ ] BottomSheet component: open/close

### Screen Tests
- [ ] Login screen: form validation, submit, error handling
- [ ] Register screen: form validation, submit
- [ ] Home screen: data loading, pull-to-refresh
- [ ] Booking list: loading, empty state, list rendering
- [ ] Booking form: step navigation, validation, submit
- [ ] Donation list: loading, filtering
- [ ] Donation form: amount selection, payment method, submit
- [ ] Pickup list: status filtering
- [ ] Equipment list: category filtering, availability
- [ ] Auction list: active items, bidding
- [ ] Financial report: chart rendering, report list
- [ ] Notification list: read/unread, mark as read
- [ ] Profile screen: edit, logout

### Hook Tests
- [ ] useAuth: login, register, logout, token refresh
- [ ] useBookings: fetch list, create, mutations
- [ ] useDonations: fetch list, create
- [ ] useEquipment: fetch list, loan request
- [ ] usePickups: fetch list, create
- [ ] useNotifications: fetch, mark read, unread count

### Navigation Tests
- [ ] Auth guard: unauthenticated → redirect to login
- [ ] Auth guard: authenticated → access tabs
- [ ] Tab navigation: all tabs accessible
- [ ] Deep link: booking detail, donation detail
- [ ] Back navigation: correct screen stack
- [ ] Admin route: only admin/pengurus can access

---

## Security Hardening

### Input Validation
- [ ] All API endpoints validate input via Pydantic schemas
- [ ] File upload validation: type whitelist (jpeg, png, pdf), max size (5MB)
- [ ] File content validation: magic bytes check (not just extension)
- [ ] SQL injection: all queries use SQLAlchemy ORM (no raw SQL)
- [ ] Path traversal: file paths sanitized for MinIO uploads

### Authentication & Authorization
- [ ] JWT access token expiry: 15 minutes
- [ ] JWT refresh token expiry: 7 days
- [ ] Refresh token rotation: old token invalidated on refresh
- [ ] Token blacklist in Redis: logout invalidates tokens
- [ ] Password hashing: bcrypt with 12 rounds
- [ ] Rate limiting on auth endpoints:
  - [ ] Login: 5 attempts per minute per IP
  - [ ] Register: 3 attempts per hour per IP
  - [ ] Password reset: 3 attempts per hour per email
- [ ] RBAC enforced on all protected endpoints
- [ ] No sensitive data in JWT payload (only user_id, role, exp)

### HTTP Security Headers (Nginx)
- [ ] `X-Content-Type-Options: nosniff`
- [ ] `X-Frame-Options: DENY`
- [ ] `X-XSS-Protection: 1; mode=block`
- [ ] `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- [ ] `Content-Security-Policy: default-src 'self'`
- [ ] `Referrer-Policy: strict-origin-when-cross-origin`
- [ ] Remove `Server` header (hide Nginx version)

### CORS Configuration
- [ ] Whitelist specific origins only (no wildcard `*`)
- [ ] Allowed origins: mobile app scheme, admin dashboard domain
- [ ] Credentials enabled for authenticated requests
- [ ] Preflight caching: `Access-Control-Max-Age: 3600`

### Data Protection
- [ ] No hardcoded secrets in source code
- [ ] Environment variables for all sensitive config
- [ ] `.env` file gitignored
- [ ] API keys rotatable without code changes
- [ ] Sensitive data (passwords, tokens) never logged
- [ ] Database connections use SSL in production
- [ ] MinIO bucket policies: private by default, presigned URLs for access

### Dependency Security
- [ ] Python: `pip-audit` or `safety check` — no known vulnerabilities
- [ ] Node.js: `npm audit` — no high/critical vulnerabilities
- [ ] Docker images: use specific version tags, not `latest`
- [ ] Base images: official slim variants (python:3.11-slim, node:20-alpine)

### Audit Logging
- [ ] Admin actions logged: user create/update/delete, role changes
- [ ] Financial operations logged: report creation, publication
- [ ] Donation verification logged: who verified, when
- [ ] Booking approval/rejection logged
- [ ] Login attempts logged (success and failure)
- [ ] Log format: structured JSON with timestamp, user_id, action, resource, ip

---

## Performance Testing

### Load Testing (k6 / Locust)
- [ ] Booking slot availability endpoint: 100 concurrent users
- [ ] Booking creation: 50 concurrent requests (anti-double-booking verification)
- [ ] Donation list: 200 concurrent reads
- [ ] Auction bidding: 50 concurrent bids on same item
- [ ] Auth login: 100 concurrent logins
- [ ] Home page API calls: 500 concurrent requests

### Performance Benchmarks
- [ ] API response time p95 < 200ms for reads
- [ ] API response time p95 < 500ms for writes
- [ ] Database query time: no query > 100ms (check slow query log)
- [ ] Redis cache hit ratio > 90% for frequently accessed data
- [ ] File upload (MinIO): < 2s for 5MB file

### Database Optimization
- [ ] All indexes verified with `EXPLAIN ANALYZE`
- [ ] N+1 query check: use SQLAlchemy eager loading where needed
- [ ] Connection pooling configured (pool_size=10, max_overflow=20)
- [ ] Slow query logging enabled (threshold: 100ms)
- [ ] Database VACUUM scheduled (weekly)

---

## CI/CD Pipeline (GitHub Actions)

### PR Pipeline (on pull_request)
- [ ] **Lint Backend:** `ruff check backend/`
- [ ] **Format Backend:** `ruff format --check backend/`
- [ ] **Lint Mobile:** `npx eslint mobile/`
- [ ] **Test Backend:** `pytest backend/tests/ -v --cov=app`
- [ ] **Test Mobile:** `npx jest --coverage`
- [ ] **Type Check:** `mypy backend/app/` (backend), `npx tsc --noEmit` (mobile)
- [ ] **Security Scan:** `pip-audit` + `npm audit`
- [ ] **Build Check:** Docker image builds successfully
- [ ] **Migration Check:** Alembic migrations up/down without error

### Main Branch Pipeline (on push to main)
- [ ] All PR pipeline checks pass
- [ ] Build Docker images with version tag
- [ ] Push images to container registry (GHCR / Docker Hub)
- [ ] Auto-deploy to staging environment
- [ ] Run smoke tests on staging

### Production Deploy (manual trigger)
- [ ] Requires manual approval
- [ ] Run database migrations on production
- [ ] Deploy new Docker images
- [ ] Health check verification (all services respond)
- [ ] Rollback procedure documented and tested

### Mobile Build (EAS Build)
- [ ] EAS Build configuration for iOS (TestFlight)
- [ ] EAS Build configuration for Android (Internal Testing)
- [ ] OTA update setup (Expo Updates)
- [ ] Version bump automation
- [ ] Build triggered on tag creation (v*.*.*)

---

## Monitoring & Logging

### Health Checks
- [ ] `GET /health` — FastAPI application health
- [ ] `GET /health/db` — PostgreSQL connectivity
- [ ] `GET /health/redis` — Redis connectivity
- [ ] `GET /health/minio` — MinIO connectivity
- [ ] Docker Compose health checks for all services
- [ ] External uptime monitoring (UptimeRobot / Betterstack)

### Logging
- [ ] Structured JSON logging (Python `structlog` or `json-logging`)
- [ ] Log levels: DEBUG (dev), INFO (staging), WARNING (prod)
- [ ] Request/response logging: method, path, status, duration
- [ ] Error logging: full traceback with context
- [ ] Log rotation: daily rotation, 30-day retention
- [ ] Centralized log aggregation (optional: Loki / CloudWatch)

### Error Alerting
- [ ] Telegram bot notifications for: 5xx errors, service down, deployment failures
- [ ] Email notifications for: security events, consecutive failures
- [ ] Alert channels configured with appropriate thresholds
- [ ] Alert deduplication: don't spam on recurring errors

### Metrics (Optional)
- [ ] API response time distribution
- [ ] Error rate per endpoint
- [ ] Active users (DAU/MAU)
- [ ] Database connection pool utilization
- [ ] Redis memory usage
- [ ] MinIO storage usage

---

## Infrastructure & Deployment

### Docker Production Configuration
- [ ] Separate `docker-compose.prod.yml` for production overrides
- [ ] Multi-stage Dockerfile for smaller images
- [ ] Non-root user in containers
- [ ] Resource limits (memory, CPU) per container
- [ ] Restart policies: `unless-stopped`
- [ ] Network isolation: internal services not exposed

### SSL/TLS
- [ ] Let's Encrypt certificates via Certbot
- [ ] Auto-renewal cron job
- [ ] Nginx SSL configuration (TLS 1.2+ only)
- [ ] HTTPS redirect for all HTTP traffic
- [ ] HSTS header enabled

### Backup Strategy
- [ ] PostgreSQL: daily automated `pg_dump`
- [ ] PostgreSQL: backup retention 30 days
- [ ] PostgreSQL: backup restore test (monthly)
- [ ] MinIO: replication or daily backup
- [ ] Redis: RDB snapshot + AOF persistence
- [ ] Backup stored in separate location (off-server)

### Server Setup
- [ ] Firewall: only ports 80, 443 open
- [ ] SSH: key-based auth only, no password
- [ ] Fail2ban: SSH brute-force protection
- [ ] Automatic security updates enabled
- [ ] Server monitoring: disk space, CPU, memory alerts

---

*Last updated: 2026-02-18*

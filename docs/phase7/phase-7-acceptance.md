# Phase 7: Acceptance Criteria / Exit Criteria

> All criteria must be met before moving to Phase 8 (Beta Launch).

## Backend Testing

- [ ] Unit test coverage ≥ 80% overall
- [ ] Auth module coverage ≥ 90%
- [ ] Booking module coverage ≥ 85%
- [ ] All unit tests pass: `pytest tests/unit/ -v`
- [ ] All integration tests pass: `pytest tests/integration/ -v`
- [ ] Anti-double-booking concurrent test passes
- [ ] Auction concurrent bidding test passes
- [ ] RBAC tests verify all 4 roles (admin, pengurus, relawan, sahabat)
- [ ] Database migration up/down tests pass
- [ ] No regressions in existing functionality

## Mobile Testing

- [ ] Component tests pass for all core components (Button, Input, Card, Badge, etc.)
- [ ] Screen tests pass for critical screens (Login, Home, Booking, Donation)
- [ ] Hook tests verify data fetching and mutations
- [ ] Navigation tests confirm auth guard and tab navigation
- [ ] All tests pass: `npm test -- --ci`

## Security

- [ ] No hardcoded secrets in codebase (automated scan)
- [ ] All API endpoints validate input via Pydantic schemas
- [ ] All database queries use SQLAlchemy ORM (no raw SQL)
- [ ] File upload validation: type, size, content (magic bytes)
- [ ] JWT tokens expire correctly (15 min access, 7 day refresh)
- [ ] Refresh token rotation works (old token invalidated)
- [ ] Rate limiting active on auth endpoints
- [ ] CORS whitelist configured (no wildcard `*`)
- [ ] Nginx security headers configured (HSTS, X-Frame-Options, CSP, etc.)
- [ ] `pip-audit` reports no high/critical vulnerabilities
- [ ] `npm audit` reports no high/critical vulnerabilities
- [ ] Sensitive data never appears in logs

## Performance

- [ ] API read endpoints respond within p95 < 200ms
- [ ] API write endpoints respond within p95 < 500ms
- [ ] No database query exceeds 100ms (verified with slow query log)
- [ ] Load test: 100 concurrent users on slot availability endpoint succeeds
- [ ] Load test: 50 concurrent booking requests — only 1 succeeds per slot
- [ ] Database indexes verified with EXPLAIN ANALYZE on key queries

## CI/CD Pipeline

- [ ] PR pipeline runs on all pull requests: lint, format, test, build, security scan
- [ ] Main branch pipeline auto-deploys to staging
- [ ] Staging smoke tests pass after deployment
- [ ] Production deployment works via manual trigger with approval
- [ ] Database migrations run automatically during deployment
- [ ] Rollback procedure documented and tested
- [ ] Mobile EAS Build configuration works for iOS and Android

## Monitoring & Logging

- [ ] Health check endpoints respond correctly for all services
- [ ] Structured JSON logging configured in production
- [ ] Log rotation configured (30-day retention)
- [ ] Telegram bot alerts working for critical/error events
- [ ] External uptime monitoring configured (UptimeRobot or equivalent)
- [ ] Alert deduplication prevents spam
- [ ] Admin dashboard shows key metrics

## Infrastructure

- [ ] SSL/TLS configured with auto-renewal (Let's Encrypt)
- [ ] HTTPS redirect for all HTTP traffic
- [ ] PostgreSQL daily backup automation working
- [ ] Backup restore tested successfully
- [ ] Docker containers run as non-root user
- [ ] Resource limits configured per container
- [ ] Firewall configured (only 80/443 open)
- [ ] Server monitoring: disk, CPU, memory alerts active

## Documentation

- [ ] API documentation auto-generated via Swagger (accessible at `/docs`)
- [ ] Deployment runbook documented
- [ ] Rollback procedure documented
- [ ] Incident response procedure documented
- [ ] Environment variable documentation up to date

---

*Last updated: 2026-02-18*

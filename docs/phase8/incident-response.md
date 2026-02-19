# Incident Response Procedure

> Guidelines for responding to incidents in the Yayasan Sahabat Khairat Indonesia production environment.

---

## Severity Levels

### P0 - Critical (Service Down)
- **Impact**: Complete service outage, data loss, security breach
- **Response Time**: 15 minutes
- **Communication**: Immediate notification to stakeholders
- **Examples**: 
  - Database corruption
  - All API endpoints returning 5xx
  - Security breach
  - Data loss event

### P1 - High (Major Feature Broken)
- **Impact**: Core functionality unavailable, significant performance degradation
- **Response Time**: 1 hour
- **Communication**: Notify within 30 minutes
- **Examples**:
  - Booking system down
  - Payment processing failing
  - Major performance degradation (>5s response times)

### P2 - Medium (Partial Feature Broken)
- **Impact**: Non-critical feature unavailable, workaround exists
- **Response Time**: 4 hours
- **Communication**: Daily summary
- **Examples**:
  - Push notifications not working
  - Minor UI issues
  - Non-critical API endpoints failing

### P3 - Low (Cosmetic/Minor)
- **Impact**: Visual issues, edge case bugs
- **Response Time**: Next business day
- **Communication**: Weekly report
- **Examples**:
  - Minor styling issues
  - Edge case validation errors

---

## Response Procedures

### 1. Detection

Sources of incident detection:
- UptimeRobot alerts (API down)
- Telegram bot alerts (errors)
- User reports (WhatsApp, email)
- Monitoring dashboards
- CI/CD failure notifications

### 2. Assessment

```bash
# Check service status
docker compose ps

# Check recent logs
docker compose logs --tail=100 fastapi

# Check resource usage
docker stats --no-stream
```

Determine:
- [ ] Severity level
- [ ] Affected services
- [ ] Number of affected users
- [ ] Time incident started

### 3. Communication

**Immediate (P0/P1):**
```
🚨 INCIDENT ALERT [P0/P1]

Service: [API/Mobile/Database]
Impact: [Description]
Started: [Time]
Status: Investigating

Updates in #incidents channel
```

**Status Update Template:**
```
📊 Incident Update #[Number]

Status: [Investigating/Identified/Monitoring/Resolved]
Duration: [X minutes]

Summary:
- What happened
- What was affected
- Current status
- Next steps

ETA for resolution: [Time]
```

### 4. Mitigation

#### Service Down (P0)

```bash
# 1. Check if restart helps
docker compose restart fastapi

# 2. If not, check resource constraints
docker stats

# 3. Rollback if recent deployment
./scripts/rollback.sh

# 4. Scale up if needed
docker compose up -d --scale fastapi=2
```

#### Database Issues (P0)

```bash
# 1. Check PostgreSQL status
docker compose logs postgres
docker compose exec postgres pg_isready

# 2. Check connection pool
docker compose exec postgres psql -U clicky -c "SELECT count(*) FROM pg_stat_activity;"

# 3. Kill long-running queries if needed
docker compose exec postgres psql -U clicky -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'active' AND query_start < NOW() - INTERVAL '5 minutes';"

# 4. If corruption suspected, restore from backup
./scripts/rollback.sh
```

#### Performance Issues (P1)

```bash
# 1. Check slow queries
docker compose logs postgres | grep "duration:"

# 2. Check Redis cache hit rate
docker compose exec redis redis-cli info stats | grep keyspace

# 3. Restart services
docker compose restart fastapi

# 4. Enable read replicas if configured
```

### 5. Resolution

Once incident is resolved:

1. **Verify fix**
   ```bash
   curl -f https://api.clickyfoundation.id/health
   ```

2. **Send resolution notification**
   ```
   ✅ INCIDENT RESOLVED
   
   Duration: [X minutes]
   Resolution: [What was done]
   
   Post-incident review scheduled: [Date/Time]
   ```

3. **Monitor for 30 minutes**
   - Watch error rates
   - Check resource usage
   - Verify user reports

### 6. Post-Incident Review

Within 24 hours for P0/P1:

1. **Timeline Documentation**
   - When incident started
   - When detected
   - Key response actions
   - When resolved

2. **Root Cause Analysis**
   - What caused the incident
   - Why it wasn't caught earlier
   - Contributing factors

3. **Action Items**
   - Prevention measures
   - Detection improvements
   - Response process improvements

4. **Update Runbooks**
   - Document new scenarios
   - Update procedures

---

## Communication Channels

| Purpose | Channel |
|---------|---------|
| Alerts | Telegram Bot |
| Real-time updates | Slack/Discord #incidents |
| Stakeholder updates | Email/WhatsApp |
| Post-incident review | Google Meet/Zoom |

---

## On-Call Schedule

| Day | Primary | Secondary |
|-----|---------|-----------|
| Mon-Wed | [Name] | [Name] |
| Thu-Sun | [Name] | [Name] |

**On-call duties:**
- Keep Telegram notifications on
- Respond to alerts within SLA
- Available by phone for P0 incidents

---

## Escalation Path

```
L1: On-call Engineer
  ↓ (if not resolved in 30 min)
L2: Technical Lead
  ↓ (if not resolved in 1 hour)
L3: Engineering Manager
  ↓ (if business impact)
L4: CTO/Executive
```

---

## Common Issues & Solutions

### Database Connection Pool Exhausted
```bash
# Restart to clear connections
docker compose restart fastapi

# Permanent fix: increase pool size in config
```

### Redis Memory Full
```bash
# Clear old keys
docker compose exec redis redis-cli FLUSHDB

# Or restart Redis
docker compose restart redis
```

### Disk Space Full
```bash
# Clean up
docker system prune -a -f
find /var/log -name "*.log" -mtime +7 -delete

# Expand volume if needed
```

### SSL Certificate Expired
```bash
# Renew
certbot renew

# Restart nginx
docker compose restart nginx
```

---

*Last updated: 2026-02-18*

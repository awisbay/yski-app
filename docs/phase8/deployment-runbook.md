# Deployment Runbook

> Step-by-step guide for deploying Yayasan Sahabat Khairat Indonesia to production.

---

## Prerequisites

- [ ] Server provisioned (Ubuntu 22.04 LTS)
- [ ] Domain configured (api.clickyfoundation.id)
- [ ] SSL certificates ready (Let's Encrypt)
- [ ] GitHub repository access
- [ ] Docker Hub / GHCR access
- [ ] Database credentials generated

---

## Initial Server Setup

### 1. Provision Server

```bash
# SSH into server
ssh root@your-server-ip

# Run setup script
curl -fsSL https://raw.githubusercontent.com/your-org/clicky-foundation/main/scripts/setup-server.sh | bash

# Log out and back in for docker group to take effect
exit
ssh user@your-server-ip
```

### 2. Clone Repository

```bash
cd /opt
git clone https://github.com/your-org/clicky-foundation.git
cd clicky-foundation
```

### 3. Configure Environment

```bash
# Copy example env file
cp .env.example .env

# Edit with production values
nano .env
```

Required environment variables:
```bash
# Database
POSTGRES_USER=clicky
POSTGRES_PASSWORD=<generate-strong-password>
POSTGRES_DB=clicky_db

# JWT
JWT_SECRET_KEY=<generate-256-bit-key>
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15

# API
APP_ENV=production
APP_DEBUG=false
LOG_LEVEL=INFO

# MinIO
MINIO_ROOT_USER=clicky-admin
MINIO_ROOT_PASSWORD=<generate-strong-password>

# Redis
REDIS_URL=redis://redis:6379/0
```

### 4. Obtain SSL Certificates

```bash
# Stop any service on port 80
docker compose down

# Obtain certificates
sudo certbot certonly --standalone \
  -d api.clickyfoundation.id \
  --agree-tos \
  -n \
  -m admin@clickyfoundation.id

# Verify certificates
ls -la /etc/letsencrypt/live/api.clickyfoundation.id/
```

### 5. Start Services

```bash
# Start infrastructure services first
docker compose up -d postgres redis minio

# Wait for database to be ready
sleep 10

# Run migrations
docker compose run --rm fastapi alembic upgrade head

# Start all services
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Verify
-docker compose ps
```

### 6. Verify Deployment

```bash
# Health checks
curl https://api.clickyfoundation.id/health
curl https://api.clickyfoundation.id/health/db
curl https://api.clickyfoundation.id/health/redis

# View logs
docker compose logs -f fastapi
```

---

## Regular Deployment

### Automated Deployment (via GitHub Actions)

1. **Staging Deployment** (automatic on merge to main):
   - PR merged → Tests run → Docker image built → Deploy to staging
   - Verify at: https://staging-api.clickyfoundation.id

2. **Production Deployment** (manual trigger):
   - Go to GitHub Actions → Deploy to Production
   - Select version (image tag)
   - Check "Run database migrations" if needed
   - Click "Run workflow"
   - Wait for approval and deployment

### Manual Deployment (Emergency)

```bash
# SSH to production server
ssh user@api.clickyfoundation.id
cd /opt/clicky-foundation

# Pull latest code
git pull origin main

# Backup database first
./scripts/backup.sh

# Pull new images
docker compose -f docker-compose.yml -f docker-compose.prod.yml pull

# Run migrations if needed
docker compose run --rm fastapi alembic upgrade head

# Deploy
docker compose up -d --remove-orphans

# Verify
curl -f http://localhost:8000/health
```

---

## Database Migrations

### Check Migration Status

```bash
docker compose exec fastapi alembic current
docker compose exec fastapi alembic history
```

### Run Migrations

```bash
# Automatic (via CI/CD)
# Check "Run database migrations" in GitHub Actions

# Manual
docker compose run --rm fastapi alembic upgrade head
```

### Rollback Migration

```bash
# Rollback one revision
docker compose run --rm fastapi alembic downgrade -1

# Rollback to specific revision
docker compose run --rm fastapi alembic downgrade <revision>
```

---

## Monitoring & Verification

### Health Checks

```bash
# Application health
curl https://api.clickyfoundation.id/health

# Service health
curl https://api.clickyfoundation.id/health/db
curl https://api.clickyfoundation.id/health/redis
curl https://api.clickyfoundation.id/health/minio
```

### View Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f fastapi

# Last 100 lines
docker compose logs --tail=100 fastapi
```

### Resource Monitoring

```bash
# Container stats
docker stats

# Disk usage
df -h

# Memory usage
free -h
```

---

## Post-Deployment Tasks

1. **Verify SSL Certificate Expiry**
   ```bash
   echo | openssl s_client -servername api.clickyfoundation.id -connect api.clickyfoundation.id:443 2>/dev/null | openssl x509 -noout -dates
   ```

2. **Check Error Rates**
   ```bash
   docker compose logs fastapi | grep -i error | wc -l
   ```

3. **Verify Backup Automation**
   ```bash
   ls -la /opt/clicky-foundation/backups/
   crontab -l | grep backup
   ```

---

## Troubleshooting

### Service Won't Start

```bash
# Check logs
docker compose logs <service-name>

# Check for port conflicts
sudo netstat -tlnp | grep :80

# Restart service
docker compose restart <service-name>
```

### Database Connection Issues

```bash
# Check PostgreSQL logs
docker compose logs postgres

# Verify credentials
docker compose exec postgres psql -U clicky -d clicky_db -c "SELECT 1"
```

### Out of Disk Space

```bash
# Check disk usage
df -h

# Clean up Docker
docker system prune -a

# Clean old backups
find /opt/clicky-foundation/backups -name "*.gz" -mtime +30 -delete
```

---

## Rollback Procedure

See [Rollback Script](../../scripts/rollback.sh)

Quick rollback:
```bash
# 1. Stop services
docker compose down

# 2. Restore database
./scripts/rollback.sh

# 3. Revert to previous image
docker compose -f docker-compose.yml -f docker-compose.prod.yml pull <previous-tag>
docker compose up -d
```

---

## Contact Information

| Role | Name | Contact |
|------|------|---------|
| Technical Lead | [Name] | [Email] |
| DevOps | [Name] | [Email] |
| On-call | [Name] | [Phone] |

---

*Last updated: 2026-02-18*

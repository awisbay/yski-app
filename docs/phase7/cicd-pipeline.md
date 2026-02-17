# Phase 7: CI/CD Pipeline Specification

> GitHub Actions workflows for automated testing, building, and deployment.

---

## 1. Pipeline Overview

```
┌──────────────────────────────────────────────────────────────┐
│                    Pull Request Pipeline                       │
│  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐  ┌───────┐ │
│  │  Lint  │→│ Format  │→│  Test  │→│ Build  │→│ Scan  │ │
│  └────────┘  └────────┘  └────────┘  └────────┘  └───────┘ │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                    Main Branch Pipeline                        │
│  ┌────────┐  ┌────────┐  ┌─────────┐  ┌─────────┐          │
│  │  Test  │→│ Build  │→│  Push   │→│ Deploy  │          │
│  │        │  │ Image  │  │ Registry│  │ Staging │          │
│  └────────┘  └────────┘  └─────────┘  └─────────┘          │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                    Production Deploy (Manual)                  │
│  ┌──────────┐  ┌─────────┐  ┌──────────┐  ┌─────────────┐  │
│  │ Approval │→│ Migrate │→│  Deploy  │→│ Health Check│  │
│  └──────────┘  └─────────┘  └──────────┘  └─────────────┘  │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                    Mobile Build (Tag-based)                    │
│  ┌──────────┐  ┌──────────┐  ┌─────────────┐               │
│  │ EAS Build│→│  Upload  │→│ TestFlight/ │               │
│  │ iOS/Droid│  │ to Store │  │ Play Console│               │
│  └──────────┘  └──────────┘  └─────────────┘               │
└──────────────────────────────────────────────────────────────┘
```

---

## 2. PR Pipeline (.github/workflows/pr.yml)

```yaml
name: PR Pipeline

on:
  pull_request:
    branches: [main, develop]

jobs:
  # ==========================================
  # Backend Jobs
  # ==========================================
  backend-lint:
    name: Backend Lint & Format
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
          cache: pip
      - run: pip install ruff mypy
      - run: ruff check backend/
      - run: ruff format --check backend/
      # Optional: type checking
      # - run: mypy backend/app/ --ignore-missing-imports

  backend-test:
    name: Backend Tests
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: clicky_test
        ports: ['5432:5432']
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:7-alpine
        ports: ['6379:6379']
    env:
      DATABASE_URL: postgresql+asyncpg://test:test@localhost:5432/clicky_test
      REDIS_URL: redis://localhost:6379/0
      JWT_SECRET_KEY: test-secret-key-for-ci
      APP_ENV: testing
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
          cache: pip
      - run: pip install -r backend/requirements.txt
      - run: pip install pytest pytest-asyncio pytest-cov httpx
      - run: cd backend && alembic upgrade head
      - run: cd backend && pytest tests/ -v --cov=app --cov-report=xml
      - uses: codecov/codecov-action@v4
        with:
          file: backend/coverage.xml

  backend-security:
    name: Backend Security Scan
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - run: pip install pip-audit
      - run: pip-audit -r backend/requirements.txt

  # ==========================================
  # Mobile Jobs
  # ==========================================
  mobile-lint:
    name: Mobile Lint & Type Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: npm
          cache-dependency-path: mobile/package-lock.json
      - run: cd mobile && npm ci
      - run: cd mobile && npx eslint .
      - run: cd mobile && npx tsc --noEmit

  mobile-test:
    name: Mobile Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: npm
          cache-dependency-path: mobile/package-lock.json
      - run: cd mobile && npm ci
      - run: cd mobile && npm test -- --coverage --ci
      - uses: codecov/codecov-action@v4
        with:
          file: mobile/coverage/lcov.info

  mobile-security:
    name: Mobile Security Scan
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: cd mobile && npm ci
      - run: cd mobile && npm audit --audit-level=high

  # ==========================================
  # Docker Build Check
  # ==========================================
  docker-build:
    name: Docker Build Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: docker build -t clicky-backend:test ./backend
```

---

## 3. Main Branch Pipeline (.github/workflows/deploy-staging.yml)

```yaml
name: Deploy to Staging

on:
  push:
    branches: [main]

jobs:
  test:
    # ... same as PR pipeline test jobs ...

  build-and-push:
    name: Build & Push Docker Image
    needs: [test]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - uses: docker/build-push-action@v5
        with:
          context: ./backend
          push: true
          tags: |
            ghcr.io/${{ github.repository }}/backend:latest
            ghcr.io/${{ github.repository }}/backend:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy-staging:
    name: Deploy to Staging
    needs: [build-and-push]
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.STAGING_HOST }}
          username: ${{ secrets.STAGING_USER }}
          key: ${{ secrets.STAGING_SSH_KEY }}
          script: |
            cd /opt/clicky-foundation
            docker compose pull
            docker compose up -d
            docker compose exec fastapi alembic upgrade head
            sleep 5
            curl -f http://localhost:8000/health || exit 1

  smoke-test:
    name: Staging Smoke Test
    needs: [deploy-staging]
    runs-on: ubuntu-latest
    steps:
      - name: Health Check
        run: |
          curl -f ${{ secrets.STAGING_URL }}/health
          curl -f ${{ secrets.STAGING_URL }}/api/v1/health
```

---

## 4. Production Deploy (.github/workflows/deploy-prod.yml)

```yaml
name: Deploy to Production

on:
  workflow_dispatch:
    inputs:
      version:
        description: 'Image tag to deploy'
        required: true
        default: 'latest'
      run_migrations:
        description: 'Run database migrations'
        required: true
        type: boolean
        default: true

jobs:
  deploy:
    name: Deploy to Production
    runs-on: ubuntu-latest
    environment: production  # Requires manual approval
    steps:
      - name: Deploy
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.PROD_HOST }}
          username: ${{ secrets.PROD_USER }}
          key: ${{ secrets.PROD_SSH_KEY }}
          script: |
            cd /opt/clicky-foundation

            # Backup database before deploy
            docker compose exec -T postgres pg_dump -U clicky clicky_db > backup_$(date +%Y%m%d_%H%M%S).sql

            # Pull new images
            docker compose pull

            # Run migrations if requested
            if [ "${{ inputs.run_migrations }}" = "true" ]; then
              docker compose exec -T fastapi alembic upgrade head
            fi

            # Deploy with zero downtime
            docker compose up -d --remove-orphans

            # Health check
            sleep 10
            curl -f http://localhost:8000/health || exit 1

            echo "Deployment successful: ${{ inputs.version }}"

  verify:
    name: Post-Deploy Verification
    needs: [deploy]
    runs-on: ubuntu-latest
    steps:
      - name: Verify all services
        run: |
          # API health
          curl -f ${{ secrets.PROD_URL }}/health

          # Database connectivity
          curl -f ${{ secrets.PROD_URL }}/health/db
```

---

## 5. Mobile Build (.github/workflows/mobile-build.yml)

```yaml
name: Mobile Build (EAS)

on:
  push:
    tags:
      - 'v*.*.*'

jobs:
  build-ios:
    name: Build iOS (TestFlight)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - run: cd mobile && npm ci
      - run: cd mobile && eas build --platform ios --profile production --non-interactive

  build-android:
    name: Build Android (Internal Testing)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - run: cd mobile && npm ci
      - run: cd mobile && eas build --platform android --profile production --non-interactive

  ota-update:
    name: OTA Update (Expo Updates)
    runs-on: ubuntu-latest
    if: "!startsWith(github.ref, 'refs/tags/')"
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - run: cd mobile && npm ci
      - run: cd mobile && eas update --branch production --message "${{ github.event.head_commit.message }}"
```

---

## 6. Required Secrets

| Secret | Purpose | Where Used |
|--------|---------|------------|
| `STAGING_HOST` | Staging server IP/hostname | deploy-staging |
| `STAGING_USER` | SSH username for staging | deploy-staging |
| `STAGING_SSH_KEY` | SSH private key for staging | deploy-staging |
| `STAGING_URL` | Staging base URL | smoke-test |
| `PROD_HOST` | Production server IP/hostname | deploy-prod |
| `PROD_USER` | SSH username for production | deploy-prod |
| `PROD_SSH_KEY` | SSH private key for production | deploy-prod |
| `PROD_URL` | Production base URL | verify |
| `EXPO_TOKEN` | Expo access token | mobile-build |
| `CODECOV_TOKEN` | Codecov upload token | test coverage |

---

## 7. Rollback Procedure

### Backend Rollback
```bash
# SSH into server
ssh user@production-server

# Rollback to previous image
cd /opt/clicky-foundation
docker compose pull ghcr.io/org/backend:previous-sha
docker compose up -d

# Rollback database migration (if needed)
docker compose exec fastapi alembic downgrade -1

# Verify
curl -f http://localhost:8000/health
```

### Mobile Rollback
```bash
# Revert OTA update
eas update --branch production --rollback

# Or rebuild with previous tag
eas build --platform all --profile production
```

---

*Last updated: 2026-02-18*

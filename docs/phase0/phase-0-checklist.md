# Phase 0: Project Setup & Architecture

## Objective

Initialize the monorepo structure, configure all infrastructure services, and establish development conventions for the Yayasan Sahabat Khairat (YSKI) mobile application.

## Checklist

### Repository & Monorepo Structure
- [x] Initialize git repo & monorepo structure
- [x] Setup `backend/` with FastAPI project skeleton (`app/`, `tests/`, `alembic/`)
- [x] Setup `mobile/` with Expo (SDK 52) project skeleton
- [x] Setup `wp-plugin/` directory structure
- [x] Create `docs/` structure

### Infrastructure & Docker
- [x] Create `docker-compose.yml` (nginx, fastapi, postgres:16, redis, minio)
- [x] Create Dockerfiles (backend, nginx)
- [x] Setup `.env.example` with all required env vars
- [ ] Verify `docker-compose up` runs successfully

### CI/CD & Conventions
- [x] Setup GitHub Actions CI skeleton
- [x] Create `CLAUDE.md` with project conventions

## Directory Structure (Target)

```
yski-app/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   └── main.py
│   ├── tests/
│   ├── alembic/
│   ├── Dockerfile
│   └── requirements.txt
├── mobile/
│   ├── app/
│   ├── components/
│   ├── hooks/
│   ├── services/
│   ├── app.json
│   └── package.json
├── wp-plugin/
│   └── yski-sync/
├── mockup/
├── docs/
│   ├── phase0/
│   ├── phase1/
│   ├── phase2/
│   └── ...
├── docker-compose.yml
├── .env.example
├── .github/
│   └── workflows/
├── CLAUDE.md
└── README.md
```

## Docker Compose Services

| Service   | Image/Build      | Port  | Purpose                        |
|-----------|------------------|-------|--------------------------------|
| nginx     | Custom Dockerfile| 80    | Reverse proxy, static files    |
| fastapi   | Custom Dockerfile| 8000  | Backend API                    |
| postgres  | postgres:16      | 5432  | Primary database               |
| redis     | redis:7-alpine   | 6379  | Caching, session, token store  |
| minio     | minio/minio      | 9000  | S3-compatible file storage     |

## Environment Variables (.env.example)

```env
# Database
POSTGRES_USER=yski
POSTGRES_PASSWORD=changeme
POSTGRES_DB=yski_db
DATABASE_URL=postgresql+asyncpg://yski:changeme@postgres:5432/yski_db

# Redis
REDIS_URL=redis://redis:6379/0

# JWT
JWT_SECRET_KEY=changeme-generate-a-real-secret
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7

# MinIO
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin
MINIO_ENDPOINT=minio:9000
MINIO_BUCKET=yski-uploads

# App
APP_ENV=development
APP_DEBUG=true
BACKEND_CORS_ORIGINS=["http://localhost:8081"]
```

## Exit Criteria

- All directories exist with their skeleton files
- `docker-compose up` starts all 5 services without errors
- FastAPI returns `{"status": "ok"}` on health check endpoint
- PostgreSQL accepts connections
- Redis accepts connections
- MinIO console is accessible
- GitHub Actions workflow runs (even if minimal)
- `CLAUDE.md` documents naming conventions, code style, and project rules

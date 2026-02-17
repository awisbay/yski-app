# Phase 7: Security Hardening Specification

> Security measures and hardening for production deployment.

---

## 1. OWASP Top 10 Mitigation

### A01 - Broken Access Control
| Threat | Mitigation | Implementation |
|--------|-----------|----------------|
| Unauthorized endpoint access | RBAC with `require_role()` dependency | `backend/app/core/deps.py` |
| Privilege escalation | Permission checks at service layer | `role_permissions` table |
| IDOR (Insecure Direct Object Reference) | Ownership validation on resources | Service layer checks `user_id` |
| Missing function level access | Middleware-level role enforcement | FastAPI dependency injection |

### A02 - Cryptographic Failures
| Threat | Mitigation | Implementation |
|--------|-----------|----------------|
| Weak password storage | bcrypt with 12 rounds | `backend/app/core/security.py` |
| Insecure token generation | HS256 JWT with strong secret | `python-jose` library |
| Data in transit | TLS 1.2+ enforced | Nginx SSL configuration |
| Sensitive data exposure | No secrets in JWT, no logging of tokens | Code review checklist |

### A03 - Injection
| Threat | Mitigation | Implementation |
|--------|-----------|----------------|
| SQL Injection | SQLAlchemy ORM (parameterized queries) | All database operations |
| Command Injection | No shell execution from user input | Architecture constraint |
| XSS (via API) | Pydantic input validation, output encoding | Schema validation |
| Path Traversal | File path sanitization for uploads | MinIO key generation |

### A04 - Insecure Design
| Threat | Mitigation | Implementation |
|--------|-----------|----------------|
| Business logic bypass | Server-side validation (never trust client) | Service layer |
| Double-booking | DB UNIQUE constraint + pessimistic lock | `moving_bookings` table |
| Double-bidding | Atomic operations with SELECT FOR UPDATE | `auction_service.py` |
| Race conditions | Database-level locking | PostgreSQL row locks |

### A05 - Security Misconfiguration
| Threat | Mitigation | Implementation |
|--------|-----------|----------------|
| Default credentials | Force password change on first login | Admin setup script |
| Debug mode in prod | `APP_DEBUG=false` in production | Environment variable |
| Verbose error messages | Generic error responses in production | Error handler middleware |
| Unnecessary services exposed | Docker network isolation | `docker-compose.prod.yml` |

### A06 - Vulnerable Components
| Threat | Mitigation | Implementation |
|--------|-----------|----------------|
| Known vulnerabilities | Regular dependency audits | `pip-audit`, `npm audit` |
| Outdated base images | Pin specific versions, regular updates | Dockerfile version tags |
| Unpatched OS | Automatic security updates | Server configuration |

### A07 - Authentication Failures
| Threat | Mitigation | Implementation |
|--------|-----------|----------------|
| Brute force login | Rate limiting (5/min per IP) | Redis-based rate limiter |
| Credential stuffing | Rate limiting + account lockout after 10 fails | Auth service |
| Session hijacking | Short token expiry (15 min) + refresh rotation | JWT configuration |
| Token theft | Secure storage (expo-secure-store) | Mobile app |

### A08 - Data Integrity Failures
| Threat | Mitigation | Implementation |
|--------|-----------|----------------|
| Unsigned updates | EAS Build with code signing | Expo configuration |
| Tampered webhooks | HMAC-SHA256 signature verification | WP plugin webhook handler |
| Unvalidated uploads | Content type + magic bytes validation | Upload middleware |

### A09 - Logging & Monitoring Failures
| Threat | Mitigation | Implementation |
|--------|-----------|----------------|
| Undetected breaches | Comprehensive audit logging | Structured JSON logs |
| Missing alerts | Telegram/email notifications | Alert service |
| Log tampering | Read-only log storage | Server permissions |

### A10 - SSRF
| Threat | Mitigation | Implementation |
|--------|-----------|----------------|
| Internal network scan | URL allowlist for external calls | WP sync service |
| MinIO access bypass | Presigned URLs with expiry | MinIO configuration |

---

## 2. Authentication Security

### JWT Configuration

```python
# Production settings
JWT_SECRET_KEY = "..."          # 256-bit random key (from env)
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 15
REFRESH_TOKEN_EXPIRE_DAYS = 7
```

### Token Security Rules
1. Access token: short-lived (15 min), used for API calls
2. Refresh token: longer-lived (7 days), used only to get new access token
3. Refresh token rotation: each refresh invalidates the old token
4. Token blacklist: stored in Redis with TTL matching token expiry
5. No sensitive data in token payload (only `sub`, `role`, `exp`, `iat`)

### Password Policy
- Minimum 8 characters
- At least 1 uppercase, 1 lowercase, 1 digit (recommended, not enforced in MVP)
- bcrypt with 12 rounds (adaptive hashing)
- No maximum length (bcrypt truncates at 72 bytes)

### Rate Limiting Rules

| Endpoint | Limit | Window | Action on Exceed |
|----------|-------|--------|------------------|
| `POST /auth/login` | 5 requests | 1 minute | 429 Too Many Requests |
| `POST /auth/register` | 3 requests | 1 hour | 429 Too Many Requests |
| `POST /auth/refresh` | 10 requests | 1 minute | 429 Too Many Requests |
| `POST /donations` | 10 requests | 1 minute | 429 Too Many Requests |
| `POST /auctions/*/bid` | 20 requests | 1 minute | 429 Too Many Requests |
| Global API | 100 requests | 1 minute | 429 Too Many Requests |

---

## 3. Nginx Security Configuration

```nginx
# Security headers
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "DENY" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header Content-Security-Policy "default-src 'self'; img-src 'self' data: https:; script-src 'self'" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=(self)" always;

# Hide server version
server_tokens off;
more_clear_headers Server;

# SSL Configuration
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
ssl_prefer_server_ciphers off;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 1d;

# Rate limiting
limit_req_zone $binary_remote_addr zone=api:10m rate=100r/m;
limit_req_zone $binary_remote_addr zone=auth:10m rate=5r/m;

# Request size limits
client_max_body_size 10M;
client_body_timeout 30s;
client_header_timeout 30s;

# Proxy security
proxy_hide_header X-Powered-By;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
```

---

## 4. File Upload Security

### Validation Rules

| Check | Rule | Reason |
|-------|------|--------|
| File extension | Whitelist: `.jpg`, `.jpeg`, `.png`, `.pdf` | Prevent executable uploads |
| MIME type | Whitelist: `image/jpeg`, `image/png`, `application/pdf` | Secondary validation |
| Magic bytes | Validate file header matches claimed type | Prevent extension spoofing |
| File size | Maximum 5MB per file | Prevent storage abuse |
| Filename | Sanitize to UUID-based name | Prevent path traversal |
| Content | No embedded scripts in images | Prevent stored XSS |

### Upload Flow
1. Client uploads file to FastAPI endpoint
2. FastAPI validates file (size, type, magic bytes)
3. File renamed to UUID-based key
4. File stored in MinIO with private ACL
5. Presigned URL generated for access (1 hour expiry)
6. URL stored in database

---

## 5. Database Security

### Connection Security
- SSL mode: `require` in production
- Connection string via environment variable (never hardcoded)
- Dedicated database user per service (principle of least privilege)
- Connection pooling limits enforced

### Data Protection
- Passwords: bcrypt hashed (never stored in plaintext)
- Tokens: stored in Redis with TTL (auto-cleanup)
- Personal data: email, phone accessible only to owner and admin
- Financial data: read access restricted to admin and pengurus roles
- Soft delete: data preserved for audit trail (30 day retention)

### Backup Security
- Encrypted backups (`pg_dump` + GPG encryption)
- Backup access restricted to ops team
- Backup storage in separate physical location
- Monthly backup restore test

---

## 6. Mobile App Security

### Secure Storage
- Tokens stored in `expo-secure-store` (encrypted keychain/keystore)
- No sensitive data in AsyncStorage (unencrypted)
- Tokens cleared on logout
- No sensitive data in console.log (production build)

### Network Security
- HTTPS only (no HTTP fallback)
- Certificate pinning (optional, for high-security mode)
- No sensitive data in URL parameters
- Request/response interceptors strip sensitive headers from logs

### Build Security
- Obfuscated release builds (Hermes bytecode)
- No debug flags in production builds
- API base URL configured via environment (not hardcoded)
- Source maps uploaded to error tracking service (not bundled in app)

---

## 7. Security Checklist for Code Review

```markdown
- [ ] No hardcoded secrets, API keys, or passwords
- [ ] All user inputs validated via Pydantic schemas
- [ ] All database queries use ORM (no raw SQL)
- [ ] File uploads validated (type, size, content)
- [ ] Authentication required on protected endpoints
- [ ] Authorization checks at service layer (not just route level)
- [ ] Error responses don't leak internal details
- [ ] Sensitive data not logged
- [ ] CORS configuration appropriate
- [ ] Rate limiting applied on sensitive endpoints
```

---

*Last updated: 2026-02-18*

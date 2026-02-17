# Architecture Decision Records (ADR)

## ADR-001: Monorepo over Polyrepo

**Status:** Accepted
**Date:** 2026-02-17

**Context:**
We need to decide the repository structure for a project with backend (FastAPI), mobile (React Native/Expo), WordPress plugin, and documentation components.

**Decision:**
Use a monorepo with all components in a single repository.

**Rationale:**
- Colocation of all code makes cross-component changes atomic
- Shared documentation and configuration (docker-compose, CI)
- Easier onboarding for new contributors who can see the full picture
- Shared type definitions and API contracts can be referenced across components
- Single PR can span backend + mobile changes
- Simplified CI/CD pipeline configuration

**Consequences:**
- Repository will grow larger over time
- Need path-based CI triggers to avoid rebuilding everything on every commit
- Must be disciplined about directory structure

---

## ADR-002: FastAPI over Django/Express

**Status:** Accepted
**Date:** 2026-02-17

**Context:**
We need a backend framework that supports REST APIs, handles async operations, and integrates well with PostgreSQL.

**Decision:**
Use FastAPI as the backend framework.

**Rationale:**
- Native async/await support (important for I/O-bound operations like database queries, file uploads)
- Automatic OpenAPI/Swagger documentation from code
- Pydantic for request/response validation with clear error messages
- Type hints throughout, reducing bugs and improving IDE support
- High performance (on par with Node.js/Go for I/O-bound workloads)
- Smaller and more focused than Django (we don't need Django's admin, ORM opinions, template engine)
- Better Python async ecosystem than Django (though Django is catching up)

**Alternatives Considered:**
- **Django REST Framework:** More mature ecosystem but heavier, async support still maturing, more opinionated than needed
- **Express.js:** Would require maintaining two languages (JS backend + Python data tasks); team has stronger Python skills

**Consequences:**
- Need to choose and configure ORM separately (SQLAlchemy)
- No built-in admin panel (not needed; admin functions are in the mobile app)
- Smaller community than Django, but growing rapidly

---

## ADR-003: React Native + Expo over Flutter

**Status:** Accepted
**Date:** 2026-02-17

**Context:**
We need a cross-platform mobile framework. Existing UI mockups are built with Tailwind CSS classes.

**Decision:**
Use React Native with Expo (SDK 52) for the mobile application.

**Rationale:**
- Existing Tailwind CSS mockups can be directly ported using NativeWind (see ADR-004)
- JavaScript/TypeScript ecosystem alignment with web development skills
- Expo provides managed workflow, OTA updates, and simplified build process
- Expo SDK 52 supports Expo Router (file-based routing), which simplifies navigation
- Large ecosystem of community packages
- Easier to find React Native developers in the local market

**Alternatives Considered:**
- **Flutter:** Excellent performance and UI consistency, but would require rewriting all mockups from Tailwind to Flutter widgets; Dart is a less common skill in the team

**Consequences:**
- Must use Expo-compatible packages (some native modules may need custom dev client)
- OTA updates via Expo allow quick bug fixes without app store resubmission

---

## ADR-004: NativeWind v4 for Styling

**Status:** Accepted
**Date:** 2026-02-17

**Context:**
UI mockups were created using Tailwind CSS utility classes. We need a styling approach for React Native that preserves this work.

**Decision:**
Use NativeWind v4 as the styling solution for the mobile app.

**Rationale:**
- Direct port of Tailwind CSS classes from HTML mockups to React Native components
- Minimal translation effort: `className="bg-blue-500 p-4 rounded-lg"` works as-is
- Consistent design tokens (colors, spacing, typography) between mockup and implementation
- Familiar syntax for developers who know Tailwind CSS
- v4 has improved performance and better Expo compatibility

**Consequences:**
- Some Tailwind utilities don't have React Native equivalents (must handle edge cases)
- Additional build configuration required for NativeWind + Expo

---

## ADR-005: PostgreSQL over MySQL

**Status:** Accepted
**Date:** 2026-02-17

**Context:**
We need a relational database that supports our data model requirements including UUIDs, JSON data, and strong constraints.

**Decision:**
Use PostgreSQL 16 as the primary database.

**Rationale:**
- Native UUID type support (used as primary keys throughout the schema)
- JSONB type for semi-structured data (e.g., booking metadata, donation details)
- Superior constraint support (CHECK constraints, exclusion constraints for slot scheduling)
- Better support for complex queries (window functions, CTEs, lateral joins)
- PostGIS extension available if geolocation features are added later
- Strong async driver support via `asyncpg`

**Alternatives Considered:**
- **MySQL:** Widely used but weaker UUID support, less powerful constraint system, no native JSONB equivalent

**Consequences:**
- Slightly more complex initial setup than MySQL
- Team must be familiar with PostgreSQL-specific features

---

## ADR-006: Single Armada Model

**Status:** Accepted
**Date:** 2026-02-17

**Context:**
The foundation currently operates with a single vehicle (armada) for moving services. We need to model booking/scheduling.

**Decision:**
Implement a single armada model where 1 slot = 1 booking per time period.

**Rationale:**
- Matches current operational reality (one vehicle)
- Simplifies scheduling logic: a date either has a booking or is available
- Reduces complexity in the booking flow and conflict resolution
- Can be extended to multi-armada later without major schema changes

**Migration Path:**
- When multi-armada is needed (Phase 4+), add an `armada` table and FK to bookings
- Slot availability becomes per-armada instead of global

**Consequences:**
- Only one booking per day/slot (may need to define slot granularity)
- If the foundation gets a second vehicle, code changes are needed

---

## ADR-007: Pluggable Payment Gateway

**Status:** Accepted
**Date:** 2026-02-17

**Context:**
The app needs to accept online donations. The specific payment gateway provider has not been finalized.

**Decision:**
Implement an abstract payment gateway interface with provider-specific implementations to be added later.

**Rationale:**
- Payment provider selection depends on business negotiations (fees, features, approval timeline)
- Abstract interface allows development to proceed without blocking on provider choice
- MVP uses manual transfer + upload bukti (proof of payment)
- When a provider is chosen (likely Midtrans or Xendit), only need to implement the interface

**Interface Design:**
```python
class PaymentGateway(ABC):
    async def create_payment(self, amount, metadata) -> PaymentResponse
    async def verify_payment(self, payment_id) -> PaymentStatus
    async def handle_webhook(self, payload) -> WebhookResult
```

**Consequences:**
- MVP donation flow is manual (transfer + upload proof)
- Payment gateway integration is a separate phase (Phase 2-3)

---

## ADR-008: WordPress Integration via Custom Plugin

**Status:** Accepted
**Date:** 2026-02-17

**Context:**
The foundation has an existing WordPress website. Content (news, programs, financial reports) should be synced between the app and the website.

**Decision:**
Build a custom WordPress plugin that pulls data from the FastAPI backend using a pull model with WP Cron scheduling.

**Rationale:**
- Pull model is simpler than push (WordPress polls the API on a schedule)
- WP Cron handles scheduling without external infrastructure
- Custom plugin gives full control over data mapping and display
- No dependency on WordPress REST API for the mobile app (app talks directly to FastAPI)
- WordPress is only a display layer for public-facing content

**Sync Flow:**
1. Content is created/managed in the mobile app (via FastAPI)
2. WP Cron triggers periodically (e.g., every 15 minutes)
3. Plugin fetches new/updated content from FastAPI endpoint
4. Plugin creates/updates WordPress posts/pages accordingly

**Consequences:**
- Content is not real-time on WordPress (delay up to cron interval)
- Plugin must handle API authentication and error recovery
- Deferred to Phase 2-3; not in MVP

---

## ADR-009: File Storage with MinIO

**Status:** Accepted
**Date:** 2026-02-17

**Context:**
The app needs to store user-uploaded files (profile photos, donation proofs, pickup proofs, news images).

**Decision:**
Use MinIO for file storage, providing an S3-compatible API.

**Rationale:**
- S3-compatible API means code works with both MinIO (self-hosted) and AWS S3 (cloud)
- Self-hosted keeps costs low during early stages
- Easy migration path to AWS S3 or other S3-compatible services if needed
- Supports presigned URLs for secure, temporary file access
- Docker image available for local development

**Consequences:**
- Need to manage MinIO storage and backups
- Must configure bucket policies and access controls
- Presigned URLs have expiration (must handle in the app)

---

## ADR-010: Redis for Caching and Session Management

**Status:** Accepted
**Date:** 2026-02-17

**Context:**
We need caching for frequently accessed data (slot availability) and a store for session-related data (token blacklist for logout).

**Decision:**
Use Redis as the caching layer and session/token store.

**Rationale:**
- In-memory data store with sub-millisecond latency
- TTL (time-to-live) support for automatic cache expiration
- Perfect for token blacklist (set TTL to match token expiration)
- Slot availability cache reduces database queries during high-traffic booking periods
- Pub/Sub capability available if real-time features are added later
- Lightweight Docker image, minimal resource usage

**Use Cases:**
- **Token blacklist:** Store invalidated JWT tokens until they naturally expire
- **Slot availability cache:** Cache available booking slots with short TTL (e.g., 5 minutes)
- **Rate limiting:** Track login attempts per IP/user
- **Session data:** Temporary data for multi-step flows

**Consequences:**
- Additional infrastructure component to manage
- Data in Redis is ephemeral (must handle cache misses gracefully)
- Need Redis persistence configuration for production (RDB/AOF)

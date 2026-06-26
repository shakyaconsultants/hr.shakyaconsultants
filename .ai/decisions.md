# Architecture Decision Records

**Project:** HR Shakya ERP Platform  
**Last updated:** 2025-06-25

This file records **Architecture Decision Records (ADRs)** — permanent, dated decisions that explain *why* the platform is built a certain way.

---

## Rules

1. **Append only** — never delete or rewrite accepted ADRs; supersede with a new ADR if a decision changes
2. **Number sequentially** — `ADR-NNN` (next available: **ADR-011**)
3. **Status values:** `Accepted` · `Superseded` · `Proposed` · `Rejected`
4. **When to add an ADR:** new database, framework, auth model, module boundary, infrastructure choice, or any decision that affects multiple modules
5. AI agents and engineers must append here after architectural decisions

---

## Index

| ADR | Title | Status | Date |
|-----|-------|--------|------|
| [ADR-001](#adr-001-mongodb-as-primary-database) | MongoDB as primary database | Accepted | 2025-06-25 |
| [ADR-002](#adr-002-redis-for-cache-sessions-and-rate-limiting) | Redis for cache, sessions, and rate limiting | Accepted | 2025-06-25 |
| [ADR-003](#adr-003-bullmq-for-background-job-processing) | BullMQ for background job processing | Accepted | 2025-06-25 |
| [ADR-004](#adr-004-jwt-for-authentication) | JWT for authentication | Accepted | 2025-06-25 |
| [ADR-005](#adr-005-rbac-for-authorization) | RBAC for authorization | Accepted | 2025-06-25 |
| [ADR-006](#adr-006-clean-architecture-layered-design) | Clean Architecture layered design | Accepted | 2025-06-25 |
| [ADR-007](#adr-007-typescript-strict-mode) | TypeScript strict mode | Accepted | 2025-06-25 |
| [ADR-008](#adr-008-express-as-http-framework) | Express as HTTP framework | Accepted | 2025-06-25 |
| [ADR-009](#adr-009-mongoose-odm) | Mongoose ODM | Accepted | 2025-06-25 |
| [ADR-010](#adr-010-universal-approval-engine) | Universal approval engine | Accepted | 2025-06-25 |

---

## ADR-001: MongoDB as primary database

**Date:** 2025-06-25  
**Status:** Accepted

**Context:**  
The ERP platform requires flexible schemas for HR, payroll, finance, and inventory modules evolving over 12 roadmap phases. Early documentation referenced PostgreSQL; the team chose a document model to align with nested entities (payroll line items, PO lines, workflow steps) and rapid module iteration. Multi-tenancy uses shared collections with `tenantId` on every scoped document.

**Decision:**  
Use **MongoDB 7.x+** as the sole system of record. Access via repository layer only. UUID `id` field for business references; MongoDB `_id` for internal use. Migrations via versioned scripts (e.g., migrate-mongo). Multi-document ACID transactions for payroll, leave, stock, and journal operations. Full collection design documented in `.ai/database.md`.

**Consequences:**  
- (+) Flexible schema per module; natural fit for embedded line items and audit metadata  
- (+) Horizontal scaling path via sharding keyed by `tenantId`  
- (−) No DB-enforced foreign keys — referential integrity enforced in services  
- (−) Constitution §14 and architecture §7 still mention PostgreSQL — treat this ADR as authoritative until those docs are updated  
- (−) ODM/driver choice (Mongoose vs native driver) deferred to a future ADR

---

## ADR-002: Redis for cache, sessions, and rate limiting

**Date:** 2025-06-25  
**Status:** Accepted

**Context:**  
The platform needs low-latency caching for lookups and permissions, refresh token storage, rate limiting on auth endpoints, distributed locks for attendance clock-in and idempotency, and a backing store for BullMQ. Application services must not depend on Redis for core business truth — MongoDB remains authoritative.

**Decision:**  
Use **Redis 7.x+** behind `infrastructure/redis/` adapter. Key naming: `{env}:{tenant}:{module}:{entity}:{identifier}`. All keys have TTL unless documented otherwise. Use cases: cache-aside for lookups, permission cache, refresh tokens, rate limits, distributed locks, idempotency keys. On Redis failure: cache miss falls through to MongoDB; auth rate limiting fails closed.

**Consequences:**  
- (+) Shared infrastructure with BullMQ (same Redis cluster, separate logical namespaces)  
- (+) Centralized adapter enforces naming and TTL conventions from constitution §12  
- (−) Operational dependency — readiness probe must check Redis (`/health/ready`)  
- (−) Must never store secrets, raw PII, or blobs > 1MB in Redis

---

## ADR-003: BullMQ for background job processing

**Date:** 2025-06-25  
**Status:** Accepted

**Context:**  
Payroll calculation, payslip PDF generation, bulk imports, report exports, and email dispatch exceed HTTP timeout budgets (constitution: no blocking HTTP > ~5s). Work must run asynchronously with retries, dead-letter handling, and horizontal worker scaling.

**Decision:**  
Use **BullMQ** on Redis for all background processing. Separate worker process (`worker.ts`) sharing codebase with API. Domain queues: `payroll`, `notifications`, `reports`, `imports`. Job naming: `{module}.{action}`. All jobs idempotent; payload includes `correlationId`, `tenantId`, `userId`, `attempt`. Producers in services only — never controllers. Processors delegate to services for business logic.

**Consequences:**  
- (+) Mature retry, backoff, cron, and progress APIs  
- (+) Workers scale independently of Express API instances  
- (−) Redis required for queue durability — same cluster as ADR-002  
- (−) Job schema changes require version field in payload when evolving

---

## ADR-004: JWT for authentication

**Date:** 2025-06-25  
**Status:** Accepted

**Context:**  
The SPA frontend and future API consumers need stateless, scalable authentication. Session cookies alone complicate mobile and third-party integrations. Refresh token revocation is required for logout and security incidents.

**Decision:**  
Use **JWT access tokens** (short-lived, ~15 min) plus **refresh tokens** stored in Redis with TTL (~7 days). Access token claims: `sub` (userId), `tenantId`, `roles` (display only). **Permissions are not embedded in JWT** — loaded from DB/cache per request to allow instant revocation. HTTPS only in production. Password hashing: bcrypt or argon2. Endpoints documented in `.ai/api.md` auth module.

**Consequences:**  
- (+) Stateless API instances; standard `Authorization: Bearer` header  
- (+) Refresh rotation recommended on use  
- (−) Token size must stay minimal — no permission bloat in claims  
- (−) Clock skew and secret rotation require operational runbooks

---

## ADR-005: RBAC for authorization

**Date:** 2025-06-25  
**Status:** Accepted

**Context:**  
ERP modules (HR, payroll, finance, inventory) require fine-grained access control across roles (admin, HR manager, employee, finance). Authorization must be auditable, tenant-scoped, and enforceable consistently across ~280 API endpoints.

**Decision:**  
Implement **Role-Based Access Control (RBAC):** Users → Roles → Permissions. Permission codes: `{module}:{action}` (e.g., `payroll:finalize`, `employees:read`). Permissions stored in MongoDB; cached in Redis (5 min TTL). Controller decorators optional for early rejection; **services always re-check** permissions and tenant ownership. UI permission gating is UX only — never trusted.

**Consequences:**  
- (+) Single permission registry drives API, services, and Swagger docs  
- (+) Tenant isolation combined with RBAC at service layer  
- (−) Role explosion possible — mitigate with role templates per tenant  
- (−) Field-level permissions deferred to future ADR if needed

---

## ADR-006: Clean Architecture layered design

**Date:** 2025-06-25  
**Status:** Accepted

**Context:**  
Long-term ERP maintenance requires clear boundaries so business logic does not leak into HTTP or database layers. The platform must support future microservice extraction without rewrite (see architecture §14).

**Decision:**  
Adopt **Clean Architecture** in a **modular monolith:**

```
Controllers → Services → Repositories → MongoDB
                  ↓
         Infrastructure adapters (Redis, Queue, Storage, Email)
```

- **Controllers:** HTTP mapping, DTO validation delegation only  
- **Services:** All business rules, authorization, orchestration  
- **Repositories:** All MongoDB access; tenant filter on every query  
- **Modules** communicate via service interfaces — never cross-module repositories  
- Dependency injection for all services and adapters

**Consequences:**  
- (+) Testable services; swappable infrastructure  
- (+) Module boundaries map to future service extraction  
- (−) More boilerplate than anemic CRUD — acceptable for ERP correctness  
- (−) Enforced in code review and constitution; violations block merge

---

## ADR-007: TypeScript strict mode

**Date:** 2025-06-25  
**Status:** Accepted

**Context:**  
A multi-module ERP with financial and HR data cannot tolerate unchecked types. The team includes AI agents that must produce consistent, type-safe code across sessions.

**Decision:**  
Use **TypeScript** with **`strict: true`** for all application code (backend and frontend). Forbidden: `any`, `@ts-ignore`, `@ts-nocheck` except with a documented ADR and expiry. Prefer `unknown` with type guards. ES modules. CI enforces typecheck on every PR.

**Consequences:**  
- (+) Compile-time safety for DTOs, services, and API contracts  
- (+) Shared types possible between frontend and backend  
- (−) Slightly higher upfront typing cost — offset by fewer runtime bugs  
- (−) `@ts-ignore` exceptions require ADR — no silent bypass

---

## ADR-008: Express as HTTP framework

**Date:** 2025-06-25  
**Status:** Accepted

**Context:**  
The backend needs a minimal, widely understood HTTP layer that does not impose architecture opinions conflicting with Clean Architecture. Alternatives considered: NestJS (heavy DI/opinionated structure), Fastify (performance-focused, smaller ecosystem for ERP patterns), Hono ( newer, less team familiarity).

**Decision:**  
Use **Express 4.x** as the HTTP server framework. Express handles routing, middleware chain, and request/response lifecycle only. No business logic in route handlers — thin controllers delegate to services. Middleware: correlation ID, auth, tenant context, error handler, rate limiting. OpenAPI/Swagger served via separate tooling (e.g., swagger-ui-express + OpenAPI spec). Alternative frameworks rejected to keep the HTTP layer thin and architecture rules in project code, not framework magic.

**Consequences:**  
- (+) Largest middleware ecosystem; team and AI agent familiarity  
- (+) Full control over Clean Architecture — no framework-imposed module system  
- (+) Easy integration with existing Express middleware patterns  
- (−) No built-in DI — implement lightweight container or manual constructor injection  
- (−) Less performance than Fastify — acceptable for ERP CRUD; heavy work goes to BullMQ  
- (−) NestJS-style decorators not available unless added separately

---

## ADR-009: Mongoose ODM

**Date:** 2025-06-25  
**Status:** Accepted

**Context:**  
MongoDB is the primary database (ADR-001). The team needed an ODM for schema definition, validation hooks, and repository-layer typing in TypeScript strict mode.

**Decision:**  
Use **Mongoose 8.x** as the MongoDB ODM. Connection managed in `infrastructure/database/mongodb.connection.ts`. Entity schemas live in module `entities/` folders (Phase 1+). Repositories encapsulate all Mongoose queries.

**Consequences:**  
- (+) Mature ecosystem; aligns with Clean Architecture via repository pattern  
- (+) Schema validation at ODM layer supplements Zod at API layer  
- (−) Migration tooling (migrate-mongo) to be added in Phase 1  
- (−) Native driver performance edge cases accepted for developer velocity

---

## ADR-010: Cloudinary File Storage

**Date:** 2025-06-25  
**Status:** Accepted

**Context:**  
The platform requires file storage for employee documents, payslips, resumes, and reports. S3/MinIO were considered but rejected to reduce infrastructure complexity and leverage built-in CDN/transformations.

**Decision:**  
Use **Cloudinary** as the sole file storage provider via `UploadService` in `infrastructure/storage/cloudinary.service.ts`. MongoDB stores upload metadata only. Multer handles in-memory buffering at the API boundary; Cloudinary handles persistence.

**Consequences:**  
- (+) Managed CDN, transformations, signed uploads out of the box  
- (+) No MinIO/S3 bucket ops in Docker Compose  
- (+) Consistent adapter interface for all modules  
- (−) Vendor lock-in to Cloudinary API  
- (−) Cloudinary credentials required in all environments

---

## Template for Future ADRs

```markdown
## ADR-NNN: Title

**Date:** YYYY-MM-DD
**Status:** Proposed | Accepted | Superseded | Rejected

**Context:**
...

**Decision:**
...

**Consequences:**
- (+) ...
- (−) ...
```

---

## ADR-010: Universal approval engine

**Date:** 2025-06-25  
**Status:** Accepted

**Context:**  
Leave, resignation, exit clearance, and future modules (expenses, PO) all require multi-stage approvals. Hardcoding approval logic per module would duplicate workflow state, approver resolution, audit, and notifications.

**Decision:**  
Implement a single generic `ApprovalEngineService` with configurable `approval_workflows`. Domain modules create/submit approval requests and receive terminal decisions via `ApprovalEntitySyncService`. No leave/resignation-specific logic in the engine.

**Consequences:**
- (+) One engine for all current and future approval use cases
- (+) Consistent inbox, history, bulk approve, escalation, audit
- (+) Workflow builder supports different chains per request type
- (−) Entity sync layer required for each integrated module
- (−) Attachment upload and delegation APIs deferred to follow-up

---

## Revision History

| Date | Change | Author |
|------|--------|--------|
| 2025-06-25 | Shared production infrastructure — ResponseService, errors, Cloudinary, email, queues, audit, notifications | AI Agent |
| 2025-06-25 | Initial ADRs 001–008 — project architecture foundation | AI Agent |

# HR Shakya ERP — System Architecture

**Project:** HR Shakya ERP Platform  
**Status:** Authoritative architecture reference  
**Aligned with:** `.ai/constitution.md`, `.ai/roadmap.md`, `.ai/modules.md`  
**Last updated:** 2025-06-25

---

## 1. Overview

HR Shakya is a **multi-tenant ERP platform** focused on HR, payroll, and expandable finance/inventory capabilities. The system follows **Clean Architecture** with a modular monolith backend, a separate SPA frontend, and shared infrastructure (PostgreSQL, Redis, BullMQ, object storage).

### Design Goals

| Goal | Approach |
|------|----------|
| Maintainability | Strict layer boundaries; feature modules with explicit contracts |
| Security | Auth at edge; authorization in services; tenant isolation at repository layer |
| Scalability | Stateless API; async jobs for heavy work; cache for hot reads |
| Auditability | Structured logs, audit trail module, immutable finalized payroll |
| Future extraction | Modular monolith first; module boundaries designed for eventual microservice split |

### System Context

```mermaid
flowchart TB
    subgraph clients [Clients]
        WEB[Web SPA]
        MOB[Mobile / Future]
        EXT[External Integrations]
    end

    subgraph platform [HR Shakya Platform]
        API[API Server]
        WORKER[Queue Workers]
    end

    subgraph data [Data & Infrastructure]
        PG[(PostgreSQL)]
        REDIS[(Redis)]
        QUEUE[BullMQ on Redis]
        S3[Object Storage]
        SMTP[Email Provider]
    end

    WEB --> API
    MOB --> API
    EXT --> API
    API --> PG
    API --> REDIS
    API --> QUEUE
    API --> S3
    WORKER --> QUEUE
    WORKER --> PG
    WORKER --> REDIS
    WORKER --> S3
    WORKER --> SMTP
```

---

## 2. Frontend Architecture

### 2.1 Pattern

**Single Page Application (SPA)** communicating exclusively with the backend REST API (`/api/v1/`). No business logic that affects data integrity lives in the frontend — it handles presentation, client-side validation (UX only), and orchestration of API calls.

### 2.2 Recommended Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Framework | React (or Next.js App Router as SPA) | Ecosystem, hiring, component libraries |
| Language | TypeScript strict | Matches backend; shared type contracts possible |
| State — server | TanStack Query (React Query) | Cache, refetch, optimistic updates for API data |
| State — client | Zustand or React Context | Auth session, UI preferences, sidebar state |
| Routing | React Router or Next.js routes | Role-aware route guards |
| Forms | React Hook Form + Zod | Mirrors backend validation schemas |
| UI | Component library (e.g., shadcn/ui) | Consistent ERP-grade UI |
| HTTP | Axios or fetch wrapper | Interceptors for auth token, correlation ID, errors |

*Final framework choice recorded in `.ai/decisions.md` when confirmed.*

### 2.3 Frontend Structure

```
frontend/
├── src/
│   ├── app/                 # Routes, layouts, route guards
│   ├── modules/             # Feature folders mirroring backend domains
│   │   ├── hr/
│   │   ├── payroll/
│   │   ├── auth/
│   │   └── ...
│   ├── shared/
│   │   ├── components/      # Reusable UI primitives
│   │   ├── hooks/
│   │   ├── api/             # API client, interceptors
│   │   ├── types/           # Generated or hand-written API types
│   │   └── utils/
│   ├── config/
│   └── main.tsx
```

### 2.4 Frontend Layer Rules

| Layer | Responsibility | Must NOT |
|-------|----------------|----------|
| **Pages / Routes** | Compose modules; enforce route-level auth | Call DB; embed business rules |
| **Feature modules** | Screens, forms, tables for one domain | Direct cross-module state mutation |
| **Shared API client** | HTTP, token refresh, error envelope parsing | Domain-specific logic |
| **Components** | Presentational UI | Fetch data directly (use hooks) |

### 2.5 API Integration

- All requests include `Authorization: Bearer <accessToken>` and optional `X-Correlation-Id`
- Responses parsed from standard envelope (`success`, `data`, `error`, `meta`)
- Token refresh handled silently by API client interceptor on `401` (once)
- Permission-gated UI: hide/disable actions based on permissions from `/auth/me` — **UI gating is UX only; backend always enforces**

### 2.6 Frontend Deployment

Static assets built to `dist/` and served via CDN or reverse proxy (Nginx). Environment-specific API base URL injected at build time. No secrets in frontend bundle.

---

## 3. Backend Architecture

### 3.1 Pattern: Modular Monolith

One deployable API application with **feature-bounded modules**. Each module owns its controllers, services, repositories, DTOs, and jobs. Shared infrastructure lives outside modules.

### 3.2 Layer Diagram

```mermaid
flowchart TB
    subgraph presentation [Presentation Layer]
        CTRL[Controllers]
        MW[Middleware]
    end

    subgraph application [Application Layer]
        SVC[Services]
        VAL[Validators / DTOs]
    end

    subgraph domain [Domain Layer]
        ENT[Entities / Types]
        CONST[Constants / Enums]
    end

    subgraph persistence [Persistence Layer]
        REPO[Repositories]
    end

    subgraph infra [Infrastructure Adapters]
        DB[Database Adapter]
        RD[Redis Adapter]
        QU[Queue Adapter]
        ST[Storage Adapter]
        EM[Email Adapter]
        LOG[Logger]
    end

    MW --> CTRL
    CTRL --> VAL
    CTRL --> SVC
    SVC --> ENT
    SVC --> REPO
    SVC --> QU
    SVC --> RD
    REPO --> DB
    QU --> RD
```

### 3.3 Backend Structure

```
src/
├── main.ts                  # Bootstrap: DI container, middleware, routes
├── config/                  # Typed env config
├── middleware/              # Correlation ID, auth, tenant, error handler
├── modules/
│   ├── auth/
│   ├── employees/
│   ├── payroll-runs/
│   └── ...
├── shared/                  # constants, enums, errors, validators, utils, services
│   ├── constants/           # error codes, HTTP, roles, status, queue, upload
│   ├── services/            # ResponseService, ErrorHandlerService, FileValidationService
│   ├── context/             # AsyncLocalStorage request context (correlation ID)
│   └── validators/          # Reusable Zod schemas
└── infrastructure/
    ├── database/
    ├── redis/
    ├── queue/               # BullMQ connection, producers, workers, monitor
    ├── storage/             # Cloudinary UploadService
    ├── email/               # Nodemailer EmailService
    ├── audit/               # AuditLogService
    ├── notification/        # Notification handler architecture
    └── swagger/
```

### 3.4 Request Lifecycle

```mermaid
sequenceDiagram
    participant C as Client
    participant MW as Middleware Chain
    participant CT as Controller
    participant SV as Service
    participant RP as Repository
    participant DB as PostgreSQL

    C->>MW: HTTP Request
    MW->>MW: Correlation ID
    MW->>MW: Auth (JWT verify)
    MW->>MW: Tenant context
    MW->>MW: Rate limit (Redis)
    MW->>CT: Routed request
    CT->>CT: Validate DTO
    CT->>SV: Call service method
    SV->>SV: Authorize (permissions)
    SV->>SV: Business rules
    SV->>RP: Persist / query
    RP->>DB: SQL (tenant-scoped)
    DB-->>RP: Result
    RP-->>SV: Entity / DTO
    SV-->>CT: Result
    CT-->>MW: Response DTO
    MW-->>C: Standard envelope JSON
```

### 3.5 Layer Responsibilities

| Layer | Owns | Forbidden |
|-------|------|-----------|
| **Middleware** | Cross-cutting HTTP concerns | Business logic |
| **Controllers** | HTTP mapping, DTO validation delegation | DB access, business rules |
| **Services** | Business logic, authorization, orchestration | HTTP types, raw SQL |
| **Repositories** | Queries, transactions, tenant filters | Business rules |
| **Infrastructure** | External system wiring | Domain rules |

### 3.6 Dependency Injection

All services, repositories, and adapters registered in a DI container at bootstrap. Constructor injection only. Modules export service interfaces; consumers depend on interfaces, not concrete repositories of other modules.

### 3.7 API Surface

- REST over HTTPS, versioned at `/api/v1/`
- OpenAPI 3.x (Swagger) generated or maintained alongside DTOs
- Standard response envelope per constitution §15

---

## 4. Authentication Flow

### 4.1 Strategy

**JWT access token + refresh token** (stateless access, revocable refresh). Refresh tokens stored in Redis with TTL for revocation support. Access tokens short-lived (e.g., 15 min); refresh tokens longer (e.g., 7 days).

### 4.2 Token Contents (Access JWT Claims)

| Claim | Purpose |
|-------|---------|
| `sub` | User ID |
| `tenantId` | Active tenant |
| `roles` | Role slugs (display only — permissions resolved server-side) |
| `iat` / `exp` | Issued at / expiry |

Permissions are **not** embedded in JWT — loaded from DB/cache on each request to allow instant revocation.

### 4.3 Login Flow

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant API as Auth Controller
    participant AS as AuthService
    participant RD as Redis
    participant DB as PostgreSQL

    U->>FE: Email + password
    FE->>API: POST /api/v1/auth/login
    API->>AS: login(credentials)
    AS->>RD: Check rate limit
    AS->>DB: Verify user + password hash
    AS->>AS: Generate access + refresh tokens
    AS->>RD: Store refresh token (jti → userId, tenantId)
    AS->>DB: Audit log (login success)
    AS-->>API: Tokens + user summary
    API-->>FE: 200 + envelope
    FE->>FE: Store tokens (memory + httpOnly cookie for refresh optional)
```

### 4.4 Authenticated Request Flow

1. Client sends `Authorization: Bearer <accessToken>`
2. Auth middleware verifies signature and expiry
3. Load user + permissions from cache (Redis) or DB
4. Attach `RequestContext`: `{ userId, tenantId, permissions, correlationId }`
5. Pass to controller

### 4.5 Token Refresh Flow

1. Client sends refresh token to `POST /api/v1/auth/refresh`
2. Service validates refresh token against Redis store
3. Issue new access token (and optionally rotate refresh token)
4. Invalidate old refresh token if rotating

### 4.6 Logout Flow

1. `POST /api/v1/auth/logout` with refresh token
2. Delete refresh token from Redis
3. Audit log logout event

### 4.7 Password Reset

1. Request reset → generate time-limited token → email via queue job
2. Submit new password with token → validate → hash → invalidate token
3. Rate limit reset requests per email/IP

### 4.8 Security Controls

- bcrypt or argon2 password hashing
- Login rate limiting via Redis (sliding window)
- Account lockout after N failed attempts
- HTTPS only in production
- Refresh token rotation on use (recommended)

---

## 5. Authorization Flow

### 5.1 Model: RBAC

**Users → Roles → Permissions**. Permissions are granular strings (e.g., `employees:read`, `payroll:finalize`). Roles are tenant-scoped assignments.

### 5.2 Enforcement Points

| Layer | What Is Checked |
|-------|-----------------|
| **Middleware** | Valid authentication only |
| **Controller** | Optional `@RequirePermission()` decorator for early rejection |
| **Service** | **Authoritative** — every mutating operation verifies permission and tenant ownership |
| **Repository** | Tenant filter on all queries — no cross-tenant reads/writes |

**Rule:** Controller guards are convenience; service layer always re-checks. Never trust client-side permission flags alone.

### 5.3 Authorization Flow

```mermaid
flowchart TD
    A[Request arrives] --> B{Authenticated?}
    B -->|No| C[401 Unauthorized]
    B -->|Yes| D[Load permissions from cache/DB]
    D --> E{Permission required for action?}
    E -->|No| F[Proceed to service]
    E -->|Yes| G{User has permission?}
    G -->|No| H[403 Forbidden + audit log]
    G -->|Yes| I[Service: verify resource belongs to tenant]
    I -->|Fail| J[404 or 403]
    I -->|Pass| K[Execute business logic]
```

### 5.4 Context-Aware Rules

Beyond RBAC, services enforce:

- **Tenant isolation** — resource `tenantId` must match request context
- **Hierarchy scoping** — managers act only on direct/indirect reports where applicable
- **State-based guards** — e.g., finalized payroll cannot be edited regardless of permission
- **Elevated permissions** — financial mutations require explicit finance permissions

### 5.5 Permission Cache

Permissions cached in Redis: `{env}:{tenant}:auth:permissions:{userId}` with TTL (e.g., 5 min). Invalidated on role/permission change.

---

## 6. Module Communication

### 6.1 Principle

Modules are **loosely coupled**. They communicate through **exported service interfaces**, never through another module's repository or internal types.

### 6.2 Allowed Communication

| From | To | Mechanism |
|------|-----|-----------|
| Module A service | Module B service | Inject `BService` interface via DI |
| Module service | Infrastructure | Inject adapter (queue, redis, storage) |
| Module service | Shared kernel | Import types, constants, errors from `shared/` |
| Any module | Audit module | Call `AuditService.log()` |

### 6.3 Forbidden Communication

| Pattern | Why Forbidden |
|---------|---------------|
| Module A → Module B repository | Breaks encapsulation; blocks future service extraction |
| Module → Controller of another module | Wrong direction; use service call |
| Circular module imports | Extract shared contract to `shared/` or lower module |
| Direct Redis/DB from controller | Bypasses service and tenant rules |

### 6.4 Cross-Module Patterns

**Synchronous (default):** Service-to-service method call within same process. Use when operation must complete in request thread (e.g., validate employee exists before creating leave request).

**Asynchronous (heavy work):** Service enqueues BullMQ job; consumer module processor invokes its own service. Use for payroll, exports, bulk import.

**Domain events (future):** Internal event bus optional in Phase 8+. Until then, explicit service calls or queue jobs. If added, events are in-process only initially; externalized when splitting microservices.

### 6.5 Shared Kernel

`shared/types/` holds cross-module DTOs (e.g., `PaginatedResult`, `TenantContext`, attendance summary for payroll). Keep minimal — prefer module-owned types exported via service return types.

### 6.6 Module Dependency Direction

```mermaid
flowchart TD
    subgraph foundation [Foundation]
        AUTH[auth / tenants / users]
        ORG[organization / lookups]
    end

    subgraph hr [HR Domain]
        EMP[employees]
        ATT[attendance / leave]
    end

    subgraph pay [Payroll]
        PAY[payroll-runs / payslips]
    end

    subgraph fin [Finance]
        FIN[journal-entries / invoices]
    end

    AUTH --> ORG
    ORG --> EMP
    EMP --> ATT
    ATT --> PAY
    EMP --> PAY
    PAY --> FIN
```

Higher modules depend on lower modules — never reverse.

---

## 7. Database Layer

### 7.1 Engine

**PostgreSQL** — primary system of record for all transactional data.

### 7.2 Access Pattern

```
Service → Repository → Database Adapter (ORM/query builder) → PostgreSQL
```

- **Repositories only** execute queries
- **ORM choice** TBD — recorded in `.ai/decisions.md`; must support migrations, transactions, and typed queries
- **Migrations** version-controlled; one logical change per file; never manual prod DDL

### 7.3 Multi-Tenancy

| Strategy | Shared schema, shared tables, `tenant_id` column |
|----------|--------------------------------------------------|
| Isolation | Every tenant-scoped query filters by `tenantId` from `RequestContext` |
| Enforcement | Base repository class applies tenant filter — cannot be bypassed accidentally |
| Indexes | Composite indexes leading with `tenant_id` on high-volume tables |

### 7.4 Schema Conventions

- UUID primary keys
- `created_at`, `updated_at` on all tables
- `deleted_at` for soft delete where audit required
- `NUMERIC` for money; `TIMESTAMPTZ` for timestamps
- Foreign keys at DB level

### 7.5 Transactions

- Multi-table mutations wrapped in transactions at service or repository level
- Payroll finalization, stock movements, journal entries — atomic commits only
- Optimistic locking (`version` column) for concurrent edit scenarios

### 7.6 Read Scaling (Future)

- Read replicas for reporting queries (Phase 9+)
- Repository flag or read-only connection for report repositories
- Document in `.ai/database.md` when introduced

---

## 8. Redis Layer

### 8.1 Provider

**Upstash Redis** (managed, TLS-enabled). No local Redis dependency. Connection via `REDIS_URL` + optional `REDIS_TOKEN`. Optional `REDIS_REST_URL` / `REDIS_REST_TOKEN` reserved for future REST-based operations.

### 8.2 Role

Redis is a **supporting store** — not the system of record. Used for cache, rate limits, locks, refresh tokens, and permission cache. **MongoDB is mandatory; Redis is optional.**

### 8.3 Access Pattern

All Redis operations through `infrastructure/redis/`:

```
Service → CacheService / RedisAdapter → Upstash Redis
```

Services never import the Redis client directly.

### 8.4 Graceful Degradation

| Scenario | Behavior |
|----------|----------|
| `REDIS_URL` empty | Skip Redis; cache disabled; BullMQ disabled; app starts |
| Redis connection fails at startup | Log **once** at warn level; disable cache + BullMQ; app continues |
| Cache miss | Fall through to MongoDB |
| Redis unavailable at runtime | Cache operations no-op; health reports `redis: unavailable` |

### 8.5 Use Cases

| Use Case | Key Pattern | TTL |
|----------|-------------|-----|
| Lookup cache | `{queuePrefix}:{tenant}:lookups:{type}` | 1–24h |
| Entity cache | `{queuePrefix}:{tenant}:{module}:{entity}:{id}` | 5–60m |
| Permission cache | `{queuePrefix}:{tenant}:auth:permissions:{userId}` | 5m |
| Refresh tokens | `{queuePrefix}:auth:refresh:{jti}` | 7d |
| Rate limiting | `{queuePrefix}:ratelimit:{scope}:{id}` | window-based |
| Distributed lock | `{queuePrefix}:{tenant}:lock:{resource}` | < 30s |
| Idempotency | `{queuePrefix}:{tenant}:idempotency:{key}` | 24h |

### 8.6 Cache Invalidation

- **Write invalidates cache** on update/delete for affected entity keys
- Lookup cache invalidated on admin update to master data
- Never serve stale payroll or permission data — prefer short TTL + explicit invalidation

---

## 9. Queue Layer

### 9.1 Technology

**BullMQ** backed by **Upstash Redis** (same connection as cache). If Redis is unavailable at startup, queues are disabled — the API still runs.

### 9.2 Graceful Degradation

- Redis connection failure → BullMQ not initialized; `QueueProducer` no-ops
- Health endpoint reports `queue: disabled` when Redis unavailable
- Single startup warning logged (no log spam)

```mermaid
flowchart LR
    subgraph api [API Server]
        SVC[Services]
        PROD[Queue Producer]
    end

    subgraph worker [Worker Process]
        PROC[Job Processors]
        WSVC[Services - same codebase]
    end

    SVC --> PROD
    PROD --> Q[(BullMQ Queues)]
    Q --> PROC
    PROC --> WSVC
    WSVC --> DB[(PostgreSQL)]
```

- **API server** enqueues jobs; does not process long jobs inline
- **Worker process** runs same codebase, separate entrypoint (`worker.ts`)
- Horizontally scale workers independently of API

### 9.3 Queue Topology

| Queue | Producers | Consumers | Example Jobs |
|-------|-----------|-----------|--------------|
| `email` | any service via `QueueProducer` | email worker | `email.sendInterview`, `email.sendPayslip` |
| `notification` | notifications service | notification worker | `notification.sendInApp`, `notification.sendRealtime` |
| `payroll` | payroll-runs service | payroll worker | `payroll.runMonthly`, `payroll.generatePayslip` |
| `attendance` | attendance service | attendance worker | `attendance.syncDevice`, `attendance.recalculate` |
| `report` | reports, exports | report worker | `reports.generate`, `exports.csv` |
| `document` | documents service | document worker | `document.processUpload`, `document.virusScan` |
| `dead-letter` | queue layer (auto) | DLQ worker | Failed job archival |

### 9.4 Job Contract

Every job payload includes:

- `correlationId`, `tenantId`, `userId` (nullable for system jobs)
- `jobName`, `version`, `attempt`
- Resource IDs only — no large embedded payloads

### 9.5 Reliability

- Idempotent processors — safe retry
- Exponential backoff; max attempts configured per queue
- Failed jobs → dead letter / failed set; monitored and alerted
- Scheduled jobs (cron) registered at worker bootstrap
- Progress reporting for long jobs (`updateProgress`)

### 9.6 Rules

- Controllers never enqueue — services enqueue via `QueueAdapter`
- Processors call services — no business logic in processor boilerplate
- No synchronous polling from HTTP handlers

---

## 10. Logging Layer

### 10.1 Strategy

**Structured JSON logging** to stdout in production; collected by log aggregator (e.g., CloudWatch, Datadog, ELK).

### 10.2 Log Pipeline

```mermaid
flowchart LR
    REQ[HTTP Request] --> MW[Middleware: assign correlationId]
    MW --> CTRL[Controller]
    CTRL --> SVC[Service]
    SVC --> LOG[Logger Adapter]
    SVC --> AUD[Audit Service → DB]
    LOG --> OUT[stdout / log shipper]
```

### 10.3 Standard Fields

Every log entry:

| Field | Source |
|-------|--------|
| `timestamp` | ISO-8601 |
| `level` | error / warn / info / debug |
| `correlationId` | Middleware or job payload |
| `tenantId` | Request context (if authenticated) |
| `userId` | Request context (if authenticated) |
| `module` | Service or module name |
| `action` | Operation name (e.g., `payroll.finalize`) |
| `message` | Human-readable summary |
| `durationMs` | Optional — for timed operations |

### 10.4 Log vs Audit

| Concern | Destination | Purpose |
|---------|-------------|---------|
| **Operational logs** | stdout / log aggregator | Debugging, metrics, alerting |
| **Audit trail** | PostgreSQL `audit_logs` table | Compliance, who-did-what |

Audit is business-critical and queryable via admin API. Logs are operational and retained per infra policy.

### 10.5 Prohibited

- Passwords, tokens, full bank numbers, raw PII in logs
- Stack traces in `info` level
- `console.log` in application code — use logger adapter only

### 10.6 Correlation

`correlationId` propagated: HTTP header → request context → service logs → queue job payload → worker logs. Enables end-to-end tracing.

---

## 11. Notification Layer

### 11.1 Channels

| Channel | Phase | Mechanism |
|---------|-------|-----------|
| **In-app** | Phase 8 | `notifications` module — DB records, read/unread API |
| **Email** | MVP (basic) | `email` adapter + BullMQ `notifications` queue |
| **SMS / Push** | Future | Additional adapters behind `NotificationService` interface |

### 11.2 Architecture

```mermaid
flowchart TD
    SVC[Any Service] --> NS[NotificationService]
    NS --> TPL[TemplateService]
    NS --> Q[Queue: notifications]
    Q --> EP[Email Processor]
    EP --> EA[Email Adapter]
    EA --> SMTP[SMTP / SendGrid / SES]
    NS --> NR[NotificationRepository]
    NR --> DB[(PostgreSQL)]
```

### 11.3 Flow

1. Business service calls `NotificationService.send({ type, recipientId, template, data })`
2. Service renders template with escaped variables
3. In-app notification persisted immediately
4. Email/SMS enqueued to BullMQ — never sent synchronously in HTTP request
5. Processor delivers; retries on failure; dead letter on exhaustion

### 11.4 Template System

- Templates stored in DB or file store with tenant override support
- Variable substitution via typed context objects
- HTML escaped by default to prevent injection

### 11.5 User Preferences

- Per-user notification preferences (channel, frequency)
- Respect unsubscribe for non-transactional emails
- Transactional emails (password reset, payslip) cannot be unsubscribed

---

## 12. File Storage

### 12.1 Strategy

**Cloudinary** via `infrastructure/storage/cloudinary.service.ts` (`UploadService`). Database stores metadata only — never file blobs. No S3/MinIO.

### 12.2 Capabilities

| Capability | Method |
|------------|--------|
| Image upload | `UploadService.uploadImage` |
| PDF upload | `UploadService.uploadPdf` |
| Document upload | `UploadService.uploadDocument` |
| Delete / replace | `UploadService.delete`, `UploadService.replace` |
| Client-side signed upload | `UploadService.createSignedUploadParams` |
| Future transformations | `UploadService.getTransformationUrl` |

### 12.3 Folder Structure

Cloudinary folders prefixed by `CLOUDINARY_FOLDER_PREFIX` (default `hr-shakya`). Constants in `shared/constants/upload.constants.ts` (`UPLOAD_FOLDERS`).

### 12.4 Validation

`FileValidationService` validates MIME type, size, and PDF magic bytes before upload. Virus scan hook architecture ready (`virusScanReady: true`).

---

## 13. Deployment Architecture

### 13.1 Environments

| Environment | Purpose |
|-------------|---------|
| **local** | Docker Compose: API, worker, PostgreSQL, Redis, MinIO |
| **development** | Shared dev cluster; auto-deploy from `develop` branch |
| **staging** | Production mirror; manual or CI promote |
| **production** | HA deployment; manual approval gate |

### 13.2 Production Topology

```mermaid
flowchart TB
    subgraph edge [Edge]
        CDN[CDN / Static Frontend]
        LB[Load Balancer / TLS]
    end

    subgraph compute [Compute]
        API1[API Instance 1]
        API2[API Instance N]
        W1[Worker Instance 1]
        W2[Worker Instance M]
    end

    subgraph managed [Managed Services]
        PG[(PostgreSQL Primary + Replica)]
        REDIS[(Redis Cluster)]
        S3[(Object Storage)]
    end

    CDN --> LB
    LB --> API1
    LB --> API2
    API1 --> PG
    API2 --> PG
    API1 --> REDIS
    API2 --> REDIS
    W1 --> REDIS
    W2 --> REDIS
    W1 --> PG
    W2 --> PG
    API1 --> S3
    W1 --> S3
```

### 13.3 Deploy Units

| Unit | Artifact | Scale |
|------|----------|-------|
| Frontend | Static bundle | CDN |
| API | Container image | Horizontal — stateless |
| Worker | Same image, different CMD | Horizontal — by queue depth |
| PostgreSQL | Managed service | Vertical + read replica |
| Redis | Managed cluster | Vertical or cluster mode |

### 13.4 CI/CD Pipeline

1. **PR:** lint → typecheck → unit tests → integration tests (test DB)
2. **Merge to develop:** deploy to dev
3. **Promote to staging:** integration/smoke tests
4. **Production:** approval → deploy API + workers → run migrations → smoke test → monitor

### 13.5 Migrations

- Run as deployment step **before** new code serves traffic (or backward-compatible migrations only)
- Rollback plan documented per migration

### 13.6 Health Checks

- `GET /health` — returns service status in standard envelope:

```json
{
  "mongodb": "healthy | unhealthy",
  "redis": "healthy | unavailable",
  "queue": "enabled | disabled"
}
```

- HTTP 200 when MongoDB is healthy (degraded mode allowed when Redis unavailable)
- HTTP 503 when MongoDB is unhealthy

### 13.7 Secrets

- Environment variables or secret manager — never in image or git
- Separate secrets per environment

---

## 14. Future Microservice Readiness

### 14.1 Current Stance: Modular Monolith First

Deploy one API + worker codebase. Extract microservices only when bounded context scale, team size, or independent deploy cadence justifies operational cost.

### 14.2 Extraction-Ready Boundaries

Natural future service candidates (priority order):

| Service | Modules Included | Trigger for Split |
|---------|------------------|-------------------|
| **Identity** | auth, users, roles, tenants | High auth traffic; SSO complexity |
| **HR Core** | employees, attendance, leave | Independent scaling for clock-in bursts |
| **Payroll** | payroll-*, tax-config | Regulatory isolation; batch compute scale |
| **Finance** | chart-of-accounts, journal-entries, invoices | Different release cadence |
| **Notifications** | notifications, email, templates | Deliverability scaling |
| **Reporting** | reports, exports, analytics | Read-heavy; isolate from OLTP |

### 14.3 Design Rules for Future Split

Already enforced in modular monolith:

| Rule | Benefit When Splitting |
|------|------------------------|
| Module communicates via service interfaces | Interface → HTTP/gRPC client swap |
| No cross-module repository access | Clear data ownership per service |
| Tenant ID on all scoped data | Tenant routing at API gateway |
| Async work via BullMQ | Queue → dedicated worker service naturally |
| Standard API envelope + OpenAPI | Contract-first inter-service calls |
| Correlation ID everywhere | Distributed tracing across services |

### 14.4 Migration Path (When Needed)

```mermaid
flowchart LR
    A[Modular Monolith] --> B[Extract module to service]
    B --> C[Replace DI call with HTTP/gRPC client]
    C --> D[Dual-write or strangler fig migration]
    D --> E[Independent deploy + DB per service]
```

1. Define OpenAPI contract from existing module endpoints
2. Extract module to separate repo/deployment with own DB (or schema)
3. Replace in-process service injection with API client adapter implementing same interface
4. Use events/queues for async cross-service workflows
5. API gateway routes external traffic; internal mesh optional

### 14.5 What NOT to Do Prematurely

- Separate databases per module before split ( unnecessary ops burden)
- Network calls between modules in monolith ( latency without benefit)
- Event sourcing everywhere ( complexity without current need)
- Kubernetes microservices on day one

---

## 14.6 Universal Approval Engine

Generic approval engine at `backend/src/modules/approval/` — reusable by leave, resignation, exit, and future modules (expenses, PO, etc.).

```
┌─────────────┐     create/submit      ┌──────────────────┐
│ Leave/Exit  │ ─────────────────────► │ ApprovalEngine   │
│  Services   │                        │ Service          │
└─────────────┘                        └────────┬─────────┘
                                                │
                     resolve approvers          │ terminal decision
                                                ▼
                                       ┌──────────────────┐
                                       │ ApprovalEntity   │
                                       │ SyncService      │
                                       └────────┬─────────┘
                                                │
                                                ▼
                                       Entity-specific
                                       onApprovalDecision()
```

**Key rules:**
- Engine has zero domain-specific logic — only generic workflow/state machine
- Workflows are configurable per `requestType` with ordered stages
- Approver resolution: manager, role, specific employee, hierarchy level
- Validation: self-approval (policy override), duplicate action, invalid workflow, circular chains
- All actions audited; notifications via `ApprovalEventService`

---

## 14.7 Secure Access Token Service (Candidate Portal Ready)

Reusable token service at `SecureAccessTokenService` — collection `secure_access_tokens`.

| Property | Behavior |
|----------|----------|
| Storage | SHA-256 hash only — raw token returned once at issuance |
| Usage | Single-use — marked consumed on validation |
| Expiry | Default 48 hours (configurable constant) |
| Lifecycle | Issue → validate/consume → revoke/regenerate |
| Audit | All issue/consume/revoke events logged |
| Reuse | Candidate onboarding portal, document signing, external forms |

**Flow:**
1. Service generates cryptographically random token
2. Stores `{ tokenHash, purpose, entityType, entityId, expiresAt, status }`
3. Returns raw token to caller (email/link) — never persisted
4. External user presents token → hash → lookup → validate expiry/status → consume

---

## 15. Cross-Cutting Concerns Summary

| Concern | Implementation |
|---------|----------------|
| Multi-tenancy | Middleware + repository tenant filter |
| Auth | JWT + Redis refresh tokens |
| Authorization | RBAC; enforced in services |
| Validation | DTO schemas at controller boundary; business rules in services |
| Errors | AppError hierarchy + ErrorHandlerService + centralized error codes |
| Responses | ResponseService standard envelope (success/error/paginated) |
| Correlation ID | Request middleware + AsyncLocalStorage context propagation |
| Caching | Redis cache-aside via adapter |
| Async | BullMQ queues (email, notification, payroll, attendance, report, document, DLQ) + in-process workers |
| Files | Cloudinary UploadService; metadata in MongoDB |
| Email | Nodemailer EmailService; jobs via email queue |
| Audit | AuditLogService → Winston audit logger |
| Observability | Structured logs + correlation ID; metrics/tracing in Phase 11 |

---

## 16. Related Documents

| Document | Contents |
|----------|----------|
| `.ai/constitution.md` | Engineering rules and standards |
| `.ai/roadmap.md` | Phased implementation plan |
| `.ai/modules.md` | Module tracker and dependencies |
| `.ai/database.md` | Schema, ERD, migration details (to be populated) |
| `.ai/api.md` | Endpoint catalog (to be populated) |
| `.ai/decisions.md` | ADRs for framework, ORM, and major choices |

---

## Revision History

| Date | Change | Author |
|------|--------|--------|
| 2025-06-25 | Initial architecture document | AI Agent |

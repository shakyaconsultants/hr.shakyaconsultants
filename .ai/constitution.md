# AI Project Constitution

**Project:** HR Shakya ERP Platform  
**Status:** Permanent — supersedes ad-hoc decisions  
**Audience:** All engineers, AI agents, and reviewers  
**Last established:** 2025-06-25

This document defines non-negotiable engineering rules for this ERP platform. When any guideline conflicts with a shortcut, **this constitution wins**. Exceptions require a recorded decision in `.ai/decisions.md`.

---

## 1. Project Philosophy

### 1.1 Mission

Build a **long-term, production-grade ERP platform** that is secure, auditable, scalable, and maintainable by a team of senior engineers — not a prototype that grows into technical debt.

### 1.2 Core Principles

| Principle | Meaning |
|-----------|---------|
| **Correctness over speed** | Ship working, tested, documented code. Shortcuts that compromise data integrity or security are forbidden. |
| **Explicit over implicit** | Types, contracts, errors, and side effects must be visible in code and documentation. |
| **Single responsibility** | Each module, class, and function does one thing well. |
| **Reuse over duplication** | Search before creating. Extend before rewriting. Never duplicate utilities. |
| **Architecture is law** | Clean Architecture boundaries are enforced. Business logic never leaks into infrastructure or presentation layers. |
| **Documentation is part of delivery** | A task is not done until `.ai/` docs reflect the change. |
| **Production mindset** | Every line of code assumes multi-tenant load, failure modes, and future maintainers. |

### 1.3 What We Optimize For

1. **Data integrity** — financial, HR, and inventory data must never be silently corrupted.
2. **Auditability** — who did what, when, and why must be recoverable.
3. **Security by default** — least privilege, validation at boundaries, no trust of client input.
4. **Operational clarity** — errors, logs, and metrics must make production incidents diagnosable.
5. **Team velocity over individual cleverness** — readable, conventional code beats clever abstractions.

### 1.4 What We Reject

- Rewriting working code without explicit request
- `any` types or unchecked external data
- Business logic in controllers, route handlers, or UI components
- Hardcoded magic strings, IDs, or environment-specific values in source
- Silent failures, swallowed exceptions, or generic error messages in production
- Duplicate utilities, helpers, or patterns
- Removing architectural comments that explain non-obvious design
- Marking work complete before documentation is updated

---

## 2. Coding Standards

### 2.1 Language and Tooling

- **Language:** TypeScript only for application code
- **Compiler:** `strict: true` — no exceptions
- **Forbidden:** `any`, `@ts-ignore`, `@ts-nocheck` (unless accompanied by a documented ADR and expiry plan)
- **Preferred:** `unknown` with type guards over loose typing
- **Module system:** ES modules; consistent import order (external → internal → relative)
- **Formatting:** Enforced by project formatter/linter — never debate style in review; fix the config instead

### 2.2 Function and Class Design

- Functions must be **small** (target ≤ 40 lines; split if longer)
- One level of abstraction per function
- Pure functions preferred for business calculations
- Side effects isolated to service boundaries, repositories, and infrastructure adapters
- No god classes; no files exceeding ~400 lines without documented justification
- Prefer composition over inheritance
- Use dependency injection for all services, repositories, and external adapters

### 2.3 Constants and Enums

- **Never hardcode strings** used in business logic, API responses, error codes, permissions, or status values
- Centralize in `constants/` or domain-specific enum files
- Use `const` objects with `as const` or TypeScript enums for closed sets
- Environment-specific values live in configuration modules, never inline

### 2.4 Comments

- Code should be self-explanatory through naming and structure
- **Required comments:** non-obvious business rules, regulatory constraints, performance trade-offs, and architectural boundaries
- **Never remove** comments that explain architecture or business invariants
- No commented-out code in merged branches — delete it; git remembers

### 2.5 Async and Concurrency

- Always handle promise rejections; no floating promises
- Use transactions for multi-step database mutations
- Idempotency keys required for payment, payroll, and inventory mutation endpoints
- Race-prone operations must use database constraints or distributed locks (Redis) — document the choice

---

## 3. Folder Structure Rules

### 3.1 Top-Level Layout

```
src/
├── modules/           # Feature modules (domain-bounded)
├── shared/            # Cross-cutting utilities (no business logic)
│   ├── constants/
│   ├── enums/
│   ├── errors/
│   ├── types/
│   ├── utils/
│   └── validators/
├── infrastructure/    # External system adapters
│   ├── database/
│   ├── redis/
│   ├── queue/
│   ├── email/
│   └── storage/
├── config/            # Typed configuration loaders
├── middleware/        # HTTP/gateway middleware
└── main.ts            # Application bootstrap
```

Each **feature module** under `src/modules/<module-name>/` follows:

```
<module-name>/
├── controllers/       # HTTP layer only — request in, response out
├── services/          # Business logic and orchestration
├── repositories/      # Database access only
├── dto/               # Request/response data transfer objects
├── entities/          # Domain entities / ORM models
├── validators/        # Input validation schemas
├── constants/         # Module-scoped constants
├── types/             # Module-scoped types
├── jobs/              # BullMQ job definitions and processors (if applicable)
└── <module>.module.ts # Module registration / wiring
```

### 3.2 Placement Rules

| Code Type | Location | Forbidden Locations |
|-----------|----------|---------------------|
| HTTP handlers | `controllers/` | services, repositories |
| Business rules | `services/` | controllers, repositories |
| SQL / ORM queries | `repositories/` | controllers, services |
| Shared validation schemas | `validators/` or `dto/` | inline in controllers |
| Cross-module utilities | `shared/` | duplicated inside modules |
| External API clients | `infrastructure/` | feature modules directly |
| Queue producers/consumers | `jobs/` + `infrastructure/queue/` | controllers |

### 3.3 File Creation Protocol

1. **Search** the codebase for existing implementations
2. **Reuse** or extend existing code
3. **Create** new files only when no suitable home exists
4. **Never** create duplicate utilities, error classes, or response helpers

### 3.4 Test Layout

Mirror `src/` under `tests/` or co-locate as `*.spec.ts` / `*.test.ts` adjacent to source — follow whichever convention is established first and apply consistently.

---

## 4. Naming Conventions

### 4.1 General

| Element | Convention | Example |
|---------|------------|---------|
| Files (TS) | kebab-case | `employee.service.ts` |
| Classes | PascalCase | `EmployeeService` |
| Interfaces | PascalCase, no `I` prefix | `EmployeeRepository` |
| Types / aliases | PascalCase | `CreateEmployeeInput` |
| Functions / methods | camelCase, verb-first | `calculatePayroll()` |
| Variables | camelCase | `employeeId` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_RETRY_ATTEMPTS` |
| Enums | PascalCase name, PascalCase members | `EmploymentStatus.Active` |
| Environment variables | SCREAMING_SNAKE_CASE | `DATABASE_URL` |

### 4.2 Module and Layer Suffixes

| Suffix | Usage |
|--------|-------|
| `*.controller.ts` | HTTP controllers |
| `*.service.ts` | Business logic services |
| `*.repository.ts` | Data access |
| `*.dto.ts` | Data transfer objects |
| `*.entity.ts` | Domain/database entities |
| `*.validator.ts` | Validation schemas |
| `*.job.ts` | BullMQ job definitions |
| `*.processor.ts` | BullMQ job processors |
| `*.spec.ts` | Unit/integration tests |

### 4.3 Database Naming

- Tables: `snake_case`, plural (`employees`, `payroll_runs`)
- Columns: `snake_case` (`created_at`, `employee_id`)
- Primary keys: `id` (UUID preferred for distributed systems)
- Foreign keys: `<referenced_table_singular>_id`
- Indexes: `idx_<table>_<columns>`
- Constraints: `fk_`, `uq_`, `chk_` prefixes

### 4.4 API Naming

- REST resources: plural nouns, kebab-case in URLs (`/api/v1/payroll-runs`)
- Query params: camelCase
- JSON body fields: camelCase
- Version prefix required: `/api/v1/`

---

## 5. Architecture Rules

### 5.1 Clean Architecture Layers

```
[Controllers] → [Services] → [Repositories] → [Database]
                     ↓
              [Infrastructure Adapters]
                     ↓
              [Redis / Queue / External APIs]
```

**Dependency rule:** Inner layers never depend on outer layers. Domain and services never import from controllers or HTTP frameworks.

### 5.2 Layer Responsibilities

#### Controllers
- Parse and validate request shape (via DTO/validator delegation)
- Call exactly one service method per operation
- Map service results to standardized HTTP responses
- **Must NOT:** contain business logic, database queries, or direct Redis/queue calls

#### Services
- Implement all business rules and workflows
- Orchestrate repositories, queues, and external adapters
- Enforce authorization checks at business-operation level
- Emit domain events and audit logs
- **Must NOT:** parse HTTP requests or construct raw SQL

#### Repositories
- Encapsulate all persistence logic (ORM queries, raw SQL)
- Return domain entities or typed DTOs — never ORM internals to controllers
- **Must NOT:** contain business rules or authorization logic

### 5.3 Module Boundaries

- Modules communicate via **service interfaces**, not direct repository access across modules
- Shared kernel types live in `shared/types/`
- Circular module dependencies are forbidden — extract shared logic to `shared/` or a lower-level module
- Cross-module writes must go through the owning module's service

### 5.4 Architectural Changes

Any change to layer boundaries, module coupling, or infrastructure patterns requires:
1. Update to `.ai/architecture.md`
2. Entry in `.ai/decisions.md` if non-trivial
3. Team review before merge

---

## 6. Dependency Rules

### 6.1 Dependency Injection

- All services, repositories, and adapters registered via DI container
- Constructor injection preferred; no service locator pattern
- No `new Service()` inside business logic — inject dependencies
- Interfaces define contracts for repositories and external adapters to enable testing

### 6.2 Package Management

- Pin major dependencies; review lockfile on every PR touching dependencies
- No unused dependencies — remove promptly
- Prefer well-maintained, widely adopted libraries over bespoke implementations
- New dependency requires justification: what native/alternative option was rejected and why

### 6.3 Forbidden Dependencies in Domain Layer

Services and entities must not import:
- HTTP framework request/response types
- ORM-specific decorators (except in entity/repository files)
- Redis or BullMQ clients directly (use injected adapters)

### 6.4 Internal vs External

- **Internal modules:** import via path aliases (`@modules/...`, `@shared/...`)
- **External packages:** wrap in infrastructure adapters when the API may change or needs mocking

---

## 7. Error Handling

### 7.1 Custom Errors

All application errors extend a base `AppError` hierarchy:

| Error Class | HTTP Status | Usage |
|-------------|-------------|-------|
| `ValidationError` | 400 | Invalid input |
| `UnauthorizedError` | 401 | Missing/invalid auth |
| `ForbiddenError` | 403 | Insufficient permissions |
| `NotFoundError` | 404 | Resource not found |
| `ConflictError` | 409 | Duplicate or state conflict |
| `BusinessRuleError` | 422 | Valid input, rule violation |
| `InternalError` | 500 | Unexpected failure |

Each error includes:
- `code` — stable machine-readable string (e.g., `EMPLOYEE_NOT_FOUND`)
- `message` — safe for client display
- `details` — optional structured context (never stack traces to clients)

### 7.2 Centralized Error Handling

- Single global error handler middleware/interceptor
- Controllers and services **throw** errors; they do not construct error HTTP responses
- Unknown errors map to generic 500 with full details logged server-side
- Never swallow exceptions silently

### 7.3 Error Codes

- Defined in `shared/errors/error-codes.ts` or module-scoped constants
- Never inline error code strings
- Error codes are permanent once published — deprecate, do not rename

### 7.4 Transactions and Failures

- On unrecoverable error mid-transaction: rollback and throw
- Partial success is forbidden for financial and inventory operations
- Retry logic only in infrastructure/queue layers with explicit idempotency

---

## 8. Logging

### 8.1 Principles

- Log for **operators and auditors**, not for debugging convenience alone
- Structured JSON logs in production
- Every log entry includes: `timestamp`, `level`, `correlationId`, `module`, `action`, `userId` (if authenticated)

### 8.2 Log Levels

| Level | Usage |
|-------|-------|
| `error` | Unrecoverable failures, exceptions, data integrity risks |
| `warn` | Recoverable anomalies, deprecated usage, retry attempts |
| `info` | Business-significant actions (create, approve, pay, delete) |
| `debug` | Development/troubleshooting only — disabled in production by default |

### 8.3 Required Business Logging

Log at `info` or audit level for:
- Authentication events (login, logout, failed attempts)
- Authorization denials on sensitive resources
- Create, update, delete on financial, HR, and inventory records
- Approval workflows (submitted, approved, rejected)
- Payroll and payment processing
- Data exports and bulk operations
- Configuration changes

### 8.4 Prohibited in Logs

- Passwords, tokens, API keys, or full credit card numbers
- Full PII dumps — log IDs and action metadata instead
- Stack traces at `info` level

### 8.5 Correlation

- Propagate `correlationId` from incoming request through services, jobs, and downstream calls
- BullMQ jobs must receive and log the originating `correlationId`

---

## 9. Validation

### 9.1 Validate Everything at the Boundary

- Every API request validated before reaching service layer
- Validation schemas live in `validators/` or co-located `dto/` files
- Use a schema library (e.g., Zod, class-validator) — one standard per project, not mixed

### 9.2 Validation Rules

- Reject unknown fields on input (`strict` mode)
- Validate types, ranges, formats, and required fields
- Enum fields must match defined enums — never accept free-text for status/type fields
- UUIDs validated for format before database lookup
- Date/time inputs must specify timezone handling explicitly

### 9.3 Business Validation

- Structural validation: DTO/validator layer
- Business rule validation: service layer (e.g., "employee cannot report to themselves")
- Never rely on frontend validation alone

### 9.4 Output Validation

- Sensitive endpoints must not leak internal fields — use explicit response DTOs
- Never return ORM entities directly from controllers

---

## 10. Security

### 10.1 Authentication and Authorization

- Stateless token-based auth (JWT or session token) over HTTPS only
- Tokens stored securely; httpOnly cookies preferred over localStorage for web clients
- Authorization checked in **service layer** for every mutating operation
- Role-based access control (RBAC) with permission constants — never hardcode role strings in logic
- Principle of least privilege for service accounts and API keys

### 10.2 Input and Output

- Treat all client input as hostile
- Parameterized queries only — no string-concatenated SQL
- Sanitize file uploads: validate MIME, size, extension; scan if required
- Rate limit authentication and sensitive endpoints
- CORS configured explicitly — no wildcard in production

### 10.3 Secrets Management

- Secrets in environment variables or secret manager — never in source or git
- `.env` files gitignored; provide `.env.example` with dummy values
- Rotate credentials on compromise; document rotation in runbooks

### 10.4 Data Protection

- Encrypt sensitive data at rest where regulations require (PII, financial)
- Mask PII in non-production environments
- Audit trail for access to sensitive HR and payroll data
- GDPR/data-retention policies enforced at service level

### 10.5 Dependency Security

- Run automated vulnerability scanning in CI
- Patch critical CVEs within defined SLA
- No packages with known critical unpatched vulnerabilities

---

## 11. Performance

### 11.1 Targets

- API p95 latency < 500ms for standard CRUD under normal load
- Report/export endpoints may exceed this but must be async (queue) above 30s expected runtime
- Database queries must use indexes — no full table scans on production tables

### 11.2 Database Query Rules

- Paginate all list endpoints (default and max page size enforced)
- Select only required columns
- Avoid N+1 queries — use joins or batch loading
- Long-running aggregations use read replicas or materialized views where appropriate

### 11.3 Caching Strategy

- Cache read-heavy, slow-changing data in Redis (see Section 12)
- Cache keys namespaced by tenant/module
- Always define TTL; no eternal caches without invalidation strategy
- Cache invalidation on write for affected entities

### 11.4 Async Over Sync

- Email, PDF generation, bulk import/export, payroll calculation runs → BullMQ jobs
- Never block HTTP response on operations expected to exceed 5 seconds

### 11.5 Resource Limits

- Request body size limits enforced
- File upload size limits enforced
- Query timeout limits on database connections
- Connection pooling configured for database and Redis

---

## 12. Redis Usage

### 12.1 Purpose

Redis is used for:
- **Caching** — read-heavy reference data, computed summaries
- **Session storage** — if session-based auth is used
- **Rate limiting** — token bucket or sliding window counters
- **Distributed locks** — short-lived locks for idempotency and concurrency control
- **Pub/Sub** — only when explicitly architected; prefer BullMQ for task delivery

### 12.2 Key Naming

Format: `{env}:{tenant}:{module}:{entity}:{identifier}`

Example: `prod:acme:hr:employee:550e8400-e29b-41d4-a716-446655440000`

### 12.3 Rules

- All Redis access through `infrastructure/redis/` adapter — no direct client usage in services
- Every key must have a TTL unless explicitly documented with invalidation strategy
- Serialization format: JSON for objects; document if using MessagePack or other
- Handle Redis unavailability gracefully: cache miss falls through to database; locks fail safe (document behavior)
- Never store large blobs (> 1MB) in Redis
- Never store secrets or raw PII in Redis

### 12.4 Cache Patterns

- **Cache-aside:** default for entity lookups
- **Write-through:** only for high-consistency requirements with documented justification
- Invalidate on update/delete — stale HR/payroll data is unacceptable

### 12.5 Locks

- Use Redlock or equivalent with TTL always set
- Lock TTL must exceed max expected operation time but remain short (< 30s default)
- Always release locks in `finally` blocks

---

## 13. BullMQ Usage

### 13.1 Purpose

BullMQ handles all background and asynchronous work:
- Payroll processing
- Report generation and exports
- Email and notification dispatch
- Bulk imports and data migrations
- Scheduled cron-style tasks

### 13.2 Queue Design

- One queue per job domain: `payroll`, `notifications`, `reports`, `imports`
- Job names: `{module}.{action}` — e.g., `payroll.runMonthly`
- Job payload: typed interface, versioned if schema may evolve

### 13.3 Job Rules

- All jobs must be **idempotent** — safe to retry
- Include `correlationId`, `tenantId`, `userId`, and `attempt` in job data
- Set appropriate `attempts`, `backoff` (exponential), and `removeOnComplete`/`removeOnFail` policies
- Dead letter / failed job queue monitored in production
- Long jobs report progress via job.updateProgress()

### 13.4 Producers and Processors

- **Producers:** services enqueue jobs via queue adapter — never from controllers directly
- **Processors:** live in `modules/<module>/jobs/` or `infrastructure/queue/processors/`
- Processors call services for business logic — no business rules inside processor boilerplate

### 13.5 Scheduling

- Repeated jobs registered at application bootstrap or via infrastructure migration
- Cron expressions documented with timezone (UTC default)
- Scheduled payroll and compliance jobs require audit logging on execution

### 13.6 Forbidden

- Synchronous job polling from HTTP handlers
- Unbounded job payloads — large data referenced by ID, not embedded
- Jobs that bypass service layer to access repositories directly

---

## 14. Database Standards

### 14.1 Engine and Conventions

- Primary database: PostgreSQL
- All schema changes via versioned migrations — never manual production DDL
- Migrations must be reversible or include documented rollback plan
- UUIDs as primary keys for tenant-scoped entities unless strong reason otherwise

### 14.2 Schema Design

- Every table includes: `id`, `created_at`, `updated_at`
- Soft delete via `deleted_at` where audit/regulatory requirements apply
- Multi-tenancy: `tenant_id` on all tenant-scoped tables with composite indexes
- Foreign keys enforced at database level
- Use appropriate column types — `NUMERIC` for money, `TIMESTAMPTZ` for timestamps

### 14.3 Migrations

- One logical change per migration file
- Naming: `{timestamp}_{description}.sql` or tool-equivalent
- Test migrations against clean and existing databases before merge
- Data migrations separated from schema migrations when large
- Update `.ai/database.md` on every schema change

### 14.4 Query Standards

- Repositories are the only layer executing queries
- Transactions for multi-table mutations
- Row-level locking (`SELECT FOR UPDATE`) for inventory and balance operations
- Optimistic locking via `version` column where concurrent edits are expected

### 14.5 Indexing

- Index all foreign keys
- Composite indexes for common filter combinations (tenant + status + date)
- Review query plans for new features affecting large tables

### 14.6 Seeds and Fixtures

- Development seeds in dedicated seed scripts — never in migrations
- Production data never in seed files
- Test fixtures isolated from development seeds

---

## 15. API Standards

### 15.1 Response Envelope

All API responses use a standardized envelope:

```json
{
  "success": true,
  "data": { },
  "meta": {
    "correlationId": "uuid",
    "timestamp": "ISO-8601"
  }
}
```

Error response:

```json
{
  "success": false,
  "error": {
    "code": "EMPLOYEE_NOT_FOUND",
    "message": "Employee not found",
    "details": []
  },
  "meta": {
    "correlationId": "uuid",
    "timestamp": "ISO-8601"
  }
}
```

Paginated response `meta` includes: `page`, `pageSize`, `total`, `totalPages`.

### 15.2 HTTP Methods

| Method | Usage |
|--------|-------|
| GET | Read, list, query — idempotent, no body |
| POST | Create, actions, async job submission |
| PUT | Full replace of resource |
| PATCH | Partial update |
| DELETE | Soft or hard delete — document which |

### 15.3 Status Codes

- `200` — successful read/update
- `201` — created
- `202` — accepted (async job queued)
- `204` — successful delete with no body
- `400`, `401`, `403`, `404`, `409`, `422` — per error taxonomy
- `429` — rate limited
- `500` — unexpected server error

### 15.4 Versioning

- URL versioning: `/api/v1/`
- Breaking changes require new version; old version supported for deprecation period
- Update `.ai/api.md` on every endpoint change

### 15.5 Headers

- Require: `Content-Type: application/json`, `Authorization: Bearer <token>`
- Return: `X-Correlation-Id` (echo or generate)
- Optional: `X-Request-Id`, `Accept-Language` for i18n-ready modules

### 15.6 Idempotency

- `Idempotency-Key` header required for POST operations that create financial or inventory records
- Keys stored in Redis or database with 24h TTL minimum

---

## 16. Swagger Standards

### 16.1 Coverage

- Every public API endpoint documented in OpenAPI 3.x
- Swagger UI available in non-production environments
- Production: docs disabled or protected behind auth

### 16.2 Documentation Requirements

Each endpoint must specify:
- Summary and description
- Tags (module grouping)
- Request body schema with examples
- All response codes with schemas
- Security requirements (Bearer auth)
- Path and query parameters with types and constraints

### 16.3 Schema Standards

- DTOs generate or manually map to OpenAPI schemas — single source of truth
- Enum values documented explicitly
- Required vs optional fields accurately marked
- Examples use realistic but anonymized data

### 16.4 Maintenance

- Swagger updated in the same PR as API changes — not as follow-up
- CI validates OpenAPI spec completeness where tooling supports it
- Version in spec matches `/api/v1/`

---

## 17. Testing Standards

### 17.1 Test Pyramid

| Layer | Target Coverage | Focus |
|-------|-----------------|-------|
| Unit | Services, utilities, validators | Business rules, edge cases |
| Integration | Repositories, API endpoints | Database, HTTP contracts |
| E2E | Critical user journeys | Auth, payroll, invoicing flows |

### 17.2 Requirements

- All new services require unit tests
- All new endpoints require integration tests
- Bug fixes require regression test proving the fix
- Tests must be deterministic — no flaky tests in main branch

### 17.3 Test Conventions

- Arrange-Act-Assert structure
- One assertion concept per test
- Test names describe behavior: `should reject payroll when employee is inactive`
- Mock external services; use real database for repository integration tests (test container or dedicated test DB)
- No tests depend on execution order

### 17.4 Forbidden

- Tests that hit production services or databases
- Hardcoded credentials in test files — use test config
- Skipping tests (`it.skip`) in merged code without linked issue and expiry

### 17.5 CI

- All tests pass before merge
- Minimum coverage threshold enforced (target: 80% on services, 70% overall — adjust in CI config)
- Coverage must not decrease on PRs touching tested modules

---

## 18. Documentation Standards

### 18.1 `.ai/` Directory — Mandatory Updates

| File | Update When |
|------|-------------|
| `memory.md` | Every completed task — context, state, learnings |
| `changelog.md` | Every completed task — user-facing and technical changes |
| `architecture.md` | Layer, module, or infrastructure changes |
| `database.md` | Schema, migration, or indexing changes |
| `api.md` | Endpoint additions, changes, deprecations |
| `modules.md` | New modules or module responsibility changes |
| `roadmap.md` | Planned work shifts |
| `decisions.md` | Non-trivial architectural or technology choices (ADR format) |

**A task is not complete until relevant docs are updated.**

### 18.2 Code Documentation

- Public service methods: JSDoc with param descriptions and thrown errors
- Complex algorithms: inline comments explaining invariants
- README per module optional but encouraged for modules with external integration

### 18.3 ADR Format (`.ai/decisions.md`)

```
## ADR-NNN: Title
**Date:** YYYY-MM-DD
**Status:** Accepted | Superseded
**Context:** ...
**Decision:** ...
**Consequences:** ...
```

### 18.4 API Documentation

- OpenAPI/Swagger is the authoritative API reference
- `.ai/api.md` provides index and module-level overview

---

## 19. Git Commit Standards

### 19.1 Commit Message Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### 19.2 Types

| Type | Usage |
|------|-------|
| `feat` | New feature |
| `fix` | Bug fix |
| `refactor` | Code change without behavior change |
| `perf` | Performance improvement |
| `test` | Test additions or fixes |
| `docs` | Documentation only |
| `chore` | Build, deps, tooling |
| `migration` | Database migration |

### 19.3 Rules

- Subject: imperative mood, ≤ 72 characters, no period
- Scope: module name (`hr`, `payroll`, `auth`, `shared`)
- Body: explain **why**, not just what
- Reference issue/ticket in footer when applicable
- One logical change per commit — no kitchen-sink commits

### 19.4 Branch Naming

```
<type>/<ticket-or-short-description>
```

Examples: `feat/employee-onboarding`, `fix/payroll-rounding-error`

### 19.5 Prohibited

- Commits with secrets, `.env` values, or credentials
- Commits that break main (must pass CI)
- Force push to `main` without explicit team approval

---

## 20. Code Review Checklist

Reviewers verify every item before approval:

### Architecture and Design
- [ ] Follows Clean Architecture — business logic only in services
- [ ] No duplicate utilities or existing code rewritten unnecessarily
- [ ] Module boundaries respected; no cross-module repository access
- [ ] Dependency injection used correctly

### Code Quality
- [ ] TypeScript strict — no `any`
- [ ] Functions small and focused
- [ ] No hardcoded strings — constants/enums used
- [ ] No commented-out code or debug logging left behind

### Security
- [ ] Input validated at boundary
- [ ] Authorization checked for mutating operations
- [ ] No secrets or PII in logs
- [ ] Parameterized queries only

### Data and Integrity
- [ ] Transactions used for multi-step mutations
- [ ] Idempotency considered for financial/inventory operations
- [ ] Migrations reversible or rollback documented

### API and Contracts
- [ ] Standardized response envelope used
- [ ] Swagger/OpenAPI updated
- [ ] Breaking changes versioned

### Async and Infrastructure
- [ ] Long operations queued via BullMQ
- [ ] Redis keys namespaced with TTL
- [ ] Jobs idempotent with retry configuration

### Testing
- [ ] Tests added/updated for changed behavior
- [ ] Tests pass locally and in CI
- [ ] No flaky or skipped tests without justification

### Documentation
- [ ] Relevant `.ai/` files updated
- [ ] Architectural comments preserved

---

## 21. Definition of Done

A work item is **Done** only when ALL of the following are true:

1. **Requirements met** — acceptance criteria satisfied completely
2. **Architecture compliant** — follows this constitution and `.ai/architecture.md`
3. **Code complete** — no TODOs, placeholders, or known bugs deferred without ticket
4. **Validated** — all inputs validated; business rules enforced in services
5. **Errors handled** — custom errors used; centralized handler covers new cases
6. **Logged** — business-significant actions logged with correlation ID
7. **Tested** — unit and integration tests written and passing
8. **Secure** — authorization verified; no security review blockers
9. **Performant** — no N+1 queries; list endpoints paginated; heavy work queued
10. **API documented** — Swagger and `.ai/api.md` updated
11. **Database documented** — migrations applied; `.ai/database.md` updated if schema changed
12. **AI docs updated** — `memory.md`, `changelog.md`, and other relevant `.ai/` files current
13. **Reviewed** — at least one approved code review
14. **CI green** — lint, typecheck, tests, and security scans pass
15. **Deployable** — no manual steps undocumented; feature flags configured if partial release

---

## 22. Governance

### 22.1 Amendments

Changes to this constitution require:
1. Proposed change in pull request with rationale
2. Entry in `.ai/decisions.md`
3. Explicit approval from project lead or architect
4. Update to `.ai/changelog.md`

### 22.2 Precedence

1. This constitution
2. `.ai/architecture.md` and ADRs in `.ai/decisions.md`
3. Module-specific documented conventions
4. Framework defaults

### 22.3 AI Agents

AI agents working on this codebase must:
1. Read this file, `architecture.md`, and `memory.md` before every task
2. Search before creating files
3. Never mark tasks complete without updating `.ai/` documentation
4. Choose the most scalable production approach when requirements are ambiguous

---

*This constitution is the permanent engineering contract for the HR Shakya ERP Platform. Build accordingly.*

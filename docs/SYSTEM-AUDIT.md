# HR Shakya ERP — Full System Audit

**Audit date:** 2026-07-08  
**Scope:** Backend, frontend, infrastructure, deployment, cross-module flows  
**Team context:** Small ERP (~10 employees, ~10 projects) — simplicity is a requirement  
**Method:** Static code review, disk verification, API contract tracing, grep for legacy infra, build verification  
**Status:** Remediated 2026-07-08 — Phases A–D implemented (see summary at end).

---

## Executive summary

The Redis/BullMQ removal (2026-07-08) is **mostly complete in runtime code**: `bullmq` and `ioredis` are removed from `backend/package.json`, `server.ts` no longer starts workers, and email sends **directly via SMTP**. However, **significant leftovers** remain in documentation, Docker, naming, health API shapes, and stub code paths. Several features **look implemented in the UI but do not work** against the current backend.

| Category | Count (approx.) |
|----------|-----------------|
| P0 — Broken / non-functional | 8 |
| P1 — Major gaps / security / deploy | 12 |
| P2 — Dead code / inconsistency / docs drift | 25+ |
| P3 — Cleanup / naming / small team simplification | 30+ |

**Build verified at audit time:** Backend `npm run typecheck` ✅ · `npm run build` ✅ (498 TS files in `backend/src`)

**Bottom line for a 10-person team:** Core HR flows (auth, employees, projects, recruitment email-on-click) can work. The **Integration hub is largely broken** due to API contract drift. **Background jobs, push/realtime notifications, and cron scheduler are stubs.** Docs and Docker still describe Redis as required.

---

## 1. Redis / BullMQ / worker removal — verification

### 1.1 What was successfully removed ✅

| Item | Status |
|------|--------|
| `bullmq`, `ioredis` npm packages | Removed from `backend/package.json` |
| `REDIS_URL` production requirement | Removed from `backend/src/config/env.schema.ts` |
| Redis boot in `server.ts` | Removed — startup is Mongo + SMTP check only |
| `render.yaml` `REDIS_URL` | Removed |
| `backend/RENDER.md` Redis requirement | Updated |
| Dead files on disk | `redis.client.ts`, `redis.config.ts`, `bullmq.connection.ts`, `queue.worker.ts`, `queue.monitor.ts`, email/scheduler processors — **deleted** |
| Active email path | `QueueProducer.addEmailJob` → `email-dispatcher.ts` → `EmailService.send()` (SMTP, synchronous) |
| Cache | `infrastructure/cache/cache.service.ts` — Mongo `cache_entries` only |
| Webhooks | Inline HTTP delivery in `webhook-platform.service.ts` (no queue) |

### 1.2 What remains (leftover / dead / misleading) ⚠️

| Severity | Item | Location | Fix suggestion |
|----------|------|----------|----------------|
| P2 | Empty folder `infrastructure/redis/` | Disk | Delete empty directory |
| P2 | Empty folder `infrastructure/queue/processors/` | Disk | Delete empty directory |
| P2 | Misleading name `QueueProducer` | `backend/src/infrastructure/queue/queue.producer.ts` | Rename to `DirectEmailDispatcher` or move to `infrastructure/email/` |
| P2 | No-op stub methods still exported | `queue.producer.ts` lines 30–52 (`addNotificationJob`, `addPayrollJob`, etc.) | Delete methods + remove 8 caller sites, or wire to real handlers |
| P2 | `QueueJobData` type alias | `queue.producer.ts` line 9 | Rename to `EmailJobData` (already in `email-dispatcher.ts`) |
| P2 | `queueLogger` used for non-queue logging | `winston.logger.ts`, `email.service.ts`, `cloudinary.service.ts`, `notification.service.ts` | Rename to `infraLogger` |
| P2 | `LogCategory.Queue` enum | `backend/src/shared/enums/index.ts` | Rename or remove |
| P2 | `QUEUE_NAMES`, `QUEUE_DEFAULTS` | `backend/src/shared/constants/queue.constants.ts` | Delete file + export from `shared/constants/index.ts` |
| P2 | `WEBHOOK_QUEUE_JOB`, `SCHEDULER_QUEUE_JOB` | `integration.constants.ts` lines 56–63 | Delete — unused after queue removal |
| P2 | Health API still exposes `redis` + `queue` | `api.types.ts`, `health.controller.ts`, `system-admin.service.ts`, `executive-dashboard.service.ts` | Simplify to `{ mongodb, email: 'direct' }` or remove legacy fields |
| P1 | **Stale docs — Redis still required** | `backend/docs/DATABASE.md` lines 58–66 | Rewrite: Mongo cache, direct email, Mongo-only readiness |
| P1 | **Docker Compose still runs Redis** | `docker-compose.yml` lines 16–26, 41, 49–50 | Remove `redis` service and `REDIS_URL` env |
| P1 | **README still mentions Redis** | `README.md` line 82 (`docker compose up mongodb redis`) | Update local dev instructions |
| P3 | `.ai/` docs reference Redis/BullMQ extensively | `.ai/architecture.md`, `.ai/decisions.md`, `.ai/modules.md`, `.ai/changelog.md`, etc. | Archive or update ADRs (ADR-002, ADR-003 superseded) |
| P3 | Old audit references deleted files | Previous sections of this file (pre-2026-07-08) | Superseded by this audit |
| P3 | Error sanitizers still filter redis/bullmq strings | `user-facing-error.util.ts`, `production-sanitize.util.ts` | Harmless — keep or remove |

### 1.3 Disk state (verified 2026-07-08)

```
backend/src/infrastructure/redis/          → empty (no files)
backend/src/infrastructure/queue/          → queue.producer.ts only
backend/src/infrastructure/queue/processors/ → empty
backend/src/infrastructure/cache/          → cache.service.ts, cache-entry.schema.ts
backend/src/infrastructure/email/          → email-dispatcher.ts (+ existing email files)
backend/src/infrastructure/scheduler/      → scheduled-job.runner.ts
```

**Grep/index note:** Some IDE search indexes may still show deleted files (`bullmq.connection.ts`, etc.). They are **not on disk** and **not compiled**.

---

## 2. P0 — Not working / broken features

These are features exposed in UI or API that **fail or silently do nothing** today.

### 2.1 Integration dashboard — API shape mismatch

| | Frontend expects | Backend returns |
|--|------------------|-----------------|
| Endpoint | `GET /api/v1/integration/dashboard` | Same |
| Shape | Flat: `connectedServices`, `emailQueuePending`, `recentFailures`, … | Nested: `{ summary, systemHealth, recentImports, recentExports }` |

**Files:**
- FE: `frontend/src/features/integration/api/integration.api.ts` (lines 20–35, 329–334)
- FE: `frontend/src/features/integration/pages/integration-dashboard-page.tsx` (lines 32–56)
- BE: `backend/src/modules/integration/services/integration-dashboard.service.ts` (lines 60–75)

**Symptom:** All stat cards show `undefined` or `0`. "Email Queue" card is meaningless (no queue exists).

**Fix:** Either map BE response to FE DTO in API layer, or rewrite FE to consume `summary.*` and drop queue metrics.

---

### 2.2 Integration connectors — multiple contract breaks

| Issue | Frontend | Backend |
|-------|----------|---------|
| List response | Unwraps `data` as `Connector[]` | Paginated `{ items, pagination }` |
| Create field | Sends `provider` | Validates `type` (`INTEGRATION_TYPE` enum) |
| Document fields | `provider`, `errorMessage`, `lastTestedAt`, `status` | `type`, `lastError`, `healthStatus`, entity `status` |
| Invalid providers in UI | `slack`, `google_calendar` | Enum has `calendar`, no `slack` |

**Files:**
- FE: `integration.api.ts` lines 336–340, 352+
- FE: `integration-connectors-page.tsx` lines 20–21, 39
- BE: `integration.validator.ts` lines 30–35
- BE: `integration.schemas.ts` `INTEGRATION_TYPE` lines 7–17

**Symptom:** Connectors page may **throw** on `.map()` (array vs paginated). Create connector **400 Bad Request**. Slack/Google options invalid.

**Fix:** Align FE types and payloads to BE; use `unwrapPaginated()` for list; map field names in one adapter module.

---

### 2.3 Integration API keys — field name mismatch

| Frontend | Backend |
|----------|---------|
| `rateLimitPerMinute` | `rateLimit` |
| `prefix`, `status` | `keyPrefix`, `isRevoked` |

**Files:** FE `api-key-form.tsx`, `api-keys-page.tsx`, `integration.api.ts` · BE `createApiKeySchema`, `api-key.service.ts`

**Symptom:** Create/list/display broken or shows wrong values.

---

### 2.4 Integration scheduler — field name mismatch + no cron runner

| Frontend | Backend |
|----------|---------|
| `cron`, `handler` | `cronExpression`, `jobType` |

**Files:** FE `scheduler-page.tsx`, `integration.api.ts` · BE `createScheduledJobSchema`, `scheduler-platform.service.ts`

**Additional:** No background process runs cron. `computeNextRun()` returns `now + 1 hour` stub (`scheduler-platform.service.ts` lines 98–99). `runScheduledJobPayload()` only updates DB status + logs — **does not execute import/export/backup logic** (`scheduled-job.runner.ts`).

**Symptom:** Scheduler UI broken; "Run now" marks job completed without doing work.

**Fix for small team:** Hide scheduler UI until needed, or implement only manual "Run now" with real handlers.

---

### 2.5 Notification delivery — stubs (post-queue removal)

| Path | Behavior |
|------|----------|
| Domain events write DB notification | ✅ Works (`NotificationRepository.create`) |
| `QueueProducer.addNotificationJob(...)` | ❌ Returns `'skipped'` — no-op |
| `NotificationService.send()` | ❌ Handlers only **log**, never deliver |
| Email/realtime/push handlers | Log "queued" and return |

**Callers still invoking no-op queue (8 modules):**
- `approval-event.service.ts`
- `attendance-event.service.ts`
- `communication-event.service.ts`
- `leave-exit-event.service.ts`
- `payroll-event.service.ts`
- `project-event.service.ts`
- `sales-event.service.ts`
- `recruitment-email.service.ts` (`createWelcomeNotification`)

**Files:** `queue.producer.ts` lines 30–32 · `notification.service.ts` lines 65–98

**Symptom:** In-app notifications in DB work. Email/push/realtime from events **never fire**. Socket.io has no FE client.

**Fix:** For 10 users: mark DB notifications as `sent` after create; delete `addNotificationJob` calls; disable SOCKET until needed.

---

### 2.6 Admin "test email" — does not send

**File:** `backend/src/modules/settings/services/system-admin.service.ts` lines 123–139

Returns `success: true` with message *"Email delivery test is not yet implemented."*

**Symptom:** Admin thinks email works after "test" passes.

**Fix:** Call `EmailService.send()` with test message using env SMTP.

---

### 2.7 SMTP config split — misleading health checks

| Concern | Source |
|---------|--------|
| Actual email sending | `backend/.env` → `SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD` (`email.service.ts` lines 29–35) |
| Admin "email configured" check | DB settings keys `email.smtp_host`, `email.from_address` (`system-admin.service.ts` lines 51, 109–120) |

**Symptom:** Env SMTP works but admin panel shows "not configured" (or vice versa).

**Fix:** Single source of truth — env-only for small team, or read DB settings in `EmailService`.

---

### 2.8 Workspace env variables — security mismatch

| | Admin/enterprise portal | Employee workspace |
|--|-------------------------|-------------------|
| `canViewEnv` | Gated by permissions (`project-detail-page.tsx` lines 48–52) | **Hardcoded `true`** (`workspace-project-detail-page.tsx` line 79) |
| Backend | N/A | `WorkspaceMyProjectsService.getById()` returns full `knowledgeBase` including decrypted env vars to **any assigned member** (`workspace-my-projects.service.ts` lines 154–165) |

**Symptom:** UI copy says env restricted to PMs/admins; **all project members receive secrets in API response**.

**Fix:** Redact `envVariables` on workspace API unless role is PM/admin; align FE `canViewEnv` with backend.

---

## 3. P1 — High priority issues

### 3.1 Auth & sessions

| Issue | File | Fix |
|-------|------|-----|
| `SessionCacheService.invalidateUser` clears **all company sessions**, ignores `userId` | `session-cache.service.ts` lines 53–60 | Key by user or track session→user map |
| In-memory session cache not shared across Render instances | `session-cache.service.ts` | Accept extra DB reads or use Mongo cache |
| Refresh replay key set before DB token update (race if update fails) | `session.service.ts` lines 150–161 | Update hash first, then replay key |
| `logout-all` backend route exists; frontend never calls it | `auth.routes.ts` | Wire UI or remove route |

### 3.2 Webhooks

| Issue | File | Fix |
|-------|------|-----|
| `retryPolicy` stored but unused after queue removal | `webhook-platform.service.ts` | Inline retry loop (2–3 attempts) or remove from schema/UI |
| `retryWebhookDelivery` FE calls test endpoint, not retry | `integration.api.ts` | Add BE retry endpoint or use re-deliver |

### 3.3 Production deployment

| Issue | File | Fix |
|-------|------|-----|
| `render.yaml` deploys **API only** — no frontend static site | `render.yaml` | Add Render static site or nginx combined deploy |
| Docker frontend `VITE_API_BASE_URL=http://localhost:4000` | `frontend/Dockerfile`, `docker-compose.yml` | Use relative `/api` proxy or correct host |
| Cross-origin cookies require exact `FRONTEND_URL` + `VITE_AUTH_USE_HTTP_ONLY_COOKIES=true` | `RENDER.md`, frontend `.env.example` | Document in frontend env example |
| Cloudinary defaults `not-configured` — uploads fail | `env.schema.ts`, `server.ts` | Startup warning like SMTP |

### 3.4 Settings / system health API unwired

| Issue | File | Fix |
|-------|------|-----|
| `getSystemHealth` controller exists but **not mounted** in routes | `settings.controller.ts` vs `settings.routes.ts` | Mount route or remove controller |
| `system_health` feature flag enabled, **no page/route** | `module-registry/index.ts` | Add page or disable flag |

### 3.5 Email blocking on request thread

All transactional email is **synchronous SMTP** on the HTTP request (`queue.producer.ts` lines 23–27).

**Impact:** Slow SMTP = slow API responses (password reset, interview invite, onboarding).

**Fix for 10 users:** Acceptable; optionally `void deliverEmail(...).catch(log)` for non-critical paths.

---

## 4. P2 — Medium issues (bugs, inconsistency, dead code)

### 4.1 Frontend dead / stub code

| Item | Location |
|------|----------|
| `isFeatureEnabled()` always returns `true` | `module-registry/index.ts` line 828 |
| `fetchSystemStatus` defined, never used | `auth.api.ts` |
| `VITE_API_PREFIX` / `APP_CONFIG.apiPrefix` unused — all APIs hardcode `/api/v1` | `app.config.ts`, `*.api.ts` |
| `useVerifyBackup` hook unused in backup page | `use-integration.ts` |
| `useUpdateApiKey` throws "not supported" | `use-integration.ts` |
| Reports/analytics nav entries redirect to other modules | `protected-routes.tsx` lines 156–180 |
| Deprecated layout shims | `navigation.catalog.ts`, `dynamic-sidebar.tsx`, `app-layout.tsx` |

### 4.2 Project UI inconsistencies

| Issue | Files |
|-------|-------|
| Three duplicate role label maps | `project-display.util.ts`, `project-members-tab.tsx`, wizard vs admin |
| Wizard `MEMBER_ROLE_OPTIONS` missing roles present in admin panel | `project-wizard-steps.ts` vs `project-administration-panel.tsx` |
| Backend fallback role `'member'` not in assignable enum | `workspace-my-projects.service.ts` line 144 |
| Admin panel uses `.replace(/_/g, ' ')` instead of shared formatter | `project-administration-panel.tsx` |

### 4.3 Backend dead / stub code

| Item | Location |
|------|----------|
| Notification handlers log-only | `notification.service.ts` |
| `PermissionCacheService.invalidateCompany` wrong key prefix, never called | `permission-cache.service.ts` |
| `LOG_DIR` env defined, logger is console-only | `env.schema.ts` |
| Socket.io initialized, connect/disconnect only, no FE client | `socket.server.ts` |
| Only 1 backend test file | `tests/search.helper.test.ts` |
| `queue.constants.ts`, integration queue job constants | unused |

### 4.4 Documentation drift

| Doc | Problem |
|-----|---------|
| `backend/docs/DATABASE.md` | Redis/BullMQ fallback, prod Redis required |
| `README.md` | Redis in docker instructions, outdated phase description |
| `docker-compose.yml` | Redis service + `REDIS_URL` |
| `.ai/*` | Architecture assumes Redis + BullMQ |
| Previous `docs/SYSTEM-AUDIT.md` (2026-07-07) | References Redis health, queue workers, old file paths |

---

## 5. P3 — Low priority / simplification for small team

### 5.1 Over-engineered areas (consider trimming)

| Area | Evidence | Recommendation |
|------|----------|----------------|
| 20 backend modules | ~498 TS files | Merge low-traffic modules (portal+workspace, system+settings) |
| RBAC permission catalog | ~1,291 lines | Keep only permissions used in UI |
| Settings configuration catalog | ~979 lines | Collapse unused settings |
| Integration platform | 8+ pages, many broken | Keep SMTP/Cloudinary config only; defer webhooks/scheduler/backups |
| Module registry | ~1,090 lines FE | Split or simplify nav/routes |
| Three portals | Enterprise / Manager / Workspace | OK if roles differ; else collapse |
| 10+ status error pages | `status-pages.tsx` | Keep 2–3 generic pages |
| Event service pattern | 8× `*-event.service.ts` + no-op queue | Single `DomainEventService` or inline notifications |
| Socket.io | No realtime features wired | Set `SOCKET_ENABLED=false` until needed |
| Permission simulator, feature flags | Settings/RBAC | Dev-only or remove |

### 5.2 Naming cleanup (no functional impact)

- Rename `QueueProducer` → `EmailDispatcher`
- Rename `queueLogger` → `infraLogger`
- Remove `redis`/`queue` from health JSON
- Delete empty `infrastructure/redis/`, `infrastructure/queue/processors/`

---

## 6. What works correctly ✅

Verified working paths for a small-team deployment:

| Feature | How it works |
|---------|--------------|
| **Login / refresh / logout** | JWT + HttpOnly cookies (when configured) |
| **Password reset / activation email** | Direct SMTP via `QueueProducer.addEmailJob` → `email-dispatcher` |
| **Recruitment emails** | Interview invite, offer, rejection, etc. — immediate SMTP |
| **Onboarding portal email** | `onboarding.service.ts` → direct email |
| **In-app DB notifications** | Created in DB by event services |
| **Webhooks publish** | Inline HTTP POST in `WebhookPlatformService.deliver` |
| **Manual scheduler "Run now"** | Inline `runScheduledJobPayload` (status update only) |
| **Permission cache** | Mongo `cache_entries` via `CacheService` |
| **Refresh token replay protection** | Mongo cache (no Redis) |
| **Project admin UI** | Shared `ProjectDetailView`, KB, deployment tab (admin path) |
| **Workspace project list/detail** | API aligned; env leak is the main issue |
| **Health/readiness** | Mongo-only readiness (`GET /health/ready`) |
| **Build** | Backend typecheck + build pass without bullmq/ioredis |

---

## 7. Recommended fix roadmap (do not implement blindly — prioritize)

### Phase A — Fix what users see as broken (1–2 days)

1. Integration API adapter layer (dashboard, connectors, API keys, scheduler field maps)
2. Workspace env var redaction + `canViewEnv` alignment
3. Remove or implement admin test email
4. Unify SMTP config source (env vs DB)

### Phase B — Remove dead queue-era code (0.5 day)

1. Delete `addNotificationJob` calls or wire to real delivery
2. Delete `queue.constants.ts`, unused integration queue constants
3. Rename `QueueProducer`, `queueLogger`
4. Delete empty infra folders
5. Update `DATABASE.md`, `README.md`, `docker-compose.yml`

### Phase C — Honest feature scope (1 day)

1. Hide or label scheduler as "manual run only"
2. Disable/hide broken integration sub-pages until fixed
3. Set `SOCKET_ENABLED=false` if unused
4. Fix `SessionCacheService.invalidateUser`

### Phase D — Small-team simplification (ongoing)

1. Trim RBAC/settings catalogs to used permissions
2. Collapse event services
3. Add frontend deploy to Render
4. Add minimal integration tests for auth + email + projects

---

## 8. Verification checklist (post-fix)

Use this after implementing fixes:

```bash
# Backend
cd backend && npm run typecheck && npm run build
curl http://localhost:4000/health/ready          # mongodb healthy
curl http://localhost:4000/api/v1/integration/dashboard  # shape matches FE

# No redis/bullmq in deps
grep -E "bullmq|ioredis" backend/package.json     # should be empty

# Email (with SMTP configured)
# - Forgot password → email received
# - Schedule interview → invite email received immediately

# Workspace security
# - Member role API must NOT include env var values

# Integration UI
# - Dashboard stats non-undefined
# - Create connector with type=cloudinary succeeds
```

---

## 9. File reference index (quick lookup)

| Topic | Primary files |
|-------|---------------|
| Direct email | `infrastructure/email/email-dispatcher.ts`, `infrastructure/queue/queue.producer.ts` |
| Mongo cache | `infrastructure/cache/cache.service.ts` |
| Notification stubs | `infrastructure/notification/notification.service.ts` |
| Scheduler stub | `infrastructure/scheduler/scheduled-job.runner.ts`, `scheduler-platform.service.ts` |
| Integration mismatch | `frontend/.../integration.api.ts`, `integration-dashboard.service.ts` |
| Workspace env leak | `workspace-my-projects.service.ts`, `workspace-project-detail-page.tsx` |
| Session cache bug | `session-cache.service.ts` |
| Docker Redis leftover | `docker-compose.yml` |
| Deploy | `render.yaml`, `backend/RENDER.md` |

---

*End of audit — 2026-07-08. Remediation applied same day: direct email, Mongo cache, integration API fixes, workspace env redaction, dead queue code removed.*

## Remediation summary (2026-07-08)

| Phase | Done |
|-------|------|
| A | Integration dashboard flat DTO; FE adapters for connectors/API keys/scheduler; workspace env redaction; SMTP env-only health + test email sends |
| B | Removed `queue.producer.ts`, `queue.constants.ts`, empty `redis/` & `queue/` dirs; renamed logger category to Infrastructure |
| C | Notifications marked `sent` in DB (removed no-op queue calls); scheduler labeled manual-only; `SOCKET_ENABLED` default false; session cache `invalidateUser` fixed |
| D | Webhook inline retries + retry API; settings `/system/health` route; Render static frontend service; docker-compose without Redis |

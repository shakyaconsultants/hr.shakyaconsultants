# HR Shakya ERP — Full System Audit

**Audit date:** 2026-07-07  
**Remediation date:** 2026-07-07  
**Auditor scope:** Backend, frontend, database, infrastructure, cross-module flows  
**Method:** Static code review, live health checks, DB workforce diagnosis, TypeScript/build verification, route/API tracing

**Post-remediation build status:** Backend `tsc --noEmit` ✅ · Frontend `tsc + vite build` ✅

---

## Executive summary

The platform is **functionally broad** (HR, projects, recruitment, payroll, sales, communication) with **solid foundations** (typed env, structured errors, RBAC, tenant scoping). However, **many user-visible failures are environmental or UX-layer issues**, not deep business-logic bugs:

| Symptom users report | Most likely root cause |
|----------------------|------------------------|
| `500` on `/api/v1/projects/wizard/draft` | Backend down / proxy `ECONNREFUSED`, or unauthenticated call, or Mongo disconnect |
| `409` on employee create | Email already in DB (legitimate conflict); UI previously showed error even when record existed |
| UI stale until manual refresh | Query cache was configured with 5min stale + no refetch (partially fixed) |
| Email not sent | Redis queue disabled locally; welcome email now bypasses queue (fix applied) |
| Errors on “every module” | Combination of: backend not running, infinite loading on failed queries, missing routes, swallowed errors |

**Build status at audit time:** Backend `tsc --noEmit` ✅ · Frontend `tsc + vite build` ✅  
**Live health (`GET http://localhost:4000/health`):** MongoDB healthy · Redis unavailable · Queue disabled

---

## Live environment snapshot (2026-07-07)

### Infrastructure

```
GET /health → 200
{
  "mongodb": "healthy",
  "redis": "unavailable",
  "queue": "disabled"
}
```

| Component | Status | Impact |
|-----------|--------|--------|
| MongoDB (`hr_shakya`) | Connected | Core API works |
| Redis / BullMQ | Not running locally | Background jobs disabled; cache disabled |
| SMTP (Gmail) | Configured in `.env` | Direct send works; queued emails do not |
| Backend port 4000 | Intermittently blocked | Multiple `npm run dev` attempts → `EADDRINUSE` |
| Vite proxy | `/api` → `localhost:4000` | When backend down, browser shows 500/502 |

### Workforce DB (`npm run db:diagnose-workforce`)

| Type | Count | Notes |
|------|-------|-------|
| Departments | 6 | Org master data intact |
| Designations | 9 | Org master data intact |
| Branches | 1 | Org master data intact |
| Active employees | 3 | EMP00023, EMP00024, EMP00025 |
| Portal users | 4 | Super admin has no `employeeId` (correct) |

**Reserved emails (will 409 on employee create):**
- `sachannishchal@gmail.com` — super admin login
- `nishchalsachan206.ns@gmail.com`, `nandinigupta9934@gmail.com`, `harshitshakya94@gmail.com` — active employees

---

## Remediation summary (2026-07-07)

| ID | Status | Fix |
|----|--------|-----|
| C1 | Documented | Local dev startup order in `backend/docs/DATABASE.md` |
| C2 | Fixed | `PageDataBoundary` on project/workspace detail pages |
| C3 | Fixed | Wizard finalize compensating `softDelete` on failure |
| C4 | Fixed | Scheduler jobs processed on WEBHOOK queue + direct fallback |
| C5 | Fixed | Readiness: Redis required in production only |
| H1 | Fixed | `syncDomainIndexes` includes `project_drafts` |
| H2 | Fixed | Org controllers return `ValidationError` (400) |
| H3 | Fixed | Wizard stale closure, one-time remote hydrate, draft error UI, no double toast |
| H4 | Fixed | Missing routes redirect to working pages |
| H5 | Fixed | Sales/project dashboard + kanban invalidation |
| H6 | Mitigated | `bufferCommands` enabled in development only |
| H7 | Fixed | Permission cache + employee conflict recovery logging |
| M3 | Fixed | Wizard PUT returns same DTO shape as GET |
| M4 | Fixed | `uq_project_drafts_user` duplicate hint |
| M5 | Fixed | Interview date filters pushed to Mongo query |
| M8 | Fixed | Payroll routes redirect to payroll reports |
| L4 | Fixed | Employee detail uses typed `departmentName` / `designationName` |
| L5 | Fixed | Per-widget error boundary in `widget-frame.tsx` |
| L6 | Partial | Offline requests redirect to `/network-error` |
| L8 | Fixed | `DATABASE.md` expanded (drafts, cache, queue, dev runbook) |

**Still environmental / out of scope for code-only fixes:** Redis must run in production for full queue throughput; SMTP credentials must be valid for email delivery; Cloudinary env vars required for uploads; comprehensive E2E test suite not added.

---


### C1 — Backend process instability (port 4000)

**Evidence:** Terminal logs show repeated `Port 4000 is already in use` and Vite `ECONNREFUSED` for `/api/*`.  
**Impact:** All API calls fail → frontend shows 500 across every module.  
**Fix:** Kill stale node processes; run **one** backend instance. Verify with `GET http://localhost:4000/health`.

### C2 — Detail pages infinite loading on API errors

**Files:**
- `frontend/src/features/project/pages/project-detail-page.tsx`
- `frontend/src/features/workspace/pages/workspace-profile-page.tsx`
- `frontend/src/features/workspace/pages/workspace-project-detail-page.tsx`

**Pattern:** `if (isLoading || !data) return <Loading />` — no `isError` branch.  
**Impact:** 404/403/500 → spinner forever.  
**Fix:** Use `PageDataBoundary` or explicit error UI when `isError`.

### C3 — Project wizard finalize has no transaction / rollback

**File:** `backend/src/modules/project/services/project-wizard.service.ts` (`finalizeWizard`)  
**Impact:** Partial project created (members, modules, milestones) if mid-flow fails.  
**Fix:** Mongo transaction or compensating deletes on failure.

### C4 — Scheduler jobs routed to no-op queue

**File:** `backend/src/infrastructure/queue/queue.producer.ts` (`addSchedulerJob` → `QUEUE_NAMES.WEBHOOK`)  
**File:** `backend/src/infrastructure/queue/queue.worker.ts` (WEBHOOK worker = no-op)  
**Impact:** Scheduled integration jobs never execute.

### C5 — Production requires Redis; local dev runs without it

**File:** `backend/src/config/env.schema.ts` (production `REDIS_URL` required)  
**File:** `backend/src/modules/health/health.controller.ts` (readiness fails without Redis)  
**Impact:** Render/production deploy may fail readiness; local dev has queue/cache disabled silently.

---

## High priority issues

### H1 — Index sync only runs for Employee collection

**File:** `backend/src/domain/index.ts` (`syncDomainIndexes` → `repairEmployeeUniqueIndexes` only)  
**Missing:** `project_drafts` unique index `uq_project_drafts_user`, recruitment indexes, etc.  
**Impact:** Duplicate key races, generic 409/500 on concurrent wizard saves.

### H2 — Org controllers throw raw `Error` → HTTP 500

**Files:**
- `backend/src/modules/organization/controllers/department.controller.ts:22`
- `backend/src/modules/organization/controllers/designation.controller.ts:11`

**Fix:** Use `ValidationError` / `BadRequestError` (400), not `throw new Error`.

### H3 — Project wizard draft GET — code is safe; failures are infra/auth

**Route:** `GET /api/v1/projects/wizard/draft`  
**Chain:** `project.routes.ts:115` → `getWizardDraft` → `ProjectWizardService.getDraft`  
**Expected:** `200` + `data: null` when no draft.  
**500 causes:** Mongo down, permission lookup throw, backend not running.  
**Permission required:** `project.create`

**Frontend wiring:** Correct (`project.api.ts`, `useProjectWizardDraft`).

**Wizard UX bugs (frontend):**
- Stale closure in `persistDraft()` — may save outdated step data
- `remoteDraft` merge can overwrite in-progress edits
- Double success toast on finalize
- No error UI when draft fetch fails

### H4 — Missing frontend routes (dead links)

**Constants defined but no route in `protected-routes.tsx`:**
- `ROUTES.ORGANIZATION_SETUP` (`/organization/setup`)
- `ROUTES.REPORTS`, `REPORTS_EXECUTIVE`, `REPORTS_DASHBOARD`, `REPORTS_RUN`
- `ROUTES.ANALYTICS`

**Impact:** Navigation to these URLs → 404 or wrong entity page.

### H5 — Query invalidation gaps (stale dashboards)

**Files:**
- `frontend/src/features/sales/hooks/use-sales.ts` — mutations don't invalidate dashboard/kanban keys
- `frontend/src/features/project/hooks/use-projects.ts` — sub-resource mutations don't invalidate project dashboard/kanban

**Impact:** Enterprise/manager widgets show stale counts after create/update/delete.

### H6 — MongoDB `bufferCommands: false`

**File:** `backend/src/infrastructure/database/mongodb.connection.ts`  
**Impact:** Any brief disconnect → immediate query failures (500s), no buffering.

### H7 — Swallowed errors in auth/employee flows

| Location | Behavior |
|----------|----------|
| `permission-engine.service.ts` | Cache write failure ignored → stale permissions |
| `account-activation.service.ts` | Email failure logged; activation still “succeeds” |
| `employee.controller.ts` create conflict recovery | Lookup errors swallowed |

---

## Medium priority issues

### M1 — Employee create (recent fixes + remaining notes)

**Fixed in session:**
- Removed 60s cleanup on every create
- Direct SMTP for welcome email (bypass queue)
- Email availability pre-check in UI
- Form submit button outside `<form>` (fixed with `form` attribute)
- Idempotent response when email already exists
- Query cache refetch defaults updated

**Remaining:**
- Welcome email still fails if SMTP credentials invalid (check backend logs)
- Duplicate email on genuinely new address → verify with `npm run db:check-email -- <email>`

### M2 — Email architecture split-brain

| Path | Behavior |
|------|----------|
| Employee welcome | Direct SMTP (`sendAccountCredentialsNow`) ✅ |
| Recruitment/onboarding | Queued via BullMQ — **requires Redis** |
| Dev without SMTP | Logged to console only |
| Production without SMTP | Throws `ExternalServiceError` |

### M3 — Wizard draft API inconsistency

**File:** `project-wizard.service.ts`  
- GET returns shaped DTO  
- PUT returns raw Mongoose document  
**Fix:** Normalize PUT response to match GET.

### M4 — Duplicate error hint missing for project drafts

**File:** `backend/src/shared/utils/database-error.util.ts`  
**Missing:** `uq_project_drafts_user` in `INDEX_DUPLICATE_HINTS`

### M5 — Interview service loads all records then filters in memory

**File:** `backend/src/modules/recruitment/services/interview.service.ts`  
**Impact:** Performance degradation at scale.

### M6 — Cloudinary defaults to `not-configured`

**Impact:** Document/avatar uploads fail at runtime without env vars.

### M7 — Auth replay protection disabled without Redis

**File:** `backend/src/infrastructure/redis/cache.service.ts`

### M8 — Payroll routes redirect stubs

**File:** `frontend/src/app/routes/protected-routes.tsx`  
`/payroll/*` redirects to `/employees` — may confuse users.

---

## Low priority issues

| ID | Issue | Location |
|----|-------|----------|
| L1 | No TODO/FIXME markers in backend source | Tech debt untracked |
| L2 | Most BullMQ workers are no-op placeholders | `queue.worker.ts` |
| L3 | `as any` in API pagination unwrap | Multiple `*.api.ts` files |
| L4 | Employee detail uses `(employee as any).designationName` | `employee-detail-page.tsx` |
| L5 | Widget lazy loads lack per-widget error boundary | `widget-registry.ts` |
| L6 | Status pages (`/500`, `/network-error`) never navigated to programmatically | `status-pages.tsx` |
| L7 | Only 1 backend test file | `backend/tests/search.helper.test.ts` |
| L8 | `DATABASE.md` incomplete (no project_drafts, cache, queue notes) | `backend/docs/DATABASE.md` |

---

## Module-by-module audit

### Auth & RBAC
- ✅ Super admin in `users` only; JWT + token version validation
- ✅ Company scope middleware on tenant routes
- ⚠️ Permission cache write failures silent
- ⚠️ Portal permission sync failures logged but `/auth/me` continues

### Employee / HR
- ✅ Create rollback on post-create failure
- ✅ Email availability validation (employee + portal user + super admin)
- ✅ Workforce cleanup script preserves org master data
- ⚠️ Welcome email depends on SMTP credentials being valid
- ⚠️ Hard purge on delete — irreversible

### Organization (master data)
- ✅ Departments, designations, branches preserved during workforce cleanup
- ❌ Invalid ID throws generic Error → 500

### Projects
- ✅ Wizard routes ordered before `/:id`
- ✅ Auto-generated project codes
- ❌ Wizard finalize not transactional
- ❌ Draft index not synced at startup
- ❌ Frontend wizard state sync bugs

### Recruitment
- ✅ Interview validation (past dates, rejected candidates)
- ⚠️ Candidate conversion requires sent offer (422 — correct but strict)
- ⚠️ Emails queued — need Redis in production

### Attendance / Leave / Payroll
- ⚠️ Limited automated test coverage
- ⚠️ Payroll UI mostly stub redirects

### Sales / Communication
- ⚠️ Dashboard cache invalidation incomplete after mutations
- ⚠️ Mark-read mutations toast on every action (no debounce)

### Integration
- ⚠️ Scheduler jobs broken (routed to no-op queue)
- ⚠️ Connector health endpoint exists; workers don't process scheduled jobs

### Reports / Analytics
- ❌ Frontend routes not registered — module non-functional in UI

---

## Database architecture audit

See also: `backend/docs/DATABASE.md`

### Identity model (correct)

```
Super Admin  →  users (no employeeId)
Employees    →  employees + optional users link
HR Admins    →  employees with roles
```

### Collections at risk

| Collection | Risk | Mitigation |
|------------|------|------------|
| `employees` | Unique email index | Validated at create; partial index on active rows |
| `users` | Unique email per company | Checked in `assertEmailAvailableForCreate` |
| `project_drafts` | Unique (companyId, userId) | Index may not exist on old DBs — run `syncIndexes` |
| `cache_entries` | TTL cache mirror | Falls back when Redis down |

### Recommended DB maintenance commands

```bash
# Workforce identity cleanup (never touches org master data)
npm run db:purge-system-garbage --workspace=@hr-shakya/backend

# Inspect employees/users
npm run db:diagnose-workforce --workspace=@hr-shakya/backend

# Check if email can be used for new employee
npm run db:check-email --workspace=@hr-shakya/backend -- someone@example.com
```

### Missing from DATABASE.md

- `project_drafts` collection
- Index sync policy (employee-only at startup)
- `cache_entries` fallback behavior
- Queue/email dependency on Redis

---

## Frontend architecture audit

### Query cache (recently improved)

**File:** `frontend/src/shared/api/query-config.ts`  
- Now: `staleTime: 0`, refetch on mount/focus/reconnect  
- Master data: 60s stale (acceptable)

**Remaining:** Module-specific invalidation gaps (sales/project dashboards).

### Error handling matrix

| Layer | Status |
|-------|--------|
| Root error boundary | ✅ `app-error-boundary.tsx` |
| Router error fallback | ✅ `route-error-fallback.tsx` |
| Mutation errors | ✅ `parseMutationError` + toasts |
| Query errors | ❌ Inconsistent — many pages missing |
| HTTP 500 redirect | ❌ Never uses `/500` status page |

### Form / dialog patterns

- ✅ `FormDialog` now links footer submit to form via `form` attribute + `useId`
- ⚠️ Double toast when both `runFormMutation` and `useAppMutation.successMessage` set

### Build / TypeScript

- ✅ Strict mode enabled
- ✅ Production build passes
- ⚠️ Fixed during session: `lazy-route.ts` → `lazy-route.tsx`, broken `ParsedMutationError` interface

---

## Backend architecture audit

### Error handling pipeline

```
Controller → Service → Repository
     ↓ throw AppError / Mongo error
error-handler.middleware → ErrorHandlerService
     ↓
normalizeDatabaseError (11000 → 409)
handleAppError / handleUnknownError (→ 500)
```

**Gap:** Raw `throw new Error()` bypasses operational classification.

### Queue / email pipeline

```
QueueProducer.addEmailJob
  ├─ Redis available → BullMQ queue → processEmailJob → SMTP
  └─ Redis unavailable → deliverEmailPayload (direct SMTP)

Employee welcome email → sendAccountCredentialsNow (direct, bypasses queue)
```

### Security notes

- ✅ JWT secrets min 32 chars enforced
- ✅ Field encryption key required
- ✅ Production cookie flags enforced in env schema
- ⚠️ Default SMTP placeholder `not-configured` — must override for real email
- ⚠️ CORS/FRONTEND_URL must match deployment origin for email links

---

## Testing & CI gaps

| Area | Coverage |
|------|----------|
| Backend unit tests | 1 file (`search.helper.test.ts`) |
| Frontend tests | None found |
| E2E tests | None found |
| Pre-commit | ESLint on staged backend files |
| Typecheck | Backend + frontend build |

**Recommendation:** Add integration tests for: auth login, employee create, project wizard draft CRUD, email mock.

---

## Bug → symptom quick reference

| Browser console | Likely cause | Verify |
|-----------------|--------------|--------|
| `api/v1/* 500` + `ECONNREFUSED` in Vite terminal | Backend not running | `GET /health` |
| `api/v1/projects/wizard/draft 500` | Same as above, or Mongo down, or auth | Backend logs `[ERROR] GET ...` |
| `api/v1/employees 409` | Email already used | `db:check-email` |
| Page spins forever | Query failed, no error UI | Network tab status code |
| Email not received | SMTP auth fail, or queued without Redis | Backend logs `Email sent` or `SMTP` |
| `/reports/*` 404 | Route not registered | `protected-routes.tsx` |

---

## Recommended fix roadmap

### Phase 1 — Stop the bleeding (1–2 days)

1. Stabilize dev environment: single backend on 4000, document startup order
2. Add `isError` handling to all detail pages using `PageDataBoundary`
3. Fix org controller `throw new Error` → proper 400 errors
4. Fix project wizard `persistDraft` stale closure
5. Register missing routes OR remove dead nav links

### Phase 2 — Data integrity (3–5 days)

1. Add `syncDomainIndexes` for `project_drafts`, critical recruitment indexes
2. Wrap wizard `finalizeWizard` in transaction or rollback
3. Fix `addSchedulerJob` queue routing
4. Extend mutation invalidation to dashboard/kanban query keys

### Phase 3 — Production hardening (1–2 weeks)

1. Redis required + worker health in `/health`
2. Integration test suite for core flows
3. Complete `DATABASE.md` + runbook for Render deploy
4. Per-widget error boundaries on enterprise dashboard
5. Unified `parseQueryError` for consistent query failure UX

---

## Verification checklist (run after fixes)

```bash
# 1. Backend health
curl http://localhost:4000/health

# 2. Typecheck
npm run typecheck --workspace=@hr-shakya/backend
npm run build --workspace=@hr-shakya/frontend

# 3. DB state
npm run db:diagnose-workforce --workspace=@hr-shakya/backend

# 4. Email config (backend logs on startup should show SMTP host/user)
# 5. Create employee with NEW email — should 201, list refreshes, email in logs/inbox
# 6. Open project wizard — GET /api/v1/projects/wizard/draft should 200 (null or draft)
```

---

## Appendix — files changed during recent stabilization session

| Area | Files |
|------|-------|
| Employee create | `employee.service.ts`, `employee-validation.service.ts`, `employee.controller.ts`, `employee-account.service.ts` |
| Email | `recruitment-email.service.ts` (direct send) |
| Frontend UX | `employee-create-dialog.tsx`, `form-dialog.tsx`, `query-config.ts`, `lazy-route.tsx` |
| DB scripts | `purge-system-garbage.ts`, `check-email.ts`, `diagnose-workforce.ts` |

---

*This audit should be re-run after Phase 1 fixes and before production deploy.*

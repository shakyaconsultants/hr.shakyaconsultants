# HR Shakya ERP — Project Story

**Last updated:** 2026-07-09  
**Audience:** Founders, engineers, and future maintainers  
**Purpose:** One document that explains what this product is, how it was built, what was over-engineered, what we simplified, and where things stand today.

---

## 1. What this project is

**HR Shakya** is a multi-tenant ERP platform focused on HR operations for a small company (~10 employees, ~10 projects). It is not a generic SaaS built for thousands of tenants — it is a **real internal ERP** that grew from a “production-grade foundation” into a full modular monolith with many business modules.

### Product scope (today)

| Area | What it does |
|------|----------------|
| **Auth & RBAC** | Company-scoped login, JWT + HttpOnly cookies, roles/permissions, three portals |
| **Organization** | Departments, designations, branches, shifts, holidays, master data |
| **Employees** | CRUD, lifecycle, portal accounts, onboarding, documents, org chart |
| **Recruitment** | Candidates, pipeline, interviews, offers, onboarding from hires |
| **Projects** | Wizard create, tasks, sprints, KB/deployment notes, member roles |
| **Workspace** | Employee self-service: tasks, projects, profile, calendar, notifications |
| **Manager** | Team dashboards, approvals inbox, attendance/leave views |
| **Enterprise** | Admin/HR dashboards, employee management, org-wide KPIs |
| **Leave & Exit** | Policies, balances, requests, calendar, offboarding |
| **Attendance** | Punch, corrections, monthly processing |
| **Payroll** | Compensation, grades, payslips (module depth varies) |
| **Sales** | Leads, pipeline, follow-ups |
| **Communication** | Announcements, channels, direct messages |
| **Approvals** | Workflow engine, inbox, history |
| **Reports** | Role dashboards, report catalog |
| **Integration** | Connectors, webhooks, API keys, scheduler UI (partially wired) |
| **Settings** | Navigation, feature flags, system config |
| **Portal** | Public onboarding + account activation links |

### Deployment (production)

| Service | Host | URL pattern |
|---------|------|-------------|
| **Backend API** | Render (Node web service) | `https://hr-shakyaconsultants.onrender.com` |
| **Frontend SPA** | Vercel (or Render static) | `https://hr-shakyaconsultants-frontend.vercel.app` |
| **Database** | MongoDB Atlas | `mongodb+srv://...` |
| **Email** | Gmail SMTP (Nodemailer) | Direct send, no queue |
| **Files** | Cloudinary | Uploads when configured |

Cross-origin auth: frontend and API are on **different domains**, so production uses `AUTH_COOKIE_SAME_SITE=none`, `AUTH_COOKIE_SECURE=true`, and `VITE_AUTH_USE_HTTP_ONLY_COOKIES=true`.

---

## 2. Architecture (current — simplified)

```
Browser (React/Vite on Vercel)
        │  HTTPS + credentials (cookies)
        ▼
Express API (Node 20 on Render)  ──►  MongoDB Atlas
        │                              (data + cache_entries)
        ├── Nodemailer ──► SMTP (Gmail)
        ├── Cloudinary ──► file storage
        └── Socket.io (disabled in prod: SOCKET_ENABLED=false)
```

### Backend shape

- **Pattern:** Modular monolith — `controllers → services → repositories`
- **API:** REST under `/api/v1` with a standard `{ success, data, meta }` envelope
- **Domains:** Mongoose schemas in `backend/src/domain/`, feature logic in `backend/src/modules/`
- **~20 backend modules**, ~500 TypeScript files — large for a 10-person team

### Frontend shape

- **React 18 + Vite + TypeScript**
- **TanStack Query** for server state, **Zustand** for auth/session
- **Tailwind + shadcn/ui**
- **Three portals:** Enterprise (admin/HR), Manager, Workspace (employee)
- **Module registry** drives navigation, routes, and feature flags (~1,000+ lines)

### Repo layout

```
hr-shakya/
├── backend/          # Express API
├── frontend/         # React SPA
├── docs/             # System audit (SYSTEM-AUDIT.md)
├── backend/docs/     # Database architecture (DATABASE.md)
├── .ai/              # Historical architecture, ADRs, audits (partially stale)
├── render.yaml       # Render blueprint (API + static frontend)
└── story.md          # This file
```

---

## 3. How we got here — the original vision

The project started as **“Phase 0: production foundation”** with explicit goals from `.ai/constitution.md` and `.ai/architecture.md`:

- Multi-tenant ERP-grade platform
- Stateless API + **Redis** for cache, sessions, rate limits
- **BullMQ workers** for email, payroll, imports, reports
- Separate **worker process** from API
- Socket.io for realtime
- Full **integration hub** (webhooks, scheduler, connectors, backups)
- PostgreSQL was mentioned early in architecture docs; **MongoDB** was chosen in implementation

ADRs **ADR-002 (Redis)** and **ADR-003 (BullMQ)** were accepted in 2025-06-25. The roadmap scheduled BullMQ for payroll PDFs, bulk imports, report exports, and email dispatch.

**The intent was correct for a large SaaS. The team size was not.**

---

## 4. Over-engineering — what was wrong

This section is the heart of the story: infrastructure and patterns that added **operational cost** without helping a ~10-user deployment.

### 4.1 Redis + BullMQ + workers

**What we had:**

- `ioredis` + `bullmq` in `package.json`
- `REDIS_URL` required in production
- `redis.client.ts`, `bullmq.connection.ts`, `queue.worker.ts`, email/scheduler **processors**
- Separate worker boot path; API called `initializeQueues()` on startup
- Render crashes when Redis connected but queue init order was wrong (`initializeQueues()` before `queuesEnabled` — documented in `.ai/changelog.md`)

**Why it was overkill:**

- ~10 users do not need horizontal workers or job queues for password reset and interview invites
- Email volume is dozens per day, not thousands per minute
- Redis on Render = extra cost, extra failure mode, extra env var
- Slow SMTP blocked HTTP anyway when jobs ran inline through queue wrappers

**What broke in practice:**

- Deploy failed without `REDIS_URL`
- Queue init race crashed production boot
- “Email queued” logs but **notification jobs returned `'skipped'`** after partial removal
- Integration dashboard showed **“email queue pending”** when no queue existed

### 4.2 Auth bootstrap splash (frontend)

**What we had:**

- Blocking **auth bootstrap** on every app load (`auth-bootstrap.ts`, `bootstrap-splash.tsx`, `bootstrap-profiler.ts`)
- Complex states: loading → restoring → authenticated
- `/auth/me` had to succeed before the UI rendered
- Slow login (~30s perceived) when `/auth/me` errored or timed out

**Why it was overkill:**

- A small ERP does not need a gated splash screen for session restore
- Employees expect: open app → see login or dashboard immediately
- Bootstrap made **every** network blip feel like the app was broken

**What broke:**

- `GET /auth/me` 500 blocked the entire UI
- Expired sessions required manual cookie clearing
- Users saw long spinner instead of login form

### 4.3 Integration platform (UI ahead of backend)

**What we had:**

- 8+ integration pages: dashboard, connectors, API keys, webhooks, scheduler, imports, exports, backups
- Frontend DTOs **did not match** backend responses (flat vs nested dashboard, `provider` vs `type`, paginated vs array)
- Scheduler UI with cron fields but **no cron runner** — `runScheduledJobPayload()` only updated DB status
- “Test email” in admin returned success without sending

**Why it was overkill:**

- A 10-person company needs **SMTP in `.env`** and maybe Cloudinary — not a mini Zapier
- Building the UI before contracts were stable created **false confidence** (“Integration hub looks done”)

### 4.4 Notification + Socket.io stubs

**What we had:**

- `QueueProducer.addNotificationJob()` called from 8+ event services
- After queue removal: methods returned **`'skipped'`** — no-op
- `NotificationService.send()` handlers only **logged**, never delivered email/push
- Socket.io initialized on server; **no frontend client**

**Why it was overkill:**

- Realtime push for 10 users is unnecessary
- In-app DB notifications work; queue indirection did not

### 4.5 Session cache + JWT defaults

**What we had:**

- In-memory session cache (not shared across Render instances)
- `SessionCacheService.invalidateUser` cleared **all company sessions** (ignored `userId`)
- Default `JWT_ACCESS_EXPIRES_IN=15m` — users logged out every 15 minutes
- No proactive token refresh on frontend
- Refresh cookie path `/api/v1/auth` (legacy) blocked silent refresh on other routes

**Why it hurt:**

- Cross-origin Vercel + Render is already hard; 15-minute tokens made it worse
- Refresh-on-401-only meant one expired request = logout cascade

### 4.6 Data model / index footguns

**Example — employee create 409 (production, 2026-07-08):**

- Employee was **created successfully** (audit log proved it)
- Then `OnboardingService.startForEmployee()` inserted onboarding **without `candidateLeadId`**
- Unique index `uq_onboardings_company_candidate` on `{ companyId, candidateLeadId }` treats missing as `null`
- **Second employee ever** → MongoDB duplicate key → 409 → **full rollback** (employee deleted)
- Request took **12+ seconds** because SMTP welcome email was awaited on the HTTP thread

This is over-engineering meets schema oversight: onboarding was designed for **recruitment candidates**, not employee-only paths.

### 4.7 Documentation and Docker drift

Long after Redis was removed from runtime:

- `README.md` still said `docker compose up mongodb redis`
- `docker-compose.yml` still ran Redis
- `.ai/architecture.md` still diagrammed PostgreSQL + Redis + workers
- `backend/docs/DATABASE.md` originally said Redis required for production readiness

**Symptom:** New deploys followed wrong docs and reintroduced complexity.

### 4.8 Scale of code vs team

| Artifact | Approx. size | Problem for 10 users |
|----------|--------------|----------------------|
| RBAC permission catalog | ~1,300 lines | Many permissions unused in UI |
| Settings config catalog | ~1,000 lines | Same |
| Frontend module registry | ~1,100 lines | Heavy for 3 portals |
| 20 backend modules | ~500 TS files | High navigation cost |
| 10+ status error routes | Many pages | Could be 2–3 generic pages |

---

## 5. What we optimized — remediation timeline

### Phase 0 → “big ERP” (2025)

Built modules, portals, RBAC, recruitment, projects, payroll stubs, integration UI, Redis, BullMQ, auth bootstrap, Render deploy.

### Production stabilization (2025-06)

- SPA rewrites for Vercel (`vercel.json`, `_redirects`)
- `AUTH_COOKIE_SAME_SITE=none` for cross-origin
- Payroll/reports API path alignment
- Portal routing fixes, searchable selects for master data
- BullMQ init order crash fix on Render

### Redis/BullMQ removal + system audit (2026-07-08)

Documented in `docs/SYSTEM-AUDIT.md`. Phases A–D:

| Phase | What changed |
|-------|----------------|
| **A — Fix broken contracts** | Integration dashboard flat DTO; FE adapters for connectors/API keys/scheduler; workspace env var redaction; SMTP health from env; admin test email actually sends |
| **B — Remove dead infra** | Deleted `bullmq`, `ioredis`; removed `queue.producer.ts`, `queue.constants.ts`, empty `redis/` and `queue/` dirs; renamed `queueLogger` → infrastructure logger |
| **C — Simplify runtime** | Notifications marked `sent` in DB (removed no-op queue calls); scheduler labeled manual-only; `SOCKET_ENABLED=false` default; session cache `invalidateUser` fixed |
| **D — Deploy & resilience** | Webhook inline retries; settings `/system/health` route; `render.yaml` static frontend service; docker-compose without Redis; `backend/docs/DATABASE.md` rewritten for Mongo-only |

### Auth simplification (2026-07-08, commit `dfdc9ee`)

- **Removed** auth bootstrap splash entirely
- Auth states: `RESTORING` → `AUTHENTICATED` / `UNAUTHENTICATED`
- App renders immediately; protected routes restore session in background
- `JWT_ACCESS_EXPIRES_IN` default **8h** (was 15m)
- HttpOnly cookie path fixed to `/`
- Proactive token refresh scheduler (frontend)
- Rate limit tuning for small team (2000 req/window, refresh 120/15min)

### Employee create + session fixes (2026-07-09)

- Onboarding uses `candidateLeadId: employee:{employeeId}` — fixes duplicate key 409
- Onboarding failure no longer rolls back entire employee
- Welcome email sent **in background** — API returns in ~2–3s instead of 12s+
- Session restore: **`/auth/me` first**, refresh only on 401 (fixes refresh logout on page reload)
- Removed redundant refresh-after-restore that could clear valid sessions
- `markCookieSessionActive()` on successful restore in cookie mode
- Email preflight unified: `prepareEmailForCreate()` for check-email and create

---

## 6. Production issues we debugged (war stories)

### 6.1 Auto-logout after 15–20 minutes

**Logs:**

```
PUT /api/v1/projects/wizard/draft → 401 (2ms)
POST /auth/logout
POST /auth/login
```

**Cause:** Access token expired; no proactive refresh; refresh cookie path issues on older deploys.

**Fix:** 8h access token, proactive refresh ~2 min before expiry, cookie path `/`, visibility-change refresh.

### 6.2 Auto-logout on page refresh

**Cause:** Session restore called **refresh before `/me`**; failed refresh cleared cookies even when access cookie was still valid.

**Fix:** Try `fetchMe()` first; refresh only on 401; do not clear session on transient network errors.

### 6.3 Employee create 409 despite “email available”

**Cause:** Not email — **onboarding unique index collision** after employee was already created; rollback made it look like “create failed.”

**Fix:** Synthetic `candidateLeadId`, non-blocking onboarding/email, unified email preflight.

### 6.4 Rate limit 429 on wizard + misleading “Too many login attempts”

**Cause:** Global rate limit + aggressive login limit; frontend retried 429s and showed wrong message.

**Fix:** Higher limits for small deployment; no retry on 429; message only for login endpoints.

### 6.5 Render cold start + `injected env (0) from .env`

Render runs without a committed `.env` — env comes from dashboard. `bootstrap-env.ts` validates before logger imports and prints clear `=== startup failed ===` if secrets missing.

---

## 7. Current stack (authoritative)

### Backend (`backend/package.json`)

| Tech | Role |
|------|------|
| Node 20+ | Runtime |
| Express 5 | HTTP |
| TypeScript 5.8 | Language |
| Mongoose 9 | MongoDB ODM |
| Zod | Env + validation |
| Nodemailer | **Direct SMTP** (no queue) |
| Winston + Morgan | Logging |
| bcrypt + JWT | Auth |
| Cloudinary | Media |
| Socket.io | Optional (off in prod) |

**Removed:** `bullmq`, `ioredis`, Redis config, worker process, queue processors.

### Frontend

| Tech | Role |
|------|------|
| React 18 + Vite | UI |
| TanStack Query | Server cache |
| Zustand | Auth store (minimal persist) |
| Axios | API client (`withCredentials: true`) |
| React Router | Portal-aware routes |

**Removed:** Bootstrap splash, blocking auth loader, bearer-token-only assumptions in cookie mode.

### Cache

- **MongoDB `cache_entries` collection** — permissions, master data, replay keys
- No Redis

### Email

- **Synchronous SMTP** on user action (forgot password, interview invite, employee welcome)
- Employee welcome email: **background** after create (does not block response)
- Requires `SMTP_*` on Render — Gmail app password in production logs: `smtp.gmail.com:587`

---

## 8. Environment variables (production checklist)

### Render API (`hr-shakya-api`)

```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
JWT_ACCESS_SECRET=<32+ chars>
JWT_REFRESH_SECRET=<32+ chars>
JWT_ACCESS_EXPIRES_IN=8h
JWT_REFRESH_EXPIRES_IN=30d
FIELD_ENCRYPTION_KEY=<32+ chars>
FRONTEND_URL=https://hr-shakyaconsultants-frontend.vercel.app
AUTH_USE_HTTP_ONLY_COOKIES=true
AUTH_COOKIE_SECURE=true
AUTH_COOKIE_SAME_SITE=none
CORS_CREDENTIALS=true
SOCKET_ENABLED=false
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASSWORD=...
SMTP_FROM_EMAIL=...
SMTP_FROM_NAME=HR Shakya ERP
CLOUDINARY_*  (optional, for uploads)
```

### Vercel / static frontend

```env
VITE_API_BASE_URL=https://hr-shakyaconsultants.onrender.com
VITE_AUTH_USE_HTTP_ONLY_COOKIES=true
```

**Rule:** `FRONTEND_URL` must exactly match the browser origin (no trailing slash).

---

## 9. What still works vs what is stubbed

### Works well (core ERP)

- Login / logout / session restore (after 2026-07-09 fixes)
- Employee CRUD, org chart, master data
- Recruitment pipeline + emails on action
- Project wizard, tasks, enterprise/manager/workspace portals
- Leave calendar, approvals inbox
- Direct transactional email when SMTP configured
- MongoDB-only health/readiness

### Partially working / deferred

| Feature | Status |
|---------|--------|
| Integration scheduler | UI exists; cron not running — manual-only |
| Socket.io realtime | Server init only; disabled in prod |
| Push/email from notification events | DB notification only |
| Some integration pages | Fixed DTOs but low priority for small team |
| Payroll depth | API exists; UI coverage varies |
| Automated backups in integration hub | Not implemented |

### Known Mongoose warnings (harmless)

- `errors` reserved schema pathname
- `new` option deprecated on `findOneAndUpdate` — use `returnDocument: 'after'` (cleanup backlog)

---

## 10. Principles we adopted (small-team ERP)

1. **MongoDB is the source of truth** — cache is optional via `cache_entries`, not Redis.
2. **Email sends directly** — no queue unless volume justifies it (it does not yet).
3. **No blocking auth bootstrap** — show UI immediately; restore session in background on protected routes.
4. **Long-lived sessions for small teams** — 8h access token + proactive refresh, 30d refresh token.
5. **Fail employee create soft** — onboarding/email must not roll back a valid employee record.
6. **Do not build UI for infrastructure you do not run** — integration hub trimmed to real needs (SMTP, Cloudinary).
7. **One deploy surface per concern** — API on Render, SPA on Vercel, DB on Atlas.
8. **Docs must match runtime** — if Redis is gone, README and Docker must not mention it.

---

## 11. Key files (quick reference)

| Topic | Path |
|-------|------|
| API entry | `backend/src/main.ts` → `server.ts` → `app.ts` |
| Env validation | `backend/src/bootstrap-env.ts`, `config/env.schema.ts` |
| Auth cookies | `backend/src/modules/auth/utils/cookie.util.ts` |
| Employee create | `backend/src/modules/employee/services/employee.service.ts` |
| Onboarding fix | `backend/src/modules/recruitment/services/onboarding.service.ts` |
| Direct email | `backend/src/infrastructure/email/email.service.ts` |
| Mongo cache | `backend/src/infrastructure/cache/cache.service.ts` |
| Session restore | `frontend/src/shared/auth/auth-session.ts` |
| Token refresh scheduler | `frontend/src/shared/auth/auth-token-refresh-scheduler.ts` |
| Auth provider | `frontend/src/app/providers/auth-provider.tsx` |
| Deploy blueprint | `render.yaml` |
| Render env guide | `backend/RENDER.md` |
| Full audit | `docs/SYSTEM-AUDIT.md` |
| Database rules | `backend/docs/DATABASE.md` |

---

## 12. Summary in one paragraph

HR Shakya started as an ambitious, **enterprise-shaped** ERP — Redis, BullMQ workers, blocking auth bootstrap, integration hub, Socket.io, and hundreds of permissions — built for scale a **~10-person company does not need**. Production pain (Render Redis crashes, 15-minute logouts, 30-second login splash, employee 409 rollbacks, fake queue metrics) forced a **simplicity pass**: Mongo-only cache, direct SMTP, immediate React auth, 8-hour sessions, honest stubs, and fixes to real bugs like onboarding unique indexes. The codebase is still large, but the **runtime** is now appropriate for the team: one API, one SPA, one database, email on click, and session restore that tries `/me` before tearing down cookies.

---

## 13. Related documentation

| Document | Use when |
|----------|----------|
| [`README.md`](README.md) | Local dev setup (note: some Redis references may remain — prefer this `story.md` for infra truth) |
| [`docs/SYSTEM-AUDIT.md`](docs/SYSTEM-AUDIT.md) | Detailed P0/P1/P2 issue list and remediation checklist |
| [`backend/docs/DATABASE.md`](backend/docs/DATABASE.md) | Collections, purge rules, cache/email behavior |
| [`backend/RENDER.md`](backend/RENDER.md) | Minimum Render env vars |
| [`.ai/architecture.md`](.ai/architecture.md) | Historical design (Redis/BullMQ — **superseded** for runtime) |
| [`.ai/changelog.md`](.ai/changelog.md) | Session-by-session change log |
| [`.ai/constitution.md`](.ai/constitution.md) | Original engineering rules (still useful for code style) |

---

*This story should be updated when major architecture or deployment decisions change.*

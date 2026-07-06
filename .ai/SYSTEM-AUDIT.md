# HR Shakya — System Audit (Post-Stabilization)

**Date:** 2026-07-05 (re-audit)  
**Scope:** Full stack — backend, frontend, infra, security, module flows  
**Status:** **Ready for manual QA** with documented known limitations

---

## Executive Summary

HR Shakya is a multi-tenant HR ERP (Express + MongoDB + React/Vite). After stabilization work, the system is **functionally complete for core HR operations** with simplified navigation, per-employee payroll, terminal-only seeding, and mounted reports API.

| Check | Result |
|-------|--------|
| Backend typecheck | Pass |
| Frontend typecheck | Pass |
| Frontend production build | Pass |
| Backend tests | 3/3 pass (`search.helper.test.ts`) |
| All 17 API modules mounted | Yes |
| Nav simplified (single dashboard links) | Yes |
| Payroll on employee profile | Yes |

**Manual QA:** Follow [TESTING-GUIDE.md](./TESTING-GUIDE.md)

---

## Architecture Snapshot

| Layer | Stack |
|-------|-------|
| Backend | Node 20+, Express 5, TypeScript, MongoDB/Mongoose, Redis (optional), BullMQ, Zod, Swagger |
| Frontend | React 18, Vite 6, React Router 7, TanStack Query, Zustand, Tailwind/shadcn |
| Auth | JWT + refresh rotation; optional HttpOnly cookies |

### Backend modules (all mounted on `/api/v1`)

auth, organization, settings, rbac, employee, recruitment, project, workspace, approval, leave-exit, attendance, payroll, sales, communication, integration, **reports**, portal

---

## Module Readiness Matrix

| Module | Nav | Routes | API | Notes |
|--------|-----|--------|-----|-------|
| Auth / login | — | OK | OK | Terminal seed only; no HTTP bootstrap |
| Enterprise dashboard | OK | OK | OK | Widgets permission-filtered |
| Organization | OK | OK | OK | Nested org setup nav kept |
| RBAC | OK | OK | OK | Simulator via `/rbac/simulator` |
| Employees | OK | OK | OK | Full lifecycle |
| **Payroll** | Removed (profile tab) | Redirect legacy URLs | OK | Upload per employee + workspace profile |
| Recruitment | Single link | OK | OK | Sub-pages via in-dashboard nav |
| Leave & exit | Single link | OK | OK | Sub-pages via LeaveExitNav |
| Attendance | Single link | OK | OK | Portal hub redirects by role |
| Projects | OK | OK | OK | |
| Sales | Single link | OK | OK | Follow-up complete fixed (PATCH) |
| Communication | Single link | OK | OK | |
| Approvals | OK | OK | OK | |
| Integrations | OK | OK | **Mostly OK** | API paths aligned; backup verify N/A |
| Reports | No nav (URL only) | OK | OK | Backend mounted; no unified reports UI |
| Workspace | OK | OK | OK | Payroll on My Profile tab |

---

## Fixes Applied (2026-07-05 session)

### Security & backend
- Super-admin auth checks active `EmployeeRole`, not stale JWT roleIds
- Locked accounts rejected in auth middleware; sessions revoked on lock
- Reports routes mounted on v1 router
- Reports PATCH settings uses `SETTINGS_MANAGE` permission
- Company scope plugin extended to write operations
- Regex escaping in communication/integration search services
- Bootstrap HTTP wizard removed; seed via `npm run seed` only
- `/health/ready` endpoint added

### Frontend & UX
- Nav flattened: Recruitment, Leave, Sales, Communication, Attendance → single dashboard links
- Duplicate Administration sections merged
- Payroll removed from sidebar; lives on employee profile + workspace profile
- Sales `/sales` and Communication `/communication` load dashboards directly
- Integration API client aligned to backend routes
- Sales follow-up completion uses PATCH (was 404 POST)
- Dead portal pages removed (payroll/sales/communication portal redirects)
- Orphan payroll pages removed (enterprise/finance/hr/workspace)
- `/admin/audit` removed from route registry (no page/backend)
- Org chart: admin under HQ, Administration dept hidden when empty

### Professional ERP cleanup (2026-07-05)
- **Overview** nav group: Company Dashboard at top level (removed duplicate from Administration)
- Administration trimmed: Role Templates removed from sidebar (still at `/rbac/templates`)
- System nav: Settings link added; Integrations duplicate Dashboard child removed
- Workspace sidebar: removed Search, Documents, Notifications, Announcements (routes still work; widgets cover announcements/notifications)
- Manager nav: Leave renamed to **Leave & Time Off**
- Enterprise dashboard: 5 KPI widgets (headcount, approvals, attendance, leave, recruitment)
- Manager dashboard: 5 KPI widgets (team size, approvals, leave, attendance, interviews)
- Quick actions: 6 core actions (Employee, Candidate, Holiday, Project, Role, Workflow)
- Workspace widget catalog trimmed; placeholder widgets hidden by default

---

## Known Limitations (non-blocking for QA)

| ID | Area | Description | Workaround |
|----|------|-------------|------------|
| LIM-01 | Reports | No unified Reports nav; module report pages at `/attendance/reports`, etc. | Use direct URLs |
| LIM-02 | Integrations | Backup verify not implemented server-side | Verify button removed |
| LIM-03 | Integrations | Webhook delivery retry re-triggers test webhook | Use test webhook |
| LIM-04 | Integrations | API key PATCH not supported | Rotate/revoke instead |
| LIM-05 | Import txn | Import execute may partial-commit on failure | Re-run failed imports |
| LIM-06 | Tests | Only 3 unit tests; no E2E | Manual QA guide |
| LIM-07 | CI/CD | No GitHub Actions pipeline | Run typecheck/build locally |
| LIM-08 | Docker | Compose env may fail strict prod validation | Use local dev stack |
| LIM-09 | Socket.io | Unauthenticated connections | Disable in prod until fixed |
| LIM-10 | CSRF | No CSRF tokens with cookie auth | Use bearer tokens in dev |

---

## Open Issues (prioritized)

### Critical — address before production

| ID | Issue | Location |
|----|-------|----------|
| CRIT-03 | Import execute transaction ignores Mongo session | `import-platform.service.ts` |
| CRIT-04 | Minimal automated test coverage | `backend/tests/` |

### High — security / ops

| ID | Issue |
|----|-------|
| HIGH-05 | Portal token routes lack rate limiting |
| HIGH-06 | No CSRF with HttpOnly cookies |
| HIGH-10 | In-memory rate limits (not Redis-backed) |
| HIGH-11 | localStorage tokens default in dev |
| HIGH-18 | No CI/CD pipeline |
| HIGH-19 | Docker Compose NODE_ENV mismatch |
| HIGH-20 | Redis missing from docker-compose |
| HIGH-22 | Socket.io unauthenticated |

### Medium / low

See prior audit sections MED-01 through LOW-20 for documentation drift, async search races, session management endpoints not exposed, CSP headers, seed script gitignore, etc. Most do not block functional QA.

---

## Navigation Structure (current)

### Enterprise — Overview
- Dashboard → `/enterprise`

### Enterprise — People & HR
- Employees
- Recruitment → `/recruitment`
- Leave & Time Off → `/leave-exit`
- Attendance → `/attendance`

### Enterprise — Operations
- Projects
- Sales → `/sales`
- Communication → `/communication`

### Enterprise — Administration
- Organization Setup (Company, Org Chart, Branches, Departments, Designations, Work Shifts, Holiday Calendar)
- Roles, Permissions, Approval Inbox, Approval Workflows

### Enterprise — System
- Settings → `/system/settings`
- Integrations (Connectors, API Keys, Webhooks, Import, Export, Scheduler, Logs, Backups)

### Manager portal
- Dashboard, Team Directory, Recruitment, Leave & Time Off, Team Attendance
- Operations: Projects, Sales Team, Approvals, Communication

### Workspace (employee) portal
- Dashboard, My Profile, My Projects, My Position, My Tasks, Leave & Time Off, Messages, My Calendar, Check In/Out, My Leads (sales role)

### Payroll access
- **Admin:** Employees → [person] → Payroll tab
- **Employee:** My Profile → Payroll tab
- **Reports:** `/payroll/reports`

---

## Pre-Release Checklist

- [ ] MongoDB running
- [ ] Backend `npm run dev` — no startup errors
- [ ] Frontend `npm run dev` — loads login
- [ ] Admin login works (existing DB — do not re-seed)
- [ ] `npm run typecheck` + `npm run build` pass both packages
- [ ] `npm test` passes in backend
- [ ] Complete [TESTING-GUIDE.md](./TESTING-GUIDE.md) sections 2–4
- [ ] Rotate JWT secrets for staging/production
- [ ] Set `AUTH_USE_HTTP_ONLY_COOKIES=true` in production

---

## Verification Commands

```bash
# Backend
cd backend
npm run typecheck
npm test
npm run dev

# Frontend
cd frontend
npm run typecheck
npm run build
npm run dev

# Health (backend running)
curl http://localhost:4000/health
curl http://localhost:4000/health/ready
```

---

## Related Documents

- [TESTING-GUIDE.md](./TESTING-GUIDE.md) — step-by-step QA for every module
- `.ai/PRODUCTION-STABILIZATION.md` — prior stabilization notes (if present)
- `README.md` — setup instructions

---

*Previous issue inventory (CRIT-01 – LOW-20) remains valid where not listed as fixed above. This document supersedes the 2026-07-05 initial audit executive summary for release readiness status.*

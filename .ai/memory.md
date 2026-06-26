# Project Memory

**Project:** HR Shakya ERP Platform  
**Last updated:** 2025-06-25 (Render deploy startup fixes)  
**Read with:** `.ai/constitution.md`, `.ai/architecture.md`, `.ai/database.md`, `.ai/api.md`

---

## Render Deployment (Backend)

`npm start` runs `node dist/main.js`. Exit code 1 on Render is almost always **environment validation** before the server binds to a port.

**Required in Render → Environment** (see `backend/RENDER.md`):
- `MONGODB_URI`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `FIELD_ENCRYPTION_KEY` (each 32+ chars, not placeholders)
- `REDIS_URL` (full `rediss://...` URL)
- `AUTH_USE_HTTP_ONLY_COOKIES=true`, `AUTH_COOKIE_SECURE=true`
- `FRONTEND_URL` (deployed SPA URL)

Startup now logs the exact validation error to Render logs via `bootstrap-env.ts`.

Uncommitted locally (as of last session): `bootstrap-env.ts`, env defaults, winston console in prod, `render.yaml` secret placeholders.

---

## Current Phase

**Phase 17 — Production Readiness Audit** (`Complete`)

See `.ai/PRODUCTION-AUDIT.md` for full report.

Key fixes: fail-closed route guard, longest-match `findRouteMeta`, missing registry entries, broken nav links, UI permission gates on employee/candidate lists, 403 on portal violation.

---

## Persona-Centric Portal Architecture (Phase 16)

Three isolated application experiences — navigation, routes, and dashboards generated from **Portal → Permissions → Enabled Modules → Feature Flags**:

| Portal | Users | Purpose |
|--------|-------|---------|
| **Enterprise** | Super Admin, Director, Admin | Company configuration & executive KPIs — no employee workspace widgets |
| **Manager** | HR/Project/Sales/Finance Managers | Team operations, approvals, scoped management — no org settings |
| **Workspace** | Individual contributors | Daily work only — check-in, my tasks, apply leave, payslips |

Key files:
- `frontend/src/config/module-registry/index.ts` — persona-split `NAV_GROUPS`, `ROUTE_REGISTRY`, `getEnterpriseDashboardWidgets`, `getManagerDashboardWidgets`
- `frontend/src/config/portals.ts` — `resolvePortal()` permission signals
- `frontend/src/app/components/portal-sidebar.tsx` — dynamic nav via `useMergedNavigation(portal)`
- Removed hardcoded `WorkspaceNav` from workspace pages (sidebar is single source of truth)

---

## Production Security Hardening (Phase 15)

See `.ai/SECURITY-AUDIT.md` for full report.

Key changes: log redaction, production error sanitization, HttpOnly cookie auth path, Mongo Redis fallback for replay protection, auth endpoint rate limits, production env validation, frontend token storage refactor, nginx security headers.

---

## Frontend UX Stabilization (Phase 14)

Foundation shipped for enterprise-grade UI/UX without business-logic changes:

| Area | Status |
|------|--------|
| **Layout scroll** | `portal-shell.tsx` — `h-screen overflow-hidden`, independent sidebar + main scroll |
| **Error handling** | `AppErrorBoundary`, `RouteErrorFallback`, extended status pages (401–500, offline, network, module/data load) |
| **Shared UI** | `Dialog`, `Sheet`, `FormDialog`, `Breadcrumb`, `PageDataBoundary`, `EmptyState`, `TableSkeleton`, `PageSkeleton` |
| **DataTable** | Sticky header, skeleton loading, empty states, built-in pagination |
| **CRUD dialogs** | Employee, Candidate (list dialogs); Entity admin (Sheet); Roles (FormDialog); Workflows (Sheet) |
| **Defensive rendering** | Pipeline kanban, recruitment dashboard, widgets — null-safe arrays |

Legacy create routes (`/employees/new`, `/recruitment/candidates/new`) redirect to list `?action=create`.

Remaining: roll `PageDataBoundary` across all pages; project assign dialogs; leave/attendance approval dialogs; full route QA.

---

## Enterprise Project Administration

Backend: extended `backend/src/modules/project/` — `/api/v1/projects`

| Capability | Notes |
|------------|-------|
| **Creation Wizard** | Multi-step draft save + finalize orchestrates project, KB, members, modules, milestones, sprint |
| **Granular Permissions** | `project.archive`, `project.assign_manager`, `project.assign_members`, `project.manage_repository`, `project.manage_environment`, `project.manage_settings`, `project.manage_workflow`, `project.view_all`, `project.view_assigned` |
| **Scoped Access** | Super Admin `view_all`; PM/employees `view_assigned` via membership + PM assignment |
| **Member History** | `project_member_history` collection tracks assign/update/remove |
| **Enterprise Dashboard** | Portfolio risk, budget, resource allocation, project health |
| **Manager Dashboard** | Scoped to assigned projects; team workload, verifications, sprints |

Wizard API: `GET/PUT/DELETE /wizard/draft`, `POST /wizard/finalize`  
Dashboard: `GET /dashboard/enterprise`, scoped `GET /dashboard/manager`

Frontend:
- `/projects/new` — 11-step creation wizard with local + server draft
- `/projects` — Enterprise or manager dashboard (auto-detect via `project.view_all`)
- `/projects/list` — Enterprise project list

---

## Integration Platform

Backend: `backend/src/modules/integration/` — `/api/v1/integration`

| Capability | Notes |
|------------|-------|
| **Integration Center** | Connector CRUD for Cloudinary, SMTP, Webhook, REST API + future types; health, test, enable/disable, last sync/error |
| **API Management** | API keys with permissions, expiry, rotate/revoke/regenerate, usage logs |
| **Webhook Engine** | Subscriptions, HMAC signatures, retry via BullMQ, delivery logs, test delivery, event catalog |
| **Import Engine** | Preview/execute, templates, validation, duplicate detection, rollback, history — delegates org/sales importers |
| **Export Engine** | CSV/PDF/XLSX, configurable columns/filters, bulk export, download, history |
| **Scheduler** | Cron jobs, run-now, enable/disable, job history, failure logs |
| **Backup & Restore** | Settings backup, backup history, verification; restore architecture stub (no DB restore in unsupported envs) |
| **Integration Logs** | Unified timeline: API, webhook, import, export, scheduler, email, Cloudinary, errors; search/filter/export |
| **Platform Services** | File, Email, Import, Export, Webhook, Scheduler, API Key, Connector, Integration Log — wrap existing infra |

**Collections:** `integration_connectors`, `api_keys`, `webhook_subscriptions`, `webhook_deliveries`, `import_jobs`, `export_jobs`, `scheduled_jobs`, `integration_logs`, `backup_records`

**Platform services (no duplication):**
- `file-platform.service` → `UploadService` (Cloudinary)
- `email-platform.service` → `EmailService`, `QueueProducer`
- `import-platform.service` → org `CsvService`/`MasterDataService`, employee/sales importers
- `export-platform.service` → `CsvService`, module exporters
- `webhook-platform.service` → HMAC delivery, queue retries
- `scheduler-platform.service` → BullMQ via `QueueProducer`
- `integration-event.service` → publish business events to webhook engine (ready for module adoption)

Frontend (Enterprise only — Super Admin):
- `/system/integrations` — Integration dashboard (connected services, failures, webhook/API/import/export/scheduler stats)
- `/system/integrations/connectors` — Connector management
- `/system/api-keys`, `/system/webhooks`, `/system/import`, `/system/export`
- `/system/scheduler`, `/system/integration-logs`, `/system/backups`

Redirects: `/system/storage`, `/system/email` → connectors.

Permissions: `system.config.read`, `system.config.manage`, `settings.manage`

Feature flag: `integrations` (default enabled, Enterprise only).

Future-ready: OAuth, allowed IPs, biometric/WhatsApp/SMS/payment/calendar connectors, scheduled exports, cloud backup, custom webhook endpoints.

---

## Configuration Platform

Backend: extended `backend/src/modules/settings/` — `/api/v1/settings`

| Capability | Notes |
|------------|-------|
| **Setting catalog** | 21 sections, 70+ definitions with name, key, type, validation, defaults, encrypted support |
| **Version history** | `SETTING_VERSIONS` collection; history on every setting update |
| **Feature flags** | Group `feature_flags`; toggles hide nav, dashboards, routes, quick actions |
| **Navigation manager** | Overrides stored in settings group `navigation`; merged with module registry |
| **Audit explorer** | Filter/search/timeline/CSV export via `AuditLogRepository` |
| **System health** | MongoDB, Redis, queue, app version, storage/email status |
| **Company & branding** | Settings groups `company`, `branding` + existing Company API |

Frontend (Enterprise only — managers/employees blocked):
- `/system/configuration` — Configuration hub with section sidebar + search
- `/system/configuration/:section` — Section editors with validation, history, confirm dialogs
- `/system/navigation` — Dynamic navigation manager
- `/system/audit` — Audit explorer
- `/system/health` — System administration health page

Redirects: `/system/settings` → configuration hub; `/system/feature-flags` → feature_flags section.

Permissions: `settings.read`, `settings.manage`, `system.audit.read`, `system.config.read`

Sidebar uses `useMergedNavigation` + `applyNavigationOverrides` for dynamic menus.

Future-ready: MFA, IP restrictions, white label, scheduled reports, plugin menus, email provider switching.

---

## Reports & BI Module

Backend: `backend/src/modules/reports/` — `/api/v1/reports`

| Capability | Notes |
|------------|-------|
| **Report engine** | Generic orchestrator with filters, grouping, sorting, Redis cache — delegates to module services |
| **Executive dashboard** | Company KPIs: employees, departments, projects, recruitment, attendance, payroll, sales, approvals, system health |
| **Role dashboards** | CEO, HR Head, Finance Head, Project Head, Sales Head, Operations Head — scoped widget sets |
| **Domain analytics** | HR, Finance, Project, Sales, Attendance bundles via `ModuleReportAdapter` |
| **Widget builder** | Reusable stat/chart/table/heatmap/trend/progress widgets; layout in settings group `reports` |
| **Exports** | CSV (delegates module exporters), PDF (HTML print), print-ready |
| **No duplication** | Attendance/Payroll/Sales/Project/Recruitment calculations consumed from existing services |

Frontend:
- `/reports/executive` — Executive dashboard with configurable widget grid
- `/reports/dashboard/:role` — Role-specific dashboards
- `/analytics` — HR, Finance, Project, Sales, Attendance analytics hub
- `/reports` — Searchable report catalog with filters and export
- `/reports/run/:domain/:type` — Report detail view

Module-specific report pages retained (`/attendance/reports`, `/payroll/reports`, etc.) — centralized BI links to them.

Permissions: `analytics.dashboard.read`, `analytics.report.read`, `analytics.report.export`

Feature flags: `reports`, `analytics` (default enabled).

Future-ready: scheduled reports, email delivery, training completion, document expiry, statutory reports.

---

## Communication Center Module

Backend: `backend/src/modules/communication/` — `/api/v1/communication`

| Capability | Notes |
|------------|-------|
| **Announcement engine** | Company, branch, department, team, project; scheduling, emergency, pinned, expiry, acknowledgement, read tracking |
| **Direct messaging** | 1:1 chat, delivered/read receipts, reply, forward, edit, delete, star, pin, attachments, mentions |
| **Team channels** | Project, department, team, announcement, read-only, private; manager-administered |
| **Notification center** | Unread/read/archive, categories, deep links, preferences (settings group `communication`) |
| **Internal inbox** | Aggregated system messages: approval, workflow, assignment, interview, payroll, attendance, leave |
| **Search** | Messages, announcements, channels, attachments, mentions |
| **Reports** | Reach, read stats, channel activity, user activity, unread summary + CSV export |
| **Role scoping** | Admin (`notifications.broadcast`); manager (team/project announcements + channels); employee (DMs, channels, read) |

Frontend portals:
- `/communication` — permission-based redirect
- `/communication/admin` — Enterprise administration
- `/communication/manager` — Team announcements, channels, read status
- `/workspace/messages` — Employee DMs & channels
- `/communication/inbox` — Internal inbox (searchable)
- `/communication/reports` — Reports & export
- `/communication/search` — Global communication search

Existing workspace pages retained (delegate to communication services):
- `/workspace/announcements`, `/workspace/notifications`

Permissions: `announcement.*`, `notifications.broadcast`, `notification.*`, `conversation.*`, `chat.message.send`

Feature flag: `communication` (default enabled).

Future-ready: typing indicators, voice/video (schema), multilingual announcements.

Workspace services delegate to `AnnouncementService` and `NotificationCenterService` — no duplicate logic.

---

## Sales CRM Module

Backend: `backend/src/modules/sales/` — `/api/v1/sales`

| Capability | Notes |
|------------|-------|
| **CRM engine** | Leads, deals, pipeline stages, activities, call logs, follow-ups, timeline, tags, priority, score, attachments, internal notes |
| **Assignment** | Manual, automatic, territory-based, manager override; history never deleted (deactivate + append) |
| **Administration** | Lead sources, pipelines/stages (configurable without code), territories, sales teams, targets, policies, scoring rules |
| **Import / export** | CSV lead import; lead export; report CSV/PDF export |
| **Dashboards** | Enterprise admin, sales manager team, sales executive personal |
| **Analytics** | Conversion and revenue dashboards |
| **Reports** | Source, executive, pipeline, conversion, revenue, activity, follow-up |
| **Role scoping** | Executive = own assigned leads; manager = direct reports; admin = all |
| **Integrations** | Audit logs, activity feed, event bus, notifications, settings group `sales`, employee/org linkage |

Frontend portals (Enterprise + Manager only — **not** in Employee Workspace):
- `/sales` — permission-based redirect
- `/sales/admin` — Enterprise CRM administration
- `/sales/manager` — Team dashboard, assignment, performance, won/lost
- `/sales/my` — Sales executive assigned leads & activities
- `/sales/reports` — Reports & export
- `/sales/leads/:id` — Lead detail (timeline, notes, pipeline board)

Permissions: `lead.*`, `deal.*`, `pipeline.*` (not `sales.read`).

Feature flag: `sales` (default enabled).

Future-ready (schema/types only): round-robin assignment, email logs, WhatsApp integration.

---

## Payroll Module

Backend: `backend/src/modules/payroll/` — `/api/v1/payroll`

| Capability | Notes |
|------------|-------|
| **Calculation engine** | Basic, allowances, deductions, attendance snapshot, LWP, OT, variable/bonus/reimbursement, gross/net |
| **Statutory plugins** | Configurable JSON in settings — no hardcoded PF/ESI/TDS |
| **Salary structures & components** | Earnings, deductions, allowances, employer/employee contributions |
| **Employee compensation** | Structure assignment with versioned history |
| **Salary revisions** | Promotion/increment/correction via Approval Engine |
| **Payroll runs** | Process → submit → approve → lock; HR blocked after lock |
| **Payslips** | HTML generation, versioning, download, branding, signature-ready metadata |
| **Reports** | Monthly/dept/branch/register/summary/analytics + CSV export |

Frontend portals:
- `/payroll/admin` — Enterprise administration
- `/payroll/finance` — Process, review, lock, payslip generation
- `/payroll/hr` — Compensation & revisions
- `/workspace/payroll` — Employee self-service
- `/payroll/reports` — Reports & export

Salary grades: org entity admin (`/organization/salary-grade`).

Feature flag: `payroll` (default enabled).

---

## Attendance Module

Backend: `backend/src/modules/attendance/` — registered at `/api/v1/attendance`

| Capability | Notes |
|------------|-------|
| **Punch engine** | check_in, check_out, break_start, break_end → logs + calculator |
| **Calculator** | working/break hours, late, early exit, overtime, half-day, absent, holiday, weekend |
| **Policies** | Settings group `attendance` (grace, late, overtime, weekly off) |
| **Shift assignments** | Links employees to org `WorkShift` master data |
| **Corrections** | Via Approval Engine (`attendance_correction` request type) — employees cannot edit directly |
| **Monthly processing** | Stamps `payrollSnapshot` on records (no payroll math) |
| **Reports** | daily/weekly/monthly + employee/dept/branch/company + CSV export |
| **Integrations** | Audit, activity feed, notifications, approval sync |

Frontend portals:
- `/attendance/admin` — Enterprise administration
- `/attendance/hr` — HR corrections & exceptions
- `/attendance/team` — Manager team view (direct reports)
- `/workspace/attendance` — Employee punch & correction requests
- `/attendance/reports` — Reports & export

Work shifts configured via existing Organization entity admin (`/organization/work-shift`).

Feature flag: `attendance` (default enabled).

---

## Super Admin Override (Frontend)

`useAuthStore.hasPermission()` returns `true` for all codes when role slug is `super_admin`. Navigation, widgets, entity admin, and project administration all respect this — no workflow ownership checks in UI.

---

## Enterprise Quick Action Center

Location: `/enterprise` (top of dashboard)

12 shortcuts launch existing flows via query params:
- Org entities → company setup wizard (`?step=branch`, etc.)
- Project → `/projects/list?action=create`
- Role → `/rbac/roles?action=create`
- Workflow → `/approvals/workflows?action=create`
- Employee/Candidate → existing create pages

---

## Enterprise Project Administration

Extended existing pages (no duplicate routes):
- `/projects/list` — create, search, include archived
- `/projects/:id` → **Administration** tab — settings, members, modules, milestones, sprints, repository/env (knowledge base), archive/restore/delete

---

## Enterprise Administration (Frontend)

Super Admin can configure the full organization from UI without database access:

| Area | Location | Notes |
|------|----------|-------|
| **Entity admin** | `frontend/src/features/admin/components/entity-admin-page.tsx` | CRUD, archive/restore, search, filters, pagination, CSV export, bulk delete |
| **Company setup wizard** | `/organization/setup` | Resumable multi-step flow (localStorage draft) |
| **Org chart** | `/organization/chart` | Interactive hierarchy navigation |
| **Department / job role detail** | `/organization/:entityKey/:id` | Hierarchy, stats, quick actions |
| **RBAC UI** | `/rbac/*` | Roles, permission matrix save, simulator, role templates |
| **Workflow builder** | `/approvals/workflows` | Create/edit approval stages |
| **Template builder** | `/admin/templates` | Document/notification templates via settings group `templates` |
| **Dynamic settings** | `/system/settings` | All setting groups editable from UI |
| **Feature flags** | `/system/feature-flags` | Toggle modules; sidebar reads live flags via `useFeatureFlags()` |
| **System dashboard** | `/system/dashboard` | Health, stats, pending approvals |

Entity permissions map to backend codes (`branch.read`, `department.read`, etc.) — not `organization.read`.

Feature flags stored in settings group `feature_flags` with keys `feature.{flag}`.

---

## Portal Architecture (Frontend)

Three permission-resolved experiences (no hardcoded role names in UI):

| Portal | Route | Resolution |
|--------|-------|------------|
| **Enterprise** | `/enterprise` | Any of `company.read`, `rbac.role.read`, `settings.manage`, `system.*`, `workflow.manage` |
| **Manager** | `/manager` | Team/ops permissions without enterprise signals |
| **Workspace** | `/workspace` | Default employee daily work |

- Module registry: `frontend/src/config/module-registry/`
- Layouts: `EnterpriseLayout`, `ManagerLayout`, `WorkspaceLayout`
- Navigation generated from registry with feature flags + nested items
- Enterprise Control Center: lazy-loaded permission-gated widgets

---

## Completed Work (Security Phase)

| Item | Notes |
|------|-------|
| **Super Admin seed** | `SUPER_ADMIN_*` env vars; local `npm run seed:init` via gitignored `seed.local.ts` (no MongoDB transactions) |
| **Auth shell** | Login-first UX, no public dashboard, protected routes, token refresh |
| **Dynamic sidebar** | Permission-driven navigation catalog; super admin sees all |
| **Account activation** | Inactive users on conversion; HR activates; hashed 48h token; portal activate |
| **Secure onboarding portal** | Public `/onboarding/:token` — draft/resume/submit; token hashed, revocable |
| **Session management** | List active sessions, revoke device, session history API |
| **Portal module** | `/api/v1/portal/*` public routes (no auth middleware) |

---

## Architecture Summary

**Public frontend routes:** `/login`, `/forgot-password`, `/reset-password/:token`, `/onboarding/:secureToken`, `/account-activation/:secureToken`

**Public backend routes:** `/api/v1/auth/login|refresh|forgot-password|reset-password|system/status`, `/api/v1/portal/*`, `/health`

**Protected:** All other API routes use `authenticateMiddleware` + `authorize()`; frontend uses `ProtectedRoute` + `AuthProvider` bootstrap.

**Token service:** `SecureAccessTokenService` — purposes: `account_activation`, `candidate_onboarding`

---

## Seed Workflow

1. Copy `backend/src/scripts/seed.local.example.ts` → `seed.local.ts` (gitignored)
2. Set `SUPER_ADMIN_*` and `SEED_COMPANY_*` in `backend/.env`
3. `npm run seed:init` — company, org, super admin (once)
4. `npm run seed` — RBAC sync, master data, leave defaults (idempotent)

---

## Next Task

Per `.ai/roadmap.md` — finance, inventory, or tenant multi-tenancy (Configuration Platform complete).

# HR Shakya ERP — Changelog

All notable project changes are recorded here. **Newest entries first.**

AI agents and engineers must **append a session entry** after every completed task. Do not rewrite prior entries.

---

## How to Append

```markdown
## YYYY-MM-DD — Short session title

### Added
- ...

### Changed
- ...

### Decisions
- ...

### Next
- ...
```

---

---

---

---

---

---

---

---

---

## 2025-06-25 — Render startup visibility + env defaults

### Fixed
- `bootstrap-env.ts` validates env before Winston/logger imports; prints `=== HR Shakya ERP — startup failed ===` to stderr on Render
- `main.ts` imports bootstrap first; production Winston console transport enabled so logs appear in cloud dashboard
- Env schema defaults for non-secret vars (APP_NAME, SMTP, Cloudinary placeholders, `LOG_DIR=/tmp/logs`, etc.)
- Seed password validation moved to seed scripts only (no longer blocks production `npm start`)
- `render.yaml` lists required secrets (`sync: false`) + cookie flags

### Added
- `backend/RENDER.md` — minimum Render environment variable checklist

### Fixed
- `initializeQueues()` called `getQueue()` before `queuesEnabled` was set — crashed on Render even when Redis connected successfully

---

## 2025-06-25 — Render build fix (TypeScript paths)

### Fixed
- Removed deprecated `baseUrl` from `backend/tsconfig.json` — paths now relative to tsconfig (`./src/...`) for TypeScript 6 compatibility on Render
- Pinned `typescript` to `5.8.3` in backend devDependencies
- Added `render.yaml` with `npm install --include=dev` so build tools install on Render

### Render dashboard
If not using Blueprint, set **Root Directory** to `backend` and **Build Command** to:
`npm install --include=dev && npm run build`

---

## 2025-06-25 — Render deploy env checklist

### Changed
- Expanded `backend/.env.production.example` with all required production variables
- Env validation hints missing Render variables by name on startup failure

### Fix for deploy
- Set `FIELD_ENCRYPTION_KEY` (32+ chars) in Render Environment — required alongside JWT secrets

---

## 2025-06-25 — Redis single-URL configuration

### Changed
- Redis connects via one `REDIS_URL` with embedded credentials (standard `rediss://user:pass@host:6379`)
- Removed `REDIS_TOKEN`, `REDIS_REST_URL`, `REDIS_REST_TOKEN` from env schema and examples
- Updated `redis.config.ts` — no separate token merge; HTTPS URLs preserve auth when present

---

## 2025-06-25 — Production Readiness Audit

### Fixed
- Route guard fail-closed for unregistered paths (URL bypass prevention)
- `findRouteMeta` longest-match algorithm (child routes, manager team reports, leave apply, etc.)
- Missing `ROUTE_REGISTRY` entries (detail routes, settings, reports portal, redirects)
- Broken nav links (`/admin/*`, `/system/security`) → valid routes
- Portal violation redirects to `/403` instead of silent home redirect
- Employee/candidate create/export buttons permission-gated
- Workspace widget project links → workspace routes

### Added
- `.ai/PRODUCTION-AUDIT.md` — full enterprise audit report

### Remaining
- ESLint tooling not installed
- Page-level permission audit rollout to all list pages
- Bundle code-splitting advisory

---

## 2025-06-25 — Persona-Centric Enterprise Platform Refactor

### Changed
- Split module navigation into Enterprise / Manager / Workspace groups — no mixed menus
- `ROUTE_REGISTRY` portal assignments enforce persona boundaries (e.g. leave apply workspace-only, employee create enterprise-only, approvals manager-only)
- Enterprise dashboard: company KPI widgets only; manager dashboard: team KPI widgets via `getManagerDashboardWidgets`
- Removed duplicate hardcoded `WorkspaceNav` from workspace pages — `PortalSidebar` is sole navigation source
- Enterprise quick action "Announcement" now routes to `COMMUNICATION_ADMIN` instead of workspace announcements
- Expanded `MANAGER_PORTAL_PERMISSIONS` for HR/finance/sales manager portal resolution

### Decisions
- Same route paths reused across portals where appropriate; portal guard + nav filtering enforce separation (no duplicate pages)
- Manager team reports link to `/reports/dashboard/hr` (role dashboards); executive BI remains enterprise-only

### Next
- Page-level CRUD button audit per persona (hide create/archive on manager views where backend already scopes)
- Backend workspace widget catalog filter to exclude admin widget slugs

---

## 2025-06-25 — Production Security Hardening

### Added
- `.ai/SECURITY-AUDIT.md` — full audit report
- `sensitive-redact.util.ts`, `production-sanitize.util.ts`, `auth-response.util.ts`, `auth-endpoint-rate-limit.middleware.ts`
- Frontend `token-storage.ts` — centralized auth storage with cookie mode
- `FIELD_ENCRYPTION_KEY` env var (separate from JWT)

### Changed
- Winston/Morgan/request logger — automatic secret + URL token redaction
- Error handler — production message sanitization; import errors generic in prod
- CacheService — MongoDB fallback for Redis (refresh replay protection)
- Auth cookies — production required; tokens stripped from JSON when cookies enabled
- Rate limits on bootstrap, forgot/reset password, refresh
- Helmet hardening, `X-Powered-By` disabled, nginx security headers
- Frontend — removed Zustand token persist; prod console strip; query cache clear on logout
- Redis — Upstash HTTPS host normalization to `rediss://`
- Production env validation — Redis, HttpOnly cookies, secure cookies, no default passwords

### Next
- Wire securityLogger for auth audit events
- Socket.io authentication

---

## 2025-06-25 — Frontend UX Stabilization (Foundation)

### Added
- Shared enterprise UI: `Dialog`, `Sheet`, `FormDialog`, `Breadcrumb`, `PageDataBoundary`, `EmptyState`, table/page skeletons
- `AppErrorBoundary`, `RouteErrorFallback`, extended status pages (500, network, offline, module/data load, unexpected)
- `EmployeeCreateDialog`, `CandidateCreateDialog`; entity admin Sheet editor; role FormDialog; workflow Sheet editor
- Error routes: `/500`, `/network-error`, `/offline`, `/module-error`, `/data-error`, `/unexpected-error`
- Client error logger hook point (`error-logger.ts`)

### Changed
- `portal-shell.tsx` — independent sidebar/main scroll (`h-screen overflow-hidden`)
- `DataTable` — sticky header, skeleton, empty states, pagination prop
- `PageHeader` — optional breadcrumbs
- Employees/Candidates list pages — dialog CRUD, `PageDataBoundary`, skeleton loading
- Create routes redirect to list `?action=create`; enterprise quick actions updated
- Pipeline kanban, recruitment dashboard — defensive null/empty array handling
- Router — `errorElement` on protected routes; `App` wrapped in error boundary

### Next
- Apply `PageDataBoundary` to remaining pages
- Project assign manager/members dialogs; leave approval & attendance correction dialogs
- Full route/console verification pass

---

## 2025-06-25 — Enterprise Project Administration

### Added
- Project creation wizard: 11-step flow with server + local draft, finalize orchestration
- Granular project permissions: archive, assign_manager, assign_members, manage_repository/environment/settings/workflow, view_all, view_assigned
- Enterprise dashboard: portfolio risk, budget summary, resource allocation, project health
- Scoped project listing and manager dashboard for assigned projects only
- Member assignment history (`project_member_history`), bulk assign, PATCH member, DELETE sprint, KB document routes
- Frontend: `/projects/new` wizard, enhanced enterprise/manager dashboards

### Decisions
- Extend existing project module — wizard delegates to ProjectService, KnowledgeBaseService, member/module/milestone/sprint services
- Super Admin uses `project.view_all`; PM/employees scoped via `ProjectAccessService`
- Env variables encrypted via existing KnowledgeBaseService pipeline

### Next
- Wire task create/edit UI for PM operations; scheduled exports per roadmap

---

## 2025-06-25 — Enterprise Integration Platform

### Added
- Backend `integration` module: Integration Center, API keys, webhook engine, import/export engines, scheduler, backup architecture, unified logs, Super Admin dashboard
- Domain: `integration.schemas.ts` — connectors, API keys, webhooks, deliveries, import/export jobs, scheduled jobs, integration logs, backup records
- Platform services wrapping existing infra (UploadService, EmailService, CsvService, module importers/exporters, BullMQ) — no duplicated integration logic
- Queue: `WEBHOOK` queue + worker stub; `addWebhookJob`, `addSchedulerJob` on `QueueProducer`
- Frontend integration feature: dashboard, connectors, API keys, webhooks, import/export centers, scheduler, logs, backups
- Routes: `/system/integrations`, `/system/integrations/connectors`, `/system/api-keys`, `/system/webhooks`, `/system/import`, `/system/export`, `/system/scheduler`, `/system/integration-logs`, `/system/backups`
- Feature flag `integrations`; module registry Integrations nav group (Enterprise only)

### Decisions
- Extend settings group `integrations` for connector config; reuse `system.config.*` permissions
- Business modules consume platform services — import/export delegate to org/sales existing pipelines
- `integration-event.service.publishIntegrationEvent()` ready for webhook publishing; modules adopt incrementally
- Backup restore stub only — no DB restore where deployment env does not support it

### Next
- Wire `publishIntegrationEvent` into key business events (employee create, lead won, payroll complete, etc.)
- Finance & accounting modules per roadmap

---

## 2025-06-25 — Enterprise Configuration Platform

### Added
- Extended settings module: configuration catalog (21 sections), setting version history, feature flags API, navigation manager, audit explorer, system health admin
- Domain: `SettingVersionDocument`, expanded `AppSettingDocument` (name, category, defaultValue), new `SETTING_GROUP` values
- Frontend configuration feature: hub, section editors, company/branding, feature management, navigation manager, audit explorer, system health
- Dynamic navigation: `applyNavigationOverrides` + `useMergedNavigation` in portal sidebar
- Routes: `/system/configuration`, `/system/navigation`, `/system/audit`, `/system/health`

### Decisions
- Extend existing SettingsService — no duplicate settings logic; version history on update
- Enterprise-only access (`ENTERPRISE_ONLY` routes); managers/employees cannot reach system configuration
- Feature flags invalidate sidebar queries immediately on toggle
- Approval configuration remains in existing Approval Workflows UI (linked from hub, not duplicated)

### Next
- Finance & accounting modules per roadmap

---

## 2025-06-25 — Enterprise Reports & BI module

### Added
- Backend `reports` module: report engine, module adapter (delegates to attendance/payroll/sales/project/recruitment), HR analytics, executive/role dashboards, widget registry, export, audit
- Frontend reports feature: executive dashboard, role dashboards, analytics hub, report catalog, reusable widget components
- Routes: `/reports`, `/reports/executive`, `/reports/dashboard/:role`, `/analytics`, `/reports/run/:domain/:type`
- Feature flags `reports` and `analytics`; permissions `analytics.dashboard.read`, `analytics.report.read`, `analytics.report.export`

### Decisions
- Zero calculation duplication — all domain metrics via existing module report/dashboard services
- HR analytics uses repository counts/trends only (employee growth, department strength, leave/resignation stats)
- Module-specific report UIs preserved; centralized BI aggregates and links outward
- Dashboard widget layout stored in settings group `reports`

### Next
- Finance & accounting modules per roadmap

---

## 2025-06-25 — Enterprise Communication Center module

### Added
- Backend `communication` module: announcements, DMs, team channels, notification center, internal inbox, search, reports, dashboards
- Domain extensions: message receipts, user states (star/pin), enriched announcements/conversations/notifications
- Frontend communication feature: enterprise admin, manager, workspace messages, inbox, search, reports
- Routes: `/communication`, `/communication/admin`, `/communication/manager`, `/workspace/messages`, `/communication/inbox`, `/communication/reports`, `/communication/search`
- Feature flag `communication`; workspace announcements/notifications delegate to communication services

### Decisions
- Reuse RBAC catalog: `announcement.*`, `notifications.broadcast`, `notification.*`, `conversation.*`, `chat.message.send`
- Managers create team/project announcements via `conversation.create`; company-wide requires `notifications.broadcast`
- No video calling or external messaging; internal permission-aware only
- Workspace pages retained — backend delegation avoids duplicate business logic

### Next
- Finance & accounting modules per roadmap

---

## 2025-06-25 — Enterprise Sales CRM module

### Added
- Backend `sales` module: leads, assignments (immutable history), activities, call logs, follow-ups, deals, pipelines, lead sources, territories, sales teams, targets, policies, scoring, dashboards, analytics, reports
- Domain extensions: `LeadSource`, `SalesTeam`, `Territory`, `SalesTarget`; enriched lead/deal/activity schemas
- Frontend sales feature: enterprise admin, manager, executive portals; lead detail with pipeline board, assignment dialog, activity forms
- Routes: `/sales`, `/sales/admin`, `/sales/manager`, `/sales/my`, `/sales/reports`, `/sales/leads/:id`
- Feature flag `sales`; module registry nested nav under Enterprise + Manager portals only

### Decisions
- Role separation via scope resolver (own / team / all) — executives cannot see unassigned or peer leads
- No sales routes in Employee Workspace (`/workspace/*`)
- Permissions reuse catalog codes: `lead.*`, `deal.*`, `pipeline.*`
- Default pipeline stages: New → Contacted → Qualified → Proposal → Negotiation → Won → Lost (admin-editable)
- Round-robin, email logs, WhatsApp marked future-ready in schema/constants

### Next
- Finance & accounting modules per roadmap

---

## 2025-06-25 — Payroll Management module

### Added
- Backend `payroll` module: calculation engine, policies, components, structures, compensation, processing, locking, revisions, payslips, reports
- Domain extensions: employee compensation, enriched payslips/payroll runs, versioned salary revisions
- Approval integration: `payroll_run` and `salary_revision` entity types
- Frontend payroll feature: enterprise admin, finance, HR, workspace employee pages
- Routes: `/payroll`, `/payroll/admin`, `/payroll/finance`, `/payroll/hr`, `/workspace/payroll`, `/payroll/reports`

### Decisions
- Statutory deductions (PF, ESI, TDS) as configurable plugins in settings — not hardcoded
- Salary history never overwritten — versioning on revisions and compensation
- Payslips as branded HTML with download (print-to-PDF), digital signature metadata placeholder
- Attendance `payrollSnapshot` feeds LWP/overtime in calculator

---

## 2025-06-25 — Attendance Management module

### Added
- Backend `attendance` module: punch engine, calculator, policies, shift assignments, corrections (approval-integrated), reports, monthly processing, dashboards
- Extended domain schemas: payroll-ready attendance fields, shift assignments, correction status
- Approval integration: `attendance_correction` entity type + entity sync on decision
- Frontend attendance feature: enterprise admin, HR, manager team, workspace employee pages
- Routes: `/attendance`, `/attendance/admin`, `/attendance/hr`, `/attendance/team`, `/workspace/attendance`, `/attendance/reports`
- Enterprise `attendance-today` dashboard widget; feature flag `attendance` enabled by default

### Changed
- `ATTENDANCE_STATUS` includes `weekend`
- Module registry: attendance nav for all portals with permission-based sub-routes

### Decisions
- Work shifts reuse Organization `WorkShift` master data — no duplicate shift CRUD
- Corrections always via Approval Engine; direct employee edit forbidden
- Monthly processing stamps `payrollSnapshot` only — payroll calculations deferred

### Next
- Payroll module per roadmap

---

## 2025-06-25 — Enterprise portal refactor (Super Admin + project admin)

### Added
- Enterprise Quick Action Center with 12 shortcuts to existing wizard/create flows
- `ProjectAdministrationPanel` on project detail **Administration** tab (settings, team, modules, milestones, sprints, repository/env)
- Deep-link support: `?action=create` on entity admin, roles, workflows, projects; `?step=` on company setup wizard
- Extended project API/hooks: update, archive, restore, delete, members, modules, milestones, sprints, knowledge base

### Changed
- Enterprise dashboard focuses on company management; removed employee-centric widgets (leave, onboarding, interviews, attendance)
- Quick Action Center rendered prominently above insight widgets
- Projects list page → enterprise project administration with create form

### Decisions
- Super Admin override via existing `hasPermission` + `isSuperAdmin()` — no backend changes
- No duplicate pages; extended `projects-list-page`, `project-detail-page`, existing admin flows

### Next
- Attendance module per roadmap

---

## 2025-06-25 — Enterprise administration layer (frontend)

### Added
- Admin feature module: entity admin page, entity form/fields, entity permissions, company setup wizard, org chart, department/job-role detail pages
- System admin pages: feature flags, template builder, system dashboard
- Routes: `/organization/setup`, `/organization/chart`, `/organization/:entityKey/:id`, `/rbac/templates`, `/admin/templates`, `/system/settings`, `/system/feature-flags`, `/system/dashboard`
- Live feature-flag navigation filtering in portal sidebar (`useFeatureFlags`)

### Changed
- Organization nav uses granular backend permission codes per entity type
- Organization dashboard links to setup wizard, org chart, and all master-data modules
- RBAC permission matrix persists role permissions; roles page supports create/clone/archive
- Approval workflows page: workflow builder UI (create/edit stages)
- Settings page: dynamic CRUD for all setting groups

### Decisions
- Feature flags use existing settings API (`feature_flags` group) — no new backend module
- Document templates stored as settings keys `template.{type}` in group `templates`
- Entity detail views only for department and job-role; other entities use list admin page

### Next
- Attendance module per roadmap

---

## 2025-06-26 — Three-portal frontend architecture

### Added
- Enterprise / Manager / Workspace portals with permission-based auto-routing after login
- Module registry (`frontend/src/config/module-registry/`) — navigation, routes, widgets, feature flags
- Enterprise Control Center dashboard with lazy-loaded widgets
- Shared `PageHeader`, `StatCard`, `WidgetFrame` / `LazyWidget` / `WidgetGrid`

### Changed
- Replaced single `AppLayout` + flat sidebar with `PortalGuard` + three portal layouts
- Super Admin lands on `/enterprise` (not employee workspace)
- Login/public routes redirect to resolved portal home

### Decisions
- Portal resolution uses permission signals only — no role slug checks in UI components
- Attendance, Payroll, Sales nav entries registered but disabled via feature flags (not implemented)

### Next
- Attendance module per `.ai/roadmap.md`

---

## 2025-06-26 — Local direct seed (bootstrap seeder removed)

### Added
- `backend/src/scripts/seed.local.example.ts` — template for gitignored local init script
- `npm run seed:init` — runs `seed.local.ts` (company + super admin, no transactions)

### Changed
- Removed `bootstrap.seeder.ts` and bootstrap from committed `npm run seed` pipeline
- `.gitignore` — `backend/src/scripts/seed.local.ts`
- Fixed RBAC seeder role-template slug idempotency check

### Decisions
- Bootstrap HTTP API (`BootstrapService`) retained for optional API init; local dev uses direct seed script instead of transactional bootstrap seeder

### Next
- Attendance module per `.ai/roadmap.md`

---

## 2025-06-25 — Authentication Bootstrap & Security

### Added
- Super Admin seed from `SUPER_ADMIN_NAME|EMAIL|PASSWORD|PHONE` (idempotent, enterprise permissions)
- `AccountActivationService` — HR issues activation token; employee sets password via portal
- `portal` module — public onboarding + account activation APIs
- Session APIs: `GET /auth/sessions`, `GET /auth/sessions/history`, `POST /auth/sessions/:id/revoke`
- Frontend: login-first flow, `AuthProvider`, dynamic permission sidebar, status pages (401/403/404/session/maintenance)
- Secure onboarding portal with draft/resume/submit; recruitment `POST /onboarding/:id/portal-link`
- Employee `POST /employees/:employeeId/activate-account`
- Candidate conversion creates **inactive** users (no auto-activation)

### Changed
- Bootstrap uses `ENTERPRISE_PERMISSION_CATALOG` for Super Admin role permissions
- `SecureAccessTokenService.assertValid` / `consume` for non-destructive portal access
- Frontend: all ERP modules behind authentication; removed public dashboard

### Next
- Attendance module per roadmap

---

## 2025-06-25 — Universal Approval Engine + Leave & Exit Management

### Added
- **`modules/approval/`** — generic reusable approval engine (workflows, requests, actions, timeline, inbox, bulk approve, escalation, entity sync)
- **`modules/leave-exit/`** — leave policies, balances, requests, resignation, exit checklist, F&F prep, company calendar
- Domain collections: `approval_workflows`, `approval_requests`, `approval_actions`, `approval_attachments`, `approval_timeline_entries`, `leave_balances`, `resignations`, `exit_*`, `full_final_preparations`, `secure_access_tokens`
- `SecureAccessTokenService` — hashed single-use tokens (48h default) for candidate portal and future modules
- Default seeded workflows: `leave-default`, `resignation-default`, `exit-default`
- Permissions: `approval.*`, `workflow.*`, `leave.*`, `leave.policy.*`, `leave.balance.*`, `resignation.*`, `exit.*`
- Frontend: `/leave-exit/*`, `/approvals/inbox`, `/approvals/history`, `/approvals/workflows`
- Seeder: `leave-exit.seeder.ts` registered in seed runner

### Changed
- HR role permission filter includes approval + leave modules
- Employee role granted self-service leave, resignation, and approval inbox permissions
- `.ai/api.md`, `.ai/database.md`, `.ai/modules.md`, `.ai/memory.md`, `.ai/architecture.md`, `.ai/decisions.md` updated

### Decisions
- Leave/resignation/exit route all approvals through generic engine — no hardcoded leave logic in engine
- F&F preparation is data-only — payroll calculation deferred
- Attendance and Payroll explicitly not implemented in this session

### Next
- Attendance module per roadmap
- Approval attachment upload endpoint
- Delegation API on approval engine

---

## 2025-06-25 — Employee Workspace & Self-Service Portal

### Added
- Complete `modules/workspace/` — employee daily workspace (not admin panel)
- Domain: `workspace_widget_configs`, `announcement_read_receipts`; extended `notifications` (isArchived, deepLink, category), `announcements` (isPinned)
- 14 independent widget data loaders at `/api/v1/workspace/widgets/{slug}`
- Self-service: profile, org hierarchy, my projects/tasks (kanban/list/calendar), documents, announcements (ack/read receipts), notifications (group/archive), activity timeline, calendar, search
- Permissions: `workspace.read`, `workspace.widgets.*`, `announcement.*`, `profile.*`, `document.read`, `timeline.read`, `notification.manage`, `workspace.calendar.read`, `workspace.search`
- Audit: profile updates, document downloads/access, announcement acknowledgements
- Frontend: `frontend/src/features/workspace/` — dashboard widget grid, profile, projects, tasks, documents, notifications, announcements, calendar, activity, search
- Employee role updated with workspace permission set

### Decisions
- Workspace always self-scoped via `requireEmployeeContext` middleware
- Widget layout persisted per employee; defaults seeded on first access
- Placeholder widgets for attendance, leave balance, payslips (future modules)

### Next
- Time & Attendance module per roadmap
- Realtime notification delivery via Socket.io
- Drag-and-drop widget layout UI

---

## 2025-06-25 — Project Management module (Phase 4)

### Added
- Complete `modules/project/` — projects, members, modules, milestones, sprints, tasks, subtasks, verification, work logs, knowledge base, dashboards
- Extended domain: project fields (priority, URLs, tags, tech stack, risk, visibility), task workflow states, assignment history, encrypted knowledge base
- Services: ProjectService, TaskService, SprintService, MilestoneService, ProjectModuleService, ProjectMemberService, SubTaskService, TaskAssignmentService, TaskVerificationService, WorkLogService, KnowledgeBaseService, TaskWorkflowService, ProjectDashboardService, ProjectAuditService, ProjectActivityService, ProjectEventService
- Permissions: `project.*`, `task.*`, `sprint.*`, `milestone.*`, `module.*`, `verification.*`, `project.dashboard.read`, `project.worklog.*`, `project.knowledge.*`
- Validation: circular task dependency, duplicate project code, active project delete guard, sprint overlap, verifier membership
- Frontend: manager dashboard, project list, project profile (overview, kanban, tasks, sprints, members, timeline placeholder)
- Field encryption utility for knowledge base credentials/env vars

### Changed
- Extended `project.schemas.ts` with enterprise task/project fields
- New collections: `project_modules`, `task_assignment_history`, `task_verifications`, `daily_work_logs`, `project_knowledge_bases`, `project_documents`, `task_workflow_configs`
- Routes mounted at `/api/v1/projects`

### Decisions
- ProjectEventService publishes to Activity Feed + Notification queue (event bus pattern)
- Assignment history append-only — never overwrite prior assignments
- Task workflow configurable with 10 default states seeded per company/project

### Next
- Time & Attendance module per roadmap

---

## 2025-06-25 — Recruitment & ATS module (Phase 3.5)

### Added
- Complete `modules/recruitment/` — candidate CRUD, pipeline, interviews, offers, onboarding, conversion, dashboard
- Extended domain schemas: pipeline stages, transitions, candidate timeline, resume versioning, offer HTML/PDF-ready fields
- Services: CandidateService, CandidatePipelineService, InterviewService, OfferService, OnboardingService, CandidateConversionService, RecruitmentDashboardService, RecruitmentTimelineService, RecruitmentAuditService, RecruitmentActivityService, RecruitmentEmailService (queued templates)
- Permissions: `candidate.*`, `interview.*`, `offer.*`, `onboarding.*`, `conversion.execute`, `recruitment.pipeline.*`, `recruitment.dashboard.read`
- Validation: duplicate email/phone, duplicate active application, invalid interview schedule, offer after rejection, double conversion
- Frontend recruitment module: dashboard, candidates table, kanban pipeline, interview calendar, candidate profile (timeline, interviews, offers, onboarding, conversion)
- Swagger JSDoc on recruitment routes at `/api/v1/recruitment/*`

### Changed
- Enterprise permission catalog extended with recruitment permissions
- Routes mounted at `/api/v1/recruitment`
- Collections: `candidate_timeline`, `recruitment_pipeline_stages`, `pipeline_transitions`

### Decisions
- Offer letters as HTML uploaded to Cloudinary (true PDF generation deferred until PDF lib added)
- Candidate conversion requires accepted offer; preserves candidate history via `employeeId` link
- Email automation enqueued via BullMQ; worker send wiring remains ops follow-up

### Next
- Time & Attendance module per roadmap

---

## 2025-06-25 — Employee Management module (Phase 3)

### Added
- Complete `modules/employee/` — CRUD, profile, sub-resources, timeline, audit, CSV export/import
- Extended domain schemas: employee profile fields, document versioning, bank UPI/verification, timeline, skills, certifications, sequences
- Services: EmployeeService, EmployeeQueryService, EmployeeValidationService, EmployeeNumberService, EmployeeDocumentService (Cloudinary), EmployeeSubresourceService, EmployeeTimelineService, EmployeeAuditService, EmployeeExportService
- Employee permissions: `employee.*`, `employee.documents.*`, `employee.bank.*`, `employee.education.*`, `employee.experience.*`, `employee.skills.*`, `employee.certifications.*`, `employee.assets.*`, `employee.timeline.*`, `employee.managers.*`
- Validation: duplicate email/aadhaar/PAN, manager loop detection, subordinate check on delete
- Frontend employee module: list, create, profile dashboard with tabs (overview, documents, education, experience, skills, timeline, assets, reporting)
- Swagger JSDoc on employee routes at `/api/v1/employees/*`

### Changed
- Enterprise permission catalog extended with employee sub-resource permissions
- Routes mounted at `/api/v1/employees`

### Decisions
- Employee module separate from organization entity registry (complex sub-resources and business rules)
- Employee number via atomic sequence + configurable prefix in app settings
- Cloudinary-only storage with document versioning (`version`, `isLatest`, `publicId`)

### Next
- Time & Attendance module per roadmap

---

## 2025-06-25 — Enterprise RBAC module (Phase 2.5)

### Added
- Complete `modules/rbac/` — dynamic permission engine, role CRUD, assignments, simulator, hierarchies, super-admin guards
- Domain schemas: `permission_categories`, `role_groups`, `role_templates`, `approval_hierarchy_levels`; extended Permission, Role, EmployeeRole, ReportingHierarchy
- Services: PermissionCacheService (Redis + Mongo fallback), EffectivePermissionService, PermissionSimulatorService, SuperAdminGuardService, RbacAuditService
- Enterprise permission catalog (~100+ codes across auth, rbac, organization, employees, recruitment, projects, tasks, attendance, payroll, sales, chat, notifications, analytics, system)
- Default roles: Super Admin, Director, HR, Project Manager, Sales Manager, Finance, Employee, Intern
- Authorization middleware: `authorize()`, `authorizeAny()`, `authorizeAll()`, `authorizeOwnerOrPermission()` — permission codes only
- RBAC seeder (idempotent) replaces organization permission-sync seeder in seed pipeline
- Frontend RBAC module: dashboard, roles list/clone, permission matrix/tree, simulator, role comparison
- Swagger JSDoc on RBAC routes at `/api/v1/rbac/*`

### Changed
- Auth `PermissionEngineService` delegates to RBAC `EffectivePermissionService` + `PermissionCacheService`
- Seed pipeline order: bootstrap → rbac seeder → master data seeder

### Decisions
- Super Admin slug `super-admin` receives all catalog permissions dynamically; protected from delete/disable/strip
- Role `priority` field reserved for future inheritance; no hardcoded hierarchy logic
- Approval hierarchy seeded as levels only (no leave workflow yet)
- Reporting hierarchy supports matrix org relationship types

### Next
- Employee module per roadmap

---

## 2025-06-25 — Organization & Master Data module (Phase 2)

### Added
- Complete `modules/organization/` — registry-driven CRUD for 13 master data entities + company profile
- `modules/settings/` — dynamic app settings (key, value, type, group, validation, isPublic, isEditable, encrypted flag)
- Domain schemas: employment types, salary grades, leave types, project categories, technologies, skills, app settings
- Extended organization schemas: branch timezone/office timings/biometric-ready, department hierarchy/color/branch, job role skills/experience, work shift night/flexible, holiday types
- Shared services: MasterDataService, MasterDataCacheService (Redis + Mongo fallback), MasterDataAuditService (Winston + Mongo), DependencyValidatorService, CsvService
- Dot-notation permissions (`company.read`, `branch.create`, `settings.manage`, etc.) + idempotent permission sync seeder
- Master data seeder: default employment types, leave types, skills, settings (project statuses, task priorities)
- Frontend organization module: dashboard, entity list pages, settings page, DataTable, ConfirmDialog, TanStack Query hooks
- Swagger JSDoc on all organization and settings routes
- Collections: `employment_types`, `salary_grades`, `leave_types`, `project_categories`, `technologies`, `skills`, `app_settings`, `cache_entries`

### Changed
- Permission catalog expanded with dot-notation organization permissions
- Director role receives all `.read` dot permissions via catalog filter
- `npm run seed` runs bootstrap → permission sync → master data seeders

### Decisions
- Single entity registry avoids 13× duplicated CRUD controllers/services
- Departments expose virtual `employeeCount` on list (EmployeeRepository count)

### Next
- Employee module (Phase 3)

---

## 2025-06-25 — Auth module (Phase 1)

### Added
- Complete `modules/auth/` — login, refresh, logout, logout-all, forgot/reset password, `/me`, bootstrap wizard, system status
- JWT access + refresh tokens with rotation, replay protection (Redis), device sessions, login history
- RBAC permission engine with Redis cache; permission catalog for auth, company, employee, organization
- Bootstrap transaction: company, branch, org defaults, permissions, roles (super-admin, director), admin user/employee
- Middleware: authenticate, authorize (any/all), company-scope, system-init gate, login rate limit
- HttpOnly cookie support when `AUTH_USE_HTTP_ONLY_COOKIES=true`
- `npm run seed` CLI — idempotent bootstrap seeder (`SEED_*` env vars)
- User domain schema (`users`, `password_reset_tokens`, `password_history`); extended `device_sessions` and `login_histories`
- GET `/auth/me` returns user, company, branch, department, roles, permissions, manager, employee profile

### Changed
- `routes/v1/index.ts` — mounts `/auth` routes
- `config/jwt.config.ts` — re-exports from auth TokenService; deprecated legacy JwtPayload
- `shared/types/express.d.ts` — `req.user`, `req.auth`
- `shared/constants/error-codes.ts` — added `AUTH_FORBIDDEN`

### Next
- Users CRUD module; roles/permissions admin API; audit query API

---

## 2025-06-25 — Database foundation and domain layer

### Added
- Reusable database infrastructure: `BASE_SCHEMA_DEFINITION`, `BaseRepository`, `defineDomainModel()`, 8 Mongoose plugins, query helpers (pagination, sorting, filtering, search, projection, population, cursor pagination, date range)
- `DomainQueryFilter` bounded types to prevent TypeScript compiler OOM with 63 schemas
- Transaction helpers: `runInTransaction()`, `withSession()`
- Seed infrastructure: registry, runner, types (no data seeded)
- 63 domain Mongoose schemas across company, permission, organization, employee, recruitment, project, attendance, payroll, sales, communication, audit
- Model registration at startup via `registerDomainModels()` in `server.ts`
- `@domain/*` tsconfig path alias

### Changed
- TypeScript pinned to 5.8.3 (6.x caused compiler OOM with Mongoose 9 generics)
- Mongoose middleware updated for v9 (no `next` callback in pre hooks)
- Replaced deprecated `FilterQuery` with `QueryFilter` / bounded `DomainQueryFilter`

### Decisions
- `companyId` on base schema maps to design doc `tenantId`
- Global `permissions` catalog uses `withCompanyScope: false`
- Audit collections exclude soft delete and versioning plugins

### Next
- Phase 1: auth module, seed data, wire repositories into services

---

## 2025-06-25 — Domain Mongoose schema bundles

### Added
- Nine domain schema files under `backend/src/domain/` covering organization, employee, recruitment, project, attendance, payroll, sales, communication, and audit modules (58 entity schemas total)
- Document interfaces, `defineDomainModel` bundles, Model/Repository exports per entity
- Company-scoped compound indexes, text search on employees/projects/leads, audit collections with `withSoftDelete: false` and `withVersioning: false`

### Next
- Wire domain repositories into services and module routes
- Register schemas in database bootstrap / model registry if applicable

---

## 2025-06-25 — Upstash Redis and graceful degradation

Migrated from local Redis to Upstash with optional startup.

### Added

- `infrastructure/redis/redis.config.ts` — Upstash URL/token/TLS connection builder
- `infrastructure/redis/cache.service.ts` — cache adapter with graceful no-op when Redis unavailable
- `REDIS_REST_URL` / `REDIS_REST_TOKEN` env vars (reserved for future REST operations)
- Health status constants (`healthy`, `unavailable`, `enabled`, `disabled`)

### Changed

- **Redis env:** `REDIS_URL` + `REDIS_TOKEN` replace `REDIS_HOST`, `REDIS_PORT`, etc.
- **Startup:** MongoDB mandatory; Redis optional — connection failure logs once and continues
- **BullMQ:** Disabled when Redis unavailable; `QueueProducer` no-ops safely
- **`GET /health`:** Returns `{ mongodb, redis, queue }` status fields
- **Docker Compose:** Removed local Redis service
- Frontend home page displays new health fields

### Verified

- Backend typecheck, lint, build pass
- Application starts with empty `REDIS_URL` (Redis/queues disabled)

---

## 2025-06-25 — Shared production infrastructure (Phase 0)

Enterprise-grade reusable infrastructure for all future ERP modules. No business features implemented.

### Added

- **ResponseService** — success, paginated, created, updated, deleted, accepted, no-content responses
- **Error system** — AppError hierarchy (Validation, Auth, Authorization, NotFound, Conflict, RateLimit, Database, External, Internal) + ErrorHandlerService
- **Error codes** — centralized constants (`AUTH_INVALID_CREDENTIALS`, `VALIDATION_FAILED`, etc.)
- **Cloudinary UploadService** — image/pdf/document upload, delete, replace, signed upload, folder management
- **EmailService** — Nodemailer infrastructure, template-ready, queue-ready (Interview, Offer Letter, Password Reset, Leave, Payroll, etc.)
- **BullMQ** — queues: email, notification, payroll, attendance, report, document, dead-letter; producers, workers, monitor, retry + DLQ
- **Zod validators** — email, phone, aadhaar, pan, password, mongoId, date, pagination, sorting, search
- **Constants & enums** — roles, permissions, status, HTTP, headers, cookies, env keys, upload limits
- **Utilities** — date, time, currency, pagination, slug, randomId, password, token, fileSize, mime, csv, pdf, string, array, object, env
- **AuditLogService** — who/when/where/action/entity/old/new/ip/device/correlationId
- **NotificationService** — database, email, realtime handlers (push/SMS/WhatsApp architecture only)
- **FileValidationService** — images, PDF, office, resume; size/mime; virus-scan-ready
- **Middleware** — correlation context, response time, rate limiting, sanitization
- **Logging** — separate application, audit, security, http, queue, database, error loggers
- **Env validation** — Cloudinary, SMTP, Redis, Mongo, JWT, queue, security settings; fail-fast startup

### Changed

- Health endpoint uses standard `ResponseService` envelope
- Queue topology updated (replaced legacy notifications/reports/imports names)
- `app.constants.ts` re-exports shared HTTP/error constants
- `.env.example` — Cloudinary, SMTP, rate limit, queue retry settings

### Verified

- Backend typecheck, build, ESLint pass
- Frontend build pass
- Docker compose config updated (env includes new vars)

### Next

- Phase 1 — Identity & Access (auth, users, roles, tenants)

---

## 2025-06-25 — Root endpoint and CORS configuration

Production-ready CORS and API root metadata.

### Added

- `GET /` — returns API name, version, docs path, health path
- `config/cors.config.ts` — `FRONTEND_URL` parsing, origin validation, Socket.io shared logic
- `modules/root/` — root controller and routes

### Changed

- Replaced `CORS_ORIGIN` with `FRONTEND_URL` (comma-separated, trimmed)
- Development: auto-allows `localhost:517x` ports (5173, 5174, …)
- Production: only listed `FRONTEND_URL` origins allowed; no Origin header still permitted (curl, Postman, health)
- Swagger path → `/api-docs` (aligned with root response)
- `.env.example`, `.env.production.example`, `docker-compose.yml`

### Verified

- `GET /` returns expected JSON
- Origins `5173` and `5174` allowed with credentials
- No Origin header works (health, curl)
- Unknown origins rejected in development

### Next

- Phase 1 auth module

---

## 2025-06-25 — Phase 0 bootstrap (production foundation)

Full-stack project scaffold — backend, frontend, Docker, tooling. No business logic.

### Added

**Backend (`backend/`)**
- Express app with helmet, cors, compression, cookie-parser, JSON/urlencoded parsers
- Zod-validated environment config (`src/config/`)
- Mongoose MongoDB connection + Redis + BullMQ infrastructure adapters
- Winston logging (combined, error, http, audit) with daily rotation
- Morgan HTTP logging → Winston http log
- Middleware: request ID, request logger, async handler, global error handler, 404 handler
- Standardized API response envelope + AppError hierarchy
- JWT + Multer config (setup only, no routes)
- Socket.io initialization on HTTP server
- Swagger UI at `/api/docs` (empty paths)
- Health endpoint `GET /health` (server, MongoDB, Redis, queue, version, uptime)
- API versioning router `/api/v1` (empty, ready for modules)
- Graceful shutdown (SIGTERM/SIGINT)

**Frontend (`frontend/`)**
- Vite + React 18 + TypeScript strict + TailwindCSS
- shadcn/ui foundation (Button, theme CSS variables)
- React Router with root layout, home page, error page
- TanStack Query + Zustand stores (auth/theme placeholders)
- Axios client with interceptors + API types
- ProtectedRoute / PublicRoute placeholders
- ThemeProvider (light/dark/system)

**DevOps & tooling**
- `docker-compose.yml` (MongoDB, Redis, backend, frontend) with named volumes
- Backend and frontend Dockerfiles
- Root npm workspaces, `.gitignore`, `.editorconfig`, Prettier, ESLint
- Husky + lint-staged (requires git init)
- `README.md`, `.env.example` + `.env.production.example` (backend & frontend)

### Changed

- `.ai/modules.md` — 7 platform modules marked Complete; storage 30%
- `.ai/decisions.md` — ADR-009 Mongoose ODM

### Verified

- Backend starts on port 4000; `GET /health` returns `success: true` with all services `up`
- Frontend starts on port 5173; typecheck passes both workspaces
- Backend production build (`npm run build`) succeeds

### Next

- Complete Phase 0: S3 storage adapter, migrate-mongo, worker entrypoint, CI
- Begin Phase 1: Authentication & RBAC

---

## 2025-06-25 — Architecture Decision Records

Formalized initial technology and architecture choices in `.ai/decisions.md`.

### Added

- **ADR-001** — MongoDB as primary database
- **ADR-002** — Redis for cache, sessions, rate limiting, locks
- **ADR-003** — BullMQ for background jobs
- **ADR-004** — JWT access + refresh tokens
- **ADR-005** — RBAC authorization model
- **ADR-006** — Clean Architecture layered design
- **ADR-007** — TypeScript strict mode
- **ADR-008** — Express as HTTP framework

### Decisions

- Express chosen over NestJS/Fastify for thin HTTP layer and full architecture control
- ODM (Mongoose vs native driver) deferred to ADR-009

### Next

- Phase 0 repo scaffold with Express + MongoDB + Redis

---

## 2025-06-25 — Project initialization

Planning and documentation foundation for the HR Shakya ERP platform. No application code written.

### Added

- **`.ai/constitution.md`** — Permanent engineering rules: Clean Architecture, TypeScript strict, coding standards, Redis/BullMQ usage, API/Swagger/testing/git standards, Definition of Done
- **`.ai/roadmap.md`** — 12-phase implementation plan (Phases 0–11) with objectives, modules, dependencies, deliverables, and completion criteria; MVP defined as Phases 0–5
- **`.ai/modules.md`** — Module tracker for 66 modules across 12 categories (status, dependencies, progress, owner, future improvements)
- **`.ai/memory.md`** — Concise project memory for pre-task context (current phase, completed/pending work, decisions, next task)
- **`.ai/architecture.md`** — High-level system design: frontend SPA, modular monolith backend, auth/authorization flows, module communication, MongoDB/Redis/queue/logging/notification/storage layers, deployment, microservice readiness
- **`.ai/database.md`** — MongoDB design: 58 collections, relationships, indexes, compound indexes, future indexes, audit fields, soft delete strategy, naming conventions
- **`.ai/api.md`** — API registry: ~280 endpoints across 48 module groups (`/api/v1`, RBAC permissions, auth requirements)
- **`.cursor/rules/ERP-Production-Rules.mdc`** — Cursor agent workflow (read `.ai/` docs before tasks, update docs on completion)

### Decisions

- Modular monolith with Clean Architecture (Controllers → Services → Repositories)
- TypeScript strict mode; no `any`
- **MongoDB** as primary database (documented in `database.md`; supersedes early PostgreSQL references in constitution/architecture until ADR formalized)
- Redis (cache, locks, tokens) + BullMQ (async jobs) + S3-compatible object storage
- Multi-tenant shared database with `tenantId` on scoped documents
- JWT access + refresh tokens; RBAC enforced in service layer
- REST API versioned at `/api/v1`
- MVP scope: Phases 0–5 (platform, auth, org, employees, attendance/leave, payroll) + basic email

### Status

- **Phase 0 — Platform Foundation:** Not started
- **Application code:** None
- **Pending:** Phase 0 repo scaffold

### Next

- Begin Phase 0: repo scaffold, Docker Compose, health endpoints, CI skeleton

---

# HR Shakya ERP — Module Tracker

**Project:** HR Shakya ERP Platform  
**Aligned with:** `.ai/constitution.md`, `.ai/roadmap.md`  
**Last updated:** 2025-06-25 (enterprise configuration platform)

---

## How to Use This Document

Update this tracker whenever a module starts, progresses, ships, or changes ownership.

| Field | Allowed Values |
|-------|----------------|
| **Status** | `Not started` · `Planned` · `In progress` · `Complete` · `Blocked` · `Deprecated` |
| **Progress** | `0%`–`100%` — percentage of roadmap deliverables complete for that module |
| **Owner** | Team member or squad name; use `Unassigned` until allocated |
| **Dependencies** | Module slugs that must be `Complete` (or partially complete where noted) before this module starts |

---

## Summary

| Category | Modules | Complete | In Progress | Not Started |
|----------|---------|----------|-------------|-------------|
| Platform & Infrastructure | 12 | 12 | 0 | 0 |
| Identity & Access | 6 | 4 | 0 | 2 |
| Organization & Master Data | 6 | 6 | 0 | 0 |
| Employee Management | 4 | 4 | 0 | 0 |
| Recruitment & ATS | 6 | 6 | 0 | 0 |
| Project Management | 8 | 8 | 0 | 0 |
| Employee Workspace | 11 | 11 | 0 | 0 |
| Time, Attendance & Leave | 6 | 4 | 0 | 2 |
| Payroll & Compensation | 6 | 4 | 0 | 2 |
| Sales & CRM | 8 | 8 | 0 | 0 |
| Communication & Notifications | 6 | 6 | 0 | 0 |
| Reporting & Analytics | 4 | 4 | 0 | 0 |
| Finance & Accounting | 6 | 0 | 0 | 6 |
| Inventory & Procurement | 6 | 0 | 0 | 6 |
| Workflow, Notifications & Documents | 5 | 1 | 0 | 4 |
| Reporting & Analytics | 4 | 0 | 0 | 4 |
| Integrations & API Platform | 4 | 0 | 0 | 4 |
| Production & Operations | 4 | 0 | 0 | 4 |
| **Total** | **101** | **67** | **0** | **34** |

---

## Platform & Infrastructure

**Roadmap phase:** 0 (foundation) · **MVP:** Required

| Module | Description | Status | Dependencies | Progress | Owner | Future Improvements |
|--------|-------------|--------|--------------|----------|-------|---------------------|
| `shared` | Error hierarchy, ResponseService, error codes, constants, enums, validators, utilities | Complete | — | 100% | Unassigned | i18n-ready error messages |
| `config` | Typed environment configuration loader with validation (Zod) — Mongo, Redis, JWT, Cloudinary, SMTP, queue, security | Complete | — | 100% | Unassigned | Secrets manager adapter (Vault/AWS SM) |
| `infrastructure/database` | MongoDB/Mongoose connection, base schema, BaseRepository, plugins, query helpers, transactions, seed infra, 63 domain models | Complete | `config` | 100% | Unassigned | migrate-mongo; read replica routing |
| `infrastructure/redis` | Redis adapter with connection and health check | Complete | `config` | 100% | Unassigned | Redis Cluster support; cache helper methods |
| `infrastructure/queue` | BullMQ — email, notification, payroll, attendance, report, document, dead-letter; producers, workers, monitor | Complete | `config`, `infrastructure/redis` | 100% | Unassigned | Dedicated worker entrypoint; queue dashboard |
| `infrastructure/storage` | Cloudinary adapter — upload, delete, replace, signed upload; metadata in Mongo only | Complete | `config` | 100% | Unassigned | Virus scan hook; image transformations |
| `infrastructure/email` | Nodemailer service — template-ready, queue-ready; SMTP config | Complete | `config`, `infrastructure/queue` | 100% | Unassigned | HTML templates per email type |
| `infrastructure/audit` | AuditLogService — structured audit events to audit logger | Complete | `shared`, `logging` | 100% | Unassigned | MongoDB audit collection + query API |
| `infrastructure/notification` | Notification handler architecture — database, email, realtime | Complete | `shared`, `infrastructure/queue` | 100% | Unassigned | Push, SMS, WhatsApp handlers |
| `middleware` | Correlation ID, error handler, async wrapper, Morgan, rate limit, sanitization, response time | Complete | `shared` | 100% | Unassigned | Request timeout middleware |
| `logging` | Winston — application, audit, security, http, queue, database, error loggers | Complete | `config` | 100% | Unassigned | OpenTelemetry tracing integration |
| `health` | Health endpoint `/health` (server, MongoDB, Redis, queue, uptime) | Complete | `infrastructure/database`, `infrastructure/redis`, `infrastructure/queue` | 100% | Unassigned | Separate `/health/ready` if needed |

---

## Identity & Access

**Roadmap phase:** 1 · **MVP:** Required

| Module | Description | Status | Dependencies | Progress | Owner | Future Improvements |
|--------|-------------|--------|--------------|----------|-------|---------------------|
| `auth` | Login, logout, token refresh, password reset, session management, bootstrap wizard, RBAC permission engine (delegates to EffectivePermissionService) | Complete | `shared`, `infrastructure/database`, `infrastructure/redis`, `middleware`, `rbac` | 100% | Unassigned | SSO/OAuth2 (Google, Azure AD); MFA/TOTP |
| `users` | User accounts, profile, status (active/inactive/locked) | Not started | `auth`, `tenants` | 0% | Unassigned | Self-service profile; avatar upload |
| `roles` | Role definitions, groups, templates, clone, archive, priority, permission assignment | Complete | `permissions`, `rbac` | 100% | Unassigned | Role inheritance from priority (future) |
| `permissions` | Enterprise permission catalog, groups, categories, dependencies, metadata, cache | Complete | `shared`, `rbac` | 100% | Unassigned | Fine-grained field-level permissions; deny rules |
| `rbac` | Assignments, effective permissions, simulator, approval/reporting hierarchy, super-admin guards, audit | Complete | `auth`, `permissions`, `roles` | 100% | Unassigned | Matrix org reporting; role inheritance |
| `tenants` | Tenant registration, context resolution, tenant-scoped queries | Not started | `infrastructure/database`, `auth` | 0% | Unassigned | Subdomain routing; tenant branding settings |
| `audit` | Audit log write service and admin query API | Not started | `auth`, `users`, `tenants` | 0% | Unassigned | Immutable audit store; export for compliance |

---

## Organization & Master Data

**Roadmap phase:** 2 · **MVP:** Required

| Module | Description | Status | Dependencies | Progress | Owner | Future Improvements |
|--------|-------------|--------|--------------|----------|-------|---------------------|
| `organization` | Company profile, branches, departments, designations, job roles, shifts, holidays, skills, technologies, master data CRUD, bulk/CSV, cache, audit; **frontend:** entity admin, setup wizard, org chart | Complete | `auth`, `audit` | 100% | Unassigned | Biometric device integration; org chart API |
| `settings` | Enterprise Configuration Platform — 21 sections, catalog, version history, feature flags, navigation manager, audit explorer, system health; frontend `/system/configuration` | Complete | `auth`, `organization` | 100% | Unassigned | Setting encryption at rest; plugin menus |
| `departments` | *(merged into `organization`)* | Complete | `organization` | 100% | Unassigned | Org chart visualization API |
| `locations` | *(merged — office locations + branches in `organization`)* | Complete | `organization` | 100% | Unassigned | Geo-fencing for attendance |
| `designations` | *(merged into `organization`)* | Complete | `organization` | 100% | Unassigned | Career path definitions |
| `lookups` | *(merged — employment types, leave types, salary grades, project categories)* | Complete | `organization` | 100% | Unassigned | Tenant-custom lookup values |
| `holidays` | *(merged into `organization`)* | Complete | `organization` | 100% | Unassigned | Government holiday API import |

---

## Employee Management

**Roadmap phase:** 3 · **MVP:** Required

| Module | Description | Status | Dependencies | Progress | Owner | Future Improvements |
|--------|-------------|--------|--------------|----------|-------|---------------------|
| `employees` | Employee profile, employment details, status lifecycle, auto employee number, timeline | Complete | `departments`, `designations`, `organization`, `rbac` | 100% | Unassigned | Employee self-service portal; custom fields per tenant |
| `employee-documents` | Cloudinary document upload, versioning, profile photo sync | Complete | `employees`, `infrastructure/storage` | 100% | Unassigned | OCR for ID extraction; automated expiry reminders |
| `employee-org` | Department, designation, manager assignment, reporting hierarchy | Complete | `employees`, `organization`, `rbac` | 100% | Unassigned | Org change history; effective-dated assignments |
| `employee-bank` | Bank account details, UPI, cancelled cheque, verification status | Complete | `employees` | 100% | Unassigned | Bank verification API; encryption at rest |

---

## Recruitment & ATS

**Roadmap phase:** 3.5 · **MVP:** Required

| Module | Description | Status | Dependencies | Progress | Owner | Future Improvements |
|--------|-------------|--------|--------------|----------|-------|---------------------|
| `candidates` | Candidate CRUD, search, archive/restore, merge, duplicate detection, bulk import/export | Complete | `rbac`, `infrastructure/storage`, `infrastructure/queue` | 100% | Unassigned | AI resume parsing; LinkedIn import |
| `recruitment-pipeline` | Configurable stages, kanban, transition logging | Complete | `candidates`, `audit` | 100% | Unassigned | Custom stage rules per job role |
| `interviews` | Multi-round scheduling, types, feedback, reminders (queued email) | Complete | `candidates`, `employees`, `infrastructure/queue` | 100% | Unassigned | Calendar sync (Google/Outlook) |
| `offers` | HTML offer letter generation, Cloudinary storage, accept/reject, versioning | Complete | `candidates`, `infrastructure/storage`, `infrastructure/queue` | 100% | Unassigned | True PDF generation; e-sign integration |
| `onboarding` | Dynamic multi-section form, draft save, progress tracker, e-sign placeholder | Complete | `candidates` | 100% | Unassigned | DocuSign/Adobe Sign integration |
| `candidate-conversion` | One-click candidate → employee (User, Employee, Role, Timeline, Notification) | Complete | `candidates`, `offers`, `onboarding`, `employees`, `rbac` | 100% | Unassigned | Pre-fill employee profile from onboarding |

---

## Project Management

**Roadmap phase:** 4 · **MVP:** Required

| Module | Description | Status | Dependencies | Progress | Owner | Future Improvements |
|--------|-------------|--------|--------------|----------|-------|---------------------|
| `projects` | Project CRUD, archive, logo, tags, tech stack, URLs, risk, visibility | Complete | `organization`, `employees`, `rbac`, `infrastructure/storage` | 100% | Unassigned | Gantt chart integration |
| `project-members` | Role-based assignment, allocation %, join/leave dates | Complete | `projects`, `employees` | 100% | Unassigned | Capacity planning |
| `project-modules` | Feature modules with dependencies, progress, hours | Complete | `projects` | 100% | Unassigned | Module templates |
| `milestones` | Milestone CRUD, dependencies, auto progress from tasks | Complete | `projects`, `tasks` | 100% | Unassigned | Critical path analysis |
| `sprints` | Sprint planning, capacity, velocity, burndown-ready | Complete | `projects`, `tasks` | 100% | Unassigned | Calendar sync |
| `tasks` | Enterprise tasks — workflow, dependencies, attachments, comments | Complete | `projects`, `sprints`, `modules`, `milestones` | 100% | Unassigned | AI task estimation |
| `task-verification` | Employee complete → PM verify/reject/revision | Complete | `tasks`, `employees` | 100% | Unassigned | Multi-level approval |
| `work-logs` | Daily work logs with hours, blockers, manager comments | Complete | `projects`, `tasks`, `employees` | 100% | Unassigned | Timesheet integration |
| `knowledge-base` | Repo, API docs, encrypted credentials/env, Cloudinary docs | Complete | `projects`, `infrastructure/storage` | 100% | Unassigned | Secret manager integration |

---

## Employee Workspace (Self-Service Portal)

**Roadmap phase:** 4 · **MVP:** Required

| Module | Description | Status | Dependencies | Progress | Owner | Future Improvements |
|--------|-------------|--------|--------------|----------|-------|---------------------|
| `workspace` | Modular dashboard, widget config, role-aware widgets | Complete | `employees`, `rbac`, `projects`, `notifications` | 100% | Unassigned | Drag-and-drop layout |
| `workspace-widgets` | 14 independent widget data loaders | Complete | `tasks`, `projects`, `announcements`, `notifications` | 100% | Unassigned | Custom widget plugins |
| `workspace-profile` | Self-service profile, sessions, permissions | Complete | `employees`, `rbac`, `auth` | 100% | Unassigned | Profile photo self-upload |
| `workspace-hierarchy` | Interactive org chart (manager, peers, reports) | Complete | `employees`, `reporting_hierarchies`, `organization` | 100% | Unassigned | Visual org chart UI |
| `workspace-my-projects` | Assigned projects, role, progress, deadlines | Complete | `projects`, `project-members` | 100% | Unassigned | Inline milestone updates |
| `workspace-my-tasks` | Kanban, list, calendar, bulk actions | Complete | `tasks` | 100% | Unassigned | Timer / time tracking |
| `workspace-documents` | Cloudinary document center, download audit | Complete | `employees`, `cloudinary`, `audit` | 100% | Unassigned | Renewal reminders |
| `workspace-announcements` | Audience-filtered announcements, ack receipts | Complete | `announcements`, `employees` | 100% | Unassigned | Push notifications |
| `workspace-notifications` | Notification center — group, filter, archive | Complete | `notifications` | 100% | Unassigned | Realtime via Socket.io |
| `workspace-calendar` | Deadlines, holidays, birthdays, interviews | Complete | `tasks`, `holidays`, `recruitment` | 100% | Unassigned | Leave overlay |
| `workspace-search` | Global search across projects, tasks, docs | Complete | `projects`, `tasks`, `announcements` | 100% | Unassigned | Universal search index |

---

## Time, Attendance & Leave

**Roadmap phase:** 4 · **MVP:** Required

| Module | Description | Status | Dependencies | Progress | Owner | Future Improvements |
|--------|-------------|--------|--------------|----------|-------|---------------------|
| `shifts` | Shift definitions, schedules, employee assignments | Not started | `employees`, `locations` | 0% | Unassigned | Rotating shift patterns; shift swap requests |
| `attendance` | Clock-in/out, punch events, calculator, policies, shift assignments, corrections via approval, reports, monthly payroll snapshot | Complete | `organization`, `employees`, `approval`, `settings` | 100% | Unassigned | Biometric device integration; geo-tagged mobile clock-in |
| `leave-types` | Leave categories (annual, sick, unpaid, etc.) | Complete | `lookups`, `tenants` | 100% | Unassigned | Uses master-data `leave_types` + dynamic `leave_policies` |
| `leave-policies` | Accrual rules, carry-forward, max balance, negative balance, half-day | Complete | `leave-types`, `approval` | 100% | Unassigned | Policy simulation; multi-policy per employee group |
| `leave-requests` | Apply, withdraw, calendar — all via approval engine | Complete | `leave-policies`, `leave-balances`, `approval` | 100% | Unassigned | Attachment upload endpoint (future) |
| `leave-balances` | Balance ledger per employee per policy with pending reserve | Complete | `leave-policies`, `leave-requests` | 100% | Unassigned | Scheduled accrual jobs (future) |
| `leave-exit` | Resignation, exit checklist, F&F prep, company calendar | Complete | `approval`, `employees`, `holidays` | 100% | Unassigned | Payroll integration for F&F settlement |

---

## Payroll & Compensation

**Roadmap phase:** 5 · **MVP:** Required

| Module | Description | Status | Dependencies | Progress | Owner | Future Improvements |
|--------|-------------|--------|--------------|----------|-------|---------------------|
| `salary-structures` | Earnings and deduction components (basic, HRA, allowances) | Not started | `lookups`, `tenants` | 0% | Unassigned | Formula-based components; component libraries per country |
| `employee-compensation` | Salary structure assignment, revision workflow, versioned history | Complete | `payroll`, `employees`, `approval` | 100% | Unassigned | Compensation benchmarking |
| `payroll-runs` | Monthly payroll execution, approval, locking, payslip generation | Complete | `employee-compensation`, `attendance`, `approval`, `settings` | 100% | Unassigned | Statutory plugin packs per country |
| `payslips` | Payslip records, HTML generation, employee self-download | Complete | `payroll-runs`, `employees` | 100% | Unassigned | Password-protected PDF; Cloudinary storage |
| `tax-config` | Tax slabs and statutory deductions (region-configurable) | Not started | `lookups`, `tenants` | 0% | Unassigned | Multi-country tax engines; auto-update tax tables |
| `payroll-adjustments` | One-off bonuses, deductions, arrears | Not started | `payroll-runs`, `employees` | 0% | Unassigned | Retroactive adjustment calculator; bulk adjustment import |

---

## Sales & CRM

**Roadmap phase:** 6 · **MVP:** Post-MVP (shipped)

| Module | Description | Status | Dependencies | Progress | Owner | Future Improvements |
|--------|-------------|--------|--------------|----------|-------|---------------------|
| `lead-sources` | Configurable lead source master data | Complete | `organization`, `settings` | 100% | Unassigned | Source attribution analytics drill-down |
| `pipelines` | Configurable pipelines and stages (no code deploy) | Complete | `settings` | 100% | Unassigned | Stage probability weights; automation rules per stage |
| `territories` | Geographic/account territory assignment | Complete | `employees`, `organization` | 100% | Unassigned | Geo-fencing; territory overlap rules |
| `sales-teams` | Team structure with manager and members | Complete | `employees`, `rbac` | 100% | Unassigned | Cross-team lead sharing policies |
| `leads` | Lead CRUD, scoring, tags, priority, import/export | Complete | `lead-sources`, `pipelines`, `employees` | 100% | Unassigned | Duplicate detection; enrichment APIs |
| `lead-assignment` | Manual, auto, territory, manager override; immutable history | Complete | `leads`, `sales-teams`, `territories` | 100% | Unassigned | Round-robin queue (schema ready) |
| `lead-activities` | Calls, meetings, notes, attachments, timeline | Complete | `leads`, `audit` | 100% | Unassigned | Email/WhatsApp channel sync |
| `sales-reports` | Source, executive, pipeline, conversion, revenue, activity, follow-up + CSV/PDF | Complete | `leads`, `deals`, `pipelines` | 100% | Unassigned | Scheduled report delivery |

---

## Communication & Notifications

**Roadmap phase:** 8 · **MVP:** Partial (shipped)

| Module | Description | Status | Dependencies | Progress | Owner | Future Improvements |
|--------|-------------|--------|--------------|----------|-------|---------------------|
| `announcements` | Company/branch/dept/team/project announcements with scheduling, emergency, read tracking | Complete | `employees`, `organization`, `settings` | 100% | Unassigned | Multilingual content |
| `direct-messaging` | 1:1 chat with receipts, reply, forward, edit, delete, attachments | Complete | `auth`, `employees` | 100% | Unassigned | Typing indicators; voice/video |
| `team-channels` | Project, department, team, read-only, private channels | Complete | `projects`, `employees` | 100% | Unassigned | Threaded replies |
| `notification-center` | Centralized in-app notifications with categories, archive, preferences | Complete | `infrastructure/notification` | 100% | Unassigned | Realtime WebSocket push |
| `communication-inbox` | Aggregated system messages (approval, payroll, leave, etc.) | Complete | `approval`, `payroll`, `attendance`, `leave` | 100% | Unassigned | Unified mark-all-read rules |
| `communication-reports` | Reach, read stats, channel activity, analytics + CSV | Complete | `announcements`, `conversations` | 100% | Unassigned | Scheduled delivery |

---

## Finance & Accounting

**Roadmap phase:** 6 · **MVP:** Post-MVP

| Module | Description | Status | Dependencies | Progress | Owner | Future Improvements |
|--------|-------------|--------|--------------|----------|-------|---------------------|
| `chart-of-accounts` | Account hierarchy and account types | Not started | `organization`, `lookups`, `tenants` | 0% | Unassigned | Industry-specific COA templates |
| `journal-entries` | Double-entry bookkeeping and posting | Not started | `chart-of-accounts`, `payroll-runs` | 0% | Unassigned | Recurring journal templates; reversal entries |
| `invoices` | Customer invoices, line items, status lifecycle | Not started | `chart-of-accounts`, `journal-entries` | 0% | Unassigned | Recurring invoices; PDF/email delivery |
| `payments` | Payment recording and reconciliation | Not started | `invoices`, `journal-entries` | 0% | Unassigned | Payment gateway integration; bank feed reconciliation |
| `expenses` | Employee expense claims, approval, reimbursement | Not started | `employees`, `journal-entries` | 0% | Unassigned | Receipt OCR; mileage calculator; migrate to `workflows` |
| `finance-reports` | Trial balance, ledger extract, basic financial reports | Not started | `journal-entries`, `chart-of-accounts` | 0% | Unassigned | P&L, balance sheet; multi-period comparison |

---

## Inventory & Procurement

**Roadmap phase:** 7 · **MVP:** Post-MVP

| Module | Description | Status | Dependencies | Progress | Owner | Future Improvements |
|--------|-------------|--------|--------------|----------|-------|---------------------|
| `items` | Item master, categories, units of measure | Not started | `lookups`, `tenants` | 0% | Unassigned | Barcode generation; item variants |
| `warehouses` | Warehouse and stock location management | Not started | `locations`, `items` | 0% | Unassigned | Bin/shelf location tracking |
| `stock` | Stock levels, movements, adjustments | Not started | `items`, `warehouses`, `journal-entries` | 0% | Unassigned | Batch/serial number tracking; FIFO/LIFO full implementation |
| `suppliers` | Supplier master data | Not started | `lookups`, `tenants` | 0% | Unassigned | Supplier rating; payment terms management |
| `purchase-orders` | PO lifecycle, approval, goods receipt | Not started | `suppliers`, `items`, `stock`, `workflows` (partial) | 0% | Unassigned | Three-way matching (PO/receipt/invoice) |
| `stock-alerts` | Low stock notification scheduled job | Not started | `stock`, `notifications` (partial), `infrastructure/queue` | 0% | Unassigned | Predictive reorder suggestions; auto-PO draft |

---

## Workflow, Notifications & Documents

**Roadmap phase:** 8 · **MVP:** Partial (basic email in MVP)

| Module | Description | Status | Dependencies | Progress | Owner | Future Improvements |
|--------|-------------|--------|--------------|----------|-------|---------------------|
| `workflows` | Universal approval engine — configurable chains, inbox, bulk approve, escalation | Complete | `auth`, `rbac`, `employees`, `infrastructure/queue` | 100% | Unassigned | Visual workflow designer; conditional branching; delegation API |
| `notifications` | In-app notifications, read/unread state | Not started | `users`, `tenants` | 0% | Unassigned | Push notifications (mobile); notification digests |
| `email` | Email dispatch via BullMQ with retry | Not started | `infrastructure/queue`, `templates` | 0% | Unassigned | SMS/WhatsApp channel; deliverability tracking |
| `templates` | Email, PDF, and notification templates with variables | Not started | `shared`, `tenants` | 0% | Unassigned | Template preview; multi-language templates |
| `documents` | Generic document store with access control and versioning | Not started | `infrastructure/storage`, `auth`, `audit` | 0% | Unassigned | Full-text search; document retention policies |

---

## Reporting & Analytics

**Roadmap phase:** 9 · **MVP:** Post-MVP (shipped)

| Module | Description | Status | Dependencies | Progress | Owner | Future Improvements |
|--------|-------------|--------|--------------|----------|-------|---------------------|
| `dashboards` | Executive + role-based KPI dashboards with configurable widgets | Complete | All domain modules | 100% | Unassigned | Real-time WebSocket refresh |
| `reports` | Centralized report engine delegating to domain module services | Complete | attendance, payroll, sales, project, recruitment | 100% | Unassigned | Scheduled report cron |
| `exports` | CSV/PDF export via delegated module exporters + HTML print | Complete | `reports` | 100% | Unassigned | Excel export; streaming large datasets |
| `analytics` | HR/Finance/Project/Sales/Attendance analytics bundles | Complete | domain modules | 100% | Unassigned | Predictive workforce forecasts |

---

## Integrations & API Platform

**Roadmap phase:** 12 · **MVP:** Post-MVP · **Module path:** `backend/src/modules/integration/`

| Module | Description | Status | Dependencies | Progress | Owner | Future Improvements |
|--------|-------------|--------|--------------|----------|-------|---------------------|
| `integration` | Unified platform: Integration Center, API keys, webhooks, import/export, scheduler, logs, backup | Complete | `settings`, `auth`, `infrastructure/queue`, `infrastructure/storage`, org/sales importers | 100% | Unassigned | OAuth; allowed IPs; biometric/WhatsApp/SMS/payment/calendar connectors |
| `webhooks` | Event subscription, delivery, retry, HMAC signatures (within `integration`) | Complete | `auth`, `infrastructure/queue`, `audit` | 100% | Unassigned | Webhook replay; custom endpoints |
| `api-keys` | Service account keys with scoped permissions, rotate/revoke/regenerate | Complete | `auth`, `permissions` | 100% | Unassigned | Usage quotas per key; OAuth |
| `import-export` | Generic import preview/execute + export CSV/PDF/XLSX via delegated module pipelines | Complete | `organization`, `sales`, `infrastructure/queue` | 100% | Unassigned | XLSX import; incremental sync; conflict resolution UI |
| `scheduler` | Centralized cron jobs, run-now, history, enable/disable | Complete | `infrastructure/queue` | 100% | Unassigned | Payroll/attendance/reminder/cleanup job templates |
| `backup` | Settings backup, history, verification; restore architecture stub | Complete | `settings` | 100% | Unassigned | Cloud backup; DB restore when env supports |

---

## Production & Operations

**Roadmap phase:** 11 · **MVP:** Post-MVP

| Module | Description | Status | Dependencies | Progress | Owner | Future Improvements |
|--------|-------------|--------|--------------|----------|-------|---------------------|
| `observability` | Metrics, distributed tracing, alerting hooks | Not started | `middleware`, `health`, `infrastructure/queue` | 0% | Unassigned | OpenTelemetry full coverage; SLO dashboards |
| `security` | Pen test remediation, secrets rotation, security baseline | Not started | All MVP modules (`Phase 0–5`) | 0% | Unassigned | Automated SAST/DAST in CI; bug bounty program |
| `operations` | Runbooks, backup/restore, deployment automation | Not started | `observability`, `infrastructure/database` | 0% | Unassigned | Blue-green deployments; chaos engineering drills |
| `performance` | Load testing, query optimization, caching audit | Not started | `observability`, MVP + critical path modules | 0% | Unassigned | Auto-scaling policies; query plan regression tests |

---

## Module Dependency Matrix

Quick reference for cross-module dependencies. `●` = hard dependency (must be complete). `◐` = soft dependency (partial/stub acceptable).

| Module | Depends On |
|--------|------------|
| `auth` | `shared`, `infrastructure/database`, `infrastructure/redis`, `middleware` |
| `users` | `auth`, `tenants` |
| `employees` | `departments`, `designations`, `locations`, `lookups`, `users` |
| `attendance` | `shifts`, `employees`, `holidays`, `infrastructure/redis` |
| `leave-requests` | `leave-policies`, `leave-balances`, `employees`, `holidays` |
| `payroll-runs` | `employee-compensation`, `attendance`, `leave-balances`, `employee-bank`, `infrastructure/queue` |
| `journal-entries` | `chart-of-accounts`, `payroll-runs` |
| `purchase-orders` | `suppliers`, `items`, `stock`, `workflows` ◐ |
| `workflows` | `auth`, `users`, `roles`, `infrastructure/queue` |
| `dashboards` | `employees`, `attendance`, `payroll-runs` (+ finance/inventory when available) |
| `webhooks` | `auth`, `infrastructure/queue`, `audit` |
| `observability` | `middleware`, `health`, `infrastructure/queue` |

---

## MVP Module Scope

Modules required before MVP launch (Phases 0–5 + basic email):

| Priority | Module | MVP Critical |
|----------|--------|:------------:|
| P0 | `shared`, `config`, `infrastructure/database`, `infrastructure/redis`, `infrastructure/queue`, `middleware`, `health` | ✓ |
| P0 | `auth`, `users`, `roles`, `permissions`, `tenants`, `audit` | ✓ |
| P0 | `organization`, `departments`, `locations`, `designations`, `lookups`, `holidays` | ✓ |
| P0 | `employees`, `employee-documents`, `employee-org`, `employee-bank` | ✓ |
| P0 | `shifts`, `attendance`, `leave-types`, `leave-policies`, `leave-requests`, `leave-balances` | ✓ |
| P0 | `salary-structures`, `employee-compensation`, `payroll-runs`, `payslips`, `tax-config`, `payroll-adjustments` | ✓ |
| P1 | `infrastructure/storage` | ✓ |
| P1 | `email`, `templates` (basic — no full `workflows` engine) | ✓ |
| P2 | All Phase 6–11 modules | — |

---

## Ownership Registry

Assign owners as the team scales. One primary owner per module; secondary owners optional.

| Owner | Modules Owned | Contact |
|-------|---------------|---------|
| Unassigned | All modules (66) | — |

---

## Status Change Log

Record significant module status transitions.

| Date | Module | From | To | Progress | Notes |
|------|--------|------|-----|----------|-------|
| 2025-06-25 | `shared`, `config`, `middleware`, `health`, `infrastructure/database`, `infrastructure/redis`, `infrastructure/queue` | Not started | Complete | 100% | Phase 0 bootstrap |
| 2025-06-25 | `infrastructure/storage` | Not started | In progress | 30% | Multer config only |

---

## Revision History

| Date | Change | Author |
|------|--------|--------|
| 2025-06-25 | Initial module tracker — 66 modules across 12 categories | AI Agent |

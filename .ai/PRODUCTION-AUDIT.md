# HR Shakya ERP — Production Readiness Audit

**Date:** 2025-06-25  
**Scope:** Full stack functional, architectural, UX, security, workflow, and runtime review  
**Standard:** Enterprise ERP (SAP / Oracle HCM / Zoho People / Odoo / Dynamics parity for implemented modules)

---

## Executive Summary

| Area | Status | Notes |
|------|--------|-------|
| Portal separation | **Pass** (after fixes) | Three portals enforced via nav + route registry + guard |
| Permission model | **Pass with gaps** | Backend authorize + frontend guards; UI button audit partial |
| Security | **Pass** | See `.ai/SECURITY-AUDIT.md` |
| TypeScript / Build | **Pass** | `typecheck` + `build` succeed |
| ESLint | **Fail (tooling)** | `eslint` script exists but package not installed |
| Workflows (UI-complete) | **Pass with gaps** | Core CRUD flows work; some approval/dialog rollouts pending |
| Dashboards | **Pass** | Persona-specific KPI widgets; workspace backend-driven |
| Performance | **Advisory** | Main bundle ~958 KB; code-splitting recommended |

**Verdict:** Feature-complete modules are **production-ready** when deployed with production env hardening (see SECURITY-AUDIT). Remaining items are enhancements, not blockers.

---

## Completed (Pre-Audit Baseline)

- Clean Architecture backend with module boundaries
- RBAC permission catalog and route-level `authorize()` middleware
- Three-portal persona model (Enterprise / Manager / Workspace)
- Dynamic navigation from `module-registry` + feature flags
- Enterprise security hardening (Phase 15)
- Shared UI foundation: Dialog, Sheet, DataTable, PageDataBoundary, error boundaries
- Project creation wizard with draft save
- Integration platform (connectors, webhooks, import/export, scheduler)

---

## Fixed (This Audit Session)

### Critical — Route & Portal Security

| Issue | Fix |
|-------|-----|
| `isPathAllowedForPortal` returned `true` for unregistered routes (URL bypass) | **Fail-closed** — unknown paths denied |
| `findRouteMeta` used first prefix match (wrong portal for child routes) | **Longest-match** algorithm with param patterns |
| `/reports/dashboard/hr` shadowed by parent `/reports/dashboard` | Specificity scoring resolves manager team reports |
| `/leave-exit/apply`, `/employees/new`, `/sales/leads/:id` mis-gated | Child routes win over parents |
| Missing registry entries for detail routes, settings, reports portal | Added `:id`, `:role`, `:domain/:type`, `/reports/portal`, redirects |
| Denied access silently redirected to home | Redirect to **`/403`** with `from` state |

### Navigation

| Issue | Fix |
|-------|-----|
| Nav links to `/admin/notifications`, `/admin/activity`, `/system/security` (404) | Repointed to `COMMUNICATION_ADMIN`, `AUDIT_EXPLORER`, `configuration/security` |
| Duplicate hardcoded `WorkspaceNav` in workspace pages | Removed — `PortalSidebar` is sole nav (prior session) |

### Persona / Permissions (UI)

| Page | Fix |
|------|-----|
| Employees list | Create/Export buttons gated by `employee.create` / `employee.read` |
| Candidates list | Create/Export gated by `candidate.create` / `candidate.read` |
| Workspace project widget | Links to `WORKSPACE_PROJECTS` (not enterprise `/projects/:id`) |

---

## Improved

- Enterprise dashboard widgets aligned to company KPIs (headcount, pipeline, portfolio, attendance, risk, system health)
- Manager dashboard widgets aligned to team KPIs (approvals, interviews, team leave, attendance)
- Portal guard UX: explicit 403 instead of silent home redirect
- Route registry coverage for organization settings and entity detail paths

---

## Module-by-Module Audit

### Organization (Enterprise)

| Check | Status |
|-------|--------|
| Portal | Enterprise only |
| CRUD | Entity admin via Sheet dialogs; setup wizard |
| Permissions | Entity-level read/create/update |
| Gaps | Org chart read-only visualization OK |

### Employees

| Check | Status |
|-------|--------|
| Enterprise | Full CRUD, export, create dialog |
| Manager | Read team via same list (backend scopes) |
| Workspace | Profile page only |
| Gaps | Archive/restore UI on list — verify per detail page |

### Recruitment

| Check | Status |
|-------|--------|
| Enterprise | Dashboard, pipeline, interviews, analytics |
| Manager | Candidates, pipeline, interviews (no config) |
| Workspace | No access |
| Gaps | Module sub-nav (`RecruitmentNav`) acceptable as in-module tabs |

### Projects

| Check | Status |
|-------|--------|
| Enterprise | Create wizard, portfolio dashboard, admin panel |
| Manager | Assigned projects, manager dashboard |
| Workspace | My projects, my tasks |
| Gaps | Assign dialogs rollout incomplete on some pages |

### Attendance

| Check | Status |
|-------|--------|
| Enterprise | Policies, HR overview, reports |
| Manager | Team attendance, approvals |
| Workspace | Check in/out, correction request |
| Portal redirect | `AttendancePortalPage` routes by permission |

### Leave & Exit

| Check | Status |
|-------|--------|
| Enterprise | Policies, all requests, calendar, balances |
| Manager | Pending requests, team calendar |
| Workspace | Apply leave, my balance, resignation |
| Gaps | Approval dialogs not on all list pages |

### Payroll

| Check | Status |
|-------|--------|
| Enterprise | Configuration, HR compensation, reports |
| Manager | Finance review (`payroll.process`) |
| Workspace | My payslips only |
| Portal redirect | `PayrollPortalPage` routes correctly |

### Sales CRM

| Check | Status |
|-------|--------|
| Enterprise | Pipeline rules, analytics |
| Manager | Team leads |
| Workspace | My leads (`SALES_EXECUTIVE`) |
| Portal redirect | `SalesPortalPage` routes by permission |

### Reports & Analytics

| Check | Status |
|-------|--------|
| Enterprise | Executive BI, catalog, analytics hub |
| Manager | Role dashboards (`/reports/dashboard/:role`) |
| Workspace | Personal via workspace widgets only |

### Communication

| Check | Status |
|-------|--------|
| Enterprise | Announcements, broadcasts, reports |
| Manager | Team messages, inbox |
| Workspace | Messages, announcements, notifications |

### Settings / Integrations / RBAC

| Check | Status |
|-------|--------|
| Enterprise only | Configuration hub, integrations, RBAC, audit explorer |
| Security | Prior hardening complete |

---

## Dashboard Audit

| Dashboard | Question Answered | Widgets |
|-----------|-------------------|---------|
| Enterprise | How is the company performing? | Headcount, recruitment pipeline, portfolio, company attendance, projects at risk, on leave, activity, system health |
| Manager | How is my team performing? | Team size, pending approvals, active projects, interviews, team on leave, team attendance, at-risk projects |
| Workspace | What work today? | Backend widget catalog (tasks, projects, deadlines, notifications, announcements, quick links) |

**Removed from enterprise:** Pending approvals (operational → manager dashboard).

**Placeholder widgets:** Workspace backend may return `placeholder: true` — renders EmptyState (acceptable for optional catalog entries).

---

## Workflow Audit

| Workflow | Start → Finish | UI Complete |
|----------|----------------|-------------|
| Employee onboarding | Create dialog → detail | Yes |
| Candidate | Create dialog → pipeline → interview | Yes |
| Project | 11-step wizard + draft | Yes |
| Leave apply | Apply page → approval inbox | Yes (manager) |
| Attendance punch | Workspace check-in | Yes |
| Payroll run | Enterprise config → finance review | Yes |
| Approval | Inbox → history | Yes |
| Org setup | Setup wizard | Yes |

**Known gap:** Timer tracking on workspace tasks marked "coming soon" — non-blocking.

---

## Security Audit

See **`.ai/SECURITY-AUDIT.md`** for full detail.

| Control | Status |
|---------|--------|
| Authentication | JWT + refresh; HttpOnly cookie path in prod |
| Authorization | Backend `authorize()` + frontend portal guard |
| Rate limiting | Auth endpoints |
| Headers | Helmet + nginx |
| Log redaction | Implemented |
| URL bypass (frontend) | **Fixed** — fail-closed route registry |

---

## Performance Audit

| Item | Status | Recommendation |
|------|--------|----------------|
| Main JS bundle | ~958 KB | Manual chunks for heavy modules |
| Widget lazy load | Enterprise widgets lazy | Good |
| API pagination | Most list endpoints | Good |
| Redis / cache | Backend cache service | Good |
| Duplicate requests | React Query | Good |

---

## Consistency Audit

| Item | Status |
|------|--------|
| PageHeader + breadcrumbs | Most enterprise pages |
| DataTable + PageDataBoundary | Key list pages |
| Dialog/Sheet CRUD | Employee, candidate, entity, roles, workflows |
| Remaining | Roll defensive patterns to all ~106 pages |

---

## Remaining Issues (Non-Blocking)

1. **ESLint not configured** — `npm run lint` fails; ESLint not in `devDependencies`. Add flat config + install packages.
2. **Page-level permission audit incomplete** — Not every list page hides create/export/archive by permission (pattern established on employees/candidates).
3. **Approval/leave dialogs** — Not rolled out to every approval surface.
4. **Workspace task timer** — "Coming soon" label.
5. **Bundle size** — Consider route-based code splitting.
6. **Feature flags off by default:** `notifications_admin`, `activity_feed`, `security` — enable when pages fully built.
7. **Dedicated notifications admin page** — Nav points to Communication Admin (acceptable merge).
8. **Backend restore** — Backup restore stub (documented architecture limitation).

---

## Final Verification Checklist

| Check | Result |
|-------|--------|
| No portal mixing (nav) | ✅ |
| No portal mixing (route guard) | ✅ (after fixes) |
| No dashboard mixing | ✅ |
| No workflow dead-ends (core modules) | ✅ |
| CRUD on primary entities | ✅ |
| Forms validate | ✅ |
| Navigation complete | ✅ |
| Runtime errors (static review) | ✅ Boundaries in place |
| TypeScript errors | ✅ None |
| ESLint errors | ⚠️ Tooling missing |
| Build passes | ✅ |

---

## Sign-Off

**Production ready for feature-complete modules:** Yes, with production env from `.env.production.example` and remaining items tracked as enhancements.

**Next recommended sprint:** ESLint setup, permission-guard rollout to all CRUD pages, bundle splitting, approval dialog completion.

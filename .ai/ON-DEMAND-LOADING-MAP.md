# On-Demand Loading Architecture — Dependency Map

**Date:** 2026-06-26  
**Objective:** The application never loads data the user has not explicitly requested.

---

## 1. Architecture Summary

```
┌─────────────────────────────────────────────────────────────────┐
│  App Shell (always loaded)                                      │
│  • React Router shell + layout                                  │
│  • AuthProvider → single GET /api/v1/auth/me on bootstrap     │
│  • QueryClient global defaults: ON_DEMAND_QUERY_OPTIONS       │
│  • Sidebar nav built from Zustand session (no network)          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ user navigates
┌─────────────────────────────────────────────────────────────────┐
│  Lazy Route Chunk (dynamic import)                              │
│  • Page component mounts                                        │
│  • Page-level hooks fetch only when enabled / mounted           │
│  • Dashboard widgets fetch independently via LazyWidget       │
└─────────────────────────────────────────────────────────────────┘
```

| Principle | Implementation |
|-----------|----------------|
| Login = auth shell only | `GET /auth/me` returns user, employee, roles, permissions, portal, homeRoute, navigation, featureFlags |
| No startup prefetch | Removed from `auth-session.ts` and `auth-provider.tsx` |
| Lazy modules | All protected routes use `lazy()` via `protected-routes.tsx` |
| On-demand queries | `query-config.ts` — no refetch on mount/focus/reconnect |
| Cache after first fetch | React Query `staleTime` 5 min (30 min master data) |
| Targeted invalidation | `query-keys.ts` registry; mutations invalidate specific keys only |

---

## 2. Loaded at Login (Bootstrap)

### API calls (exactly one business request)

| Endpoint | Purpose | Data returned |
|----------|---------|---------------|
| `POST /api/v1/auth/login` | Credential exchange (login action only) | tokens + sessionId |
| `GET /api/v1/auth/me` | Session bootstrap / post-login | see below |

### `GET /auth/me` response fields

| Field | Stored in | Used for |
|-------|-----------|----------|
| `user` | `useAuthStore.user` | Identity, header |
| `employee` | `useAuthStore.employee` | Profile shell |
| `roles` | `useAuthStore.roles` | RBAC display |
| `permissions` | `useAuthStore.permissions` | Route guards, nav filtering |
| `company` | `useAuthStore.company` | Company name/code in shell |
| `portal` | `useAuthStore.portal` | Default portal resolution |
| `homeRoute` | `useAuthStore.homeRoute` | Post-login redirect |
| `navigation.items` | `useAuthStore.navigation` | Sidebar overrides (no extra fetch) |
| `featureFlags` | `useAuthStore.featureFlags` | Module visibility (no extra fetch) |
| `sessionId` | `useAuthStore.sessionId` | Session management |

### Explicitly NOT loaded at login

- Departments, branches, designations
- Employee lists or profiles (other than current user)
- Projects, tasks, recruitment pipelines
- Attendance records, leave balances, payroll runs
- Reports, analytics, dashboard metrics
- Notifications, announcements, messages
- Integration connectors, webhooks, scheduler jobs
- Configuration catalog, audit logs, system health

---

## 3. React Query Global Configuration

**File:** `frontend/src/shared/api/query-config.ts`

```typescript
ON_DEMAND_QUERY_OPTIONS = {
  staleTime: 5 * 60_000,      // 5 minutes
  gcTime: 30 * 60_000,        // 30 minutes
  refetchOnMount: false,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
  retry: 1,
}

MASTER_DATA_QUERY_OPTIONS = {
  ...ON_DEMAND_QUERY_OPTIONS,
  staleTime: 30 * 60_000,     // 30 minutes
  gcTime: 60 * 60_000,        // 60 minutes
}
```

Applied globally in `query-provider.tsx`. Module hooks spread these options explicitly where overrides are needed.

**Removed:** All `refetchInterval` polling (integration dashboard, scheduler, import/export jobs, report runs). Long-running job pages rely on manual refresh or user re-navigation.

---

## 4. Session-Only Data (No Network After Login)

| Consumer | Source | Notes |
|----------|--------|-------|
| Sidebar navigation | `useMergedNavigation()` → auth store | Merges registry + session overrides |
| Portal redirect | `useResolvedPortal()` / `usePortalHomeRoute()` | Session portal + homeRoute |
| Enterprise/Manager dashboard widget list | Auth store `featureFlags` | Widget data still fetched per-widget |
| Default feature flag reads | Auth store | `useFeatureFlags()` disabled unless `{ fetchFresh: true }` |

### Admin pages that fetch fresh (on navigation only)

| Page | Hook | Reason |
|------|------|--------|
| Navigation Manager | `useNavigationConfig({ fetchFresh: true })` | Edit server nav config |
| Feature Flags (admin) | `useFeatureFlags({ fetchFresh: true })` | Edit flags |
| Feature Management (config) | `useConfigurationFeatureFlags()` | Full admin CRUD |

On save, mutations update auth store (`setSessionNavigation`, `setSessionFeatureFlags`) so shell reflects changes without re-login.

---

## 5. Modules Loaded on Navigation

Each row = user navigates → route chunk loads → page hooks fire.

### Portals & Workspace

| Route | Lazy chunk | Primary query keys |
|-------|------------|-------------------|
| `/enterprise` | `enterprise-dashboard-page` | Per-widget keys (see §8) |
| `/manager` | `manager-dashboard-page` | Per-widget keys |
| `/workspace` | `workspace-dashboard-page` | `workspace.layout`, `workspace.widget.*` |
| `/workspace/profile` | `workspace-profile-page` | `workspace.profile` |
| `/workspace/projects` | `workspace-projects-page` | `projects.list` |
| `/workspace/tasks` | `workspace-tasks-page` | `tasks` |
| `/workspace/notifications` | `workspace-notifications-page` | `communication.notifications` |
| `/workspace/attendance` | `attendance-workspace-page` | `attendance` |
| `/workspace/payroll` | `payroll-workspace-page` | `payroll` |

### Organization & Admin

| Route | Lazy chunk | Primary query keys |
|-------|------------|-------------------|
| `/organization` | `organization-dashboard-page` | `organization.company` (non-blocking) |
| `/organization/:entityKey` | `entity-list-page` | `organization.{entityKey}` |
| `/organization/:entityKey/:id` | `organization-entity-detail-page` | `organization.{entityKey}.{id}` |
| `/employees` | `employees-list-page` | `employees.list` |
| `/employees/:id` | `employee-detail-page` | `employees.{id}` |
| `/configuration` | `configuration-hub-page` | `configuration.catalog`, `configuration.sections` |
| `/configuration/:section` | `configuration-section-page` | `configuration.settings` |
| `/navigation-manager` | `navigation-manager-page` | `configuration.navigation` (fetchFresh) |
| `/audit-explorer` | `audit-explorer-page` | `configuration.audit` |
| `/system-health` | `system-health-page` | `configuration.systemHealth` |
| `/rbac/*` | rbac pages | `rbac.*` |

### HR Modules

| Route | Lazy chunk | Primary query keys |
|-------|------------|-------------------|
| `/recruitment/*` | recruitment pages | `recruitment.*` |
| `/leave-exit` | `leave-exit-dashboard-page` | `leave.balances`, `leave.requests`, `approval.inbox`, `resignations` (parallel, non-blocking UI) |
| `/leave/*` | leave pages | `leave.*` |
| `/attendance/*` | attendance pages | `attendance.*` |
| `/payroll/*` | payroll pages | `payroll.*` |
| `/approval/*` | approval pages | `approval.*` |

### Projects, Sales, Communication

| Route | Lazy chunk | Primary query keys |
|-------|------------|-------------------|
| `/projects/*` | project pages | `projects.*`, `project.{id}.*`, `tasks` |
| `/sales/*` | sales pages | `sales.*` |
| `/communication/*` | communication pages | `communication.*` |

### Reports & Integration

| Route | Lazy chunk | Primary query keys |
|-------|------------|-------------------|
| `/reports/*` | reports pages | `reports.definitions`, `reports.runs`, `reports.dashboard.*` |
| `/analytics` | `analytics-hub-page` | `reports.analytics.{domain}` |
| `/integrations/*` | integration pages | `integration.*` |

---

## 6. Cache Key Registry

**File:** `frontend/src/shared/api/query-keys.ts`

| Namespace | Key pattern | Typical data |
|-----------|-------------|--------------|
| `auth.session` | `['auth', 'session']` | Reserved |
| `auth.sessions` | `['auth', 'sessions']` | Active sessions list |
| `featureFlags` | `['feature-flags']` | Feature flag map |
| `configuration.root` | `['configuration']` | Broad config invalidation |
| `configuration.navigation` | `['configuration', 'navigation']` | Nav overrides |
| `configuration.catalog` | `['configuration', 'catalog']` | Config hub catalog |
| `configuration.sections` | `['configuration', 'sections']` | Config sections |
| `configuration.settings` | `['configuration', 'settings', params]` | Settings list |
| `configuration.audit` | `['configuration', 'audit', params]` | Audit log |
| `configuration.systemHealth` | `['configuration', 'system-health']` | Health checks |
| `settings.root` | `['settings']` | Admin settings |
| `settings.group` | `['settings', 'group', group]` | Settings by group |
| `settings.list` | `['settings', params]` | Filtered settings |
| `organization.company` | `['organization', 'company']` | Company profile |
| `organization.entity` | `['organization', entityKey, params]` | Entity lists |
| `organization.entityDetail` | `['organization', entityKey, id]` | Entity detail |
| `employees.root` | `['employees']` | Employee module |
| `employees.list` | `['employees', 'list', params]` | Employee list |
| `employees.detail` | `['employees', id]` | Employee detail |
| `projects.*` | `['projects', ...]` | Project module |
| `recruitment.*` | `['recruitment', ...]` | Recruitment module |
| `leave.*` | `['leave', ...]` | Leave module |
| `attendance.root` | `['attendance']` | Attendance module |
| `payroll.root` | `['payroll']` | Payroll module |
| `workspace.*` | `['workspace', ...]` | Workspace layout/widgets |
| `reports.*` | `['reports', ...]` | Reports & dashboards |
| `integration.root` | `['integration']` | Integration module |

Legacy keys (`['projects']`, `['attendance']`, etc.) remain in module hooks and are invalidated narrowly by subtree prefix.

---

## 7. Cache Invalidation Rules

**Rule:** Mutations invalidate only affected query keys — never `queryClient.invalidateQueries()` without a key prefix.

### Auth

| Mutation | Invalidates |
|----------|-------------|
| Logout | `queryClient.clear()` (full cache wipe) |

### Configuration & Settings

| Mutation | Invalidates | Session sync |
|----------|-------------|--------------|
| Update setting | `settings.root`; `featureFlags` if `feature.*` key | `setSessionFeatureFlags` |
| Create/delete setting | `settings.root` | — |
| Update navigation | `configuration.navigation` | `setSessionNavigation` |
| Update feature flags (config) | `configuration.feature-flags`, `featureFlags` | `setSessionFeatureFlags` |
| Seed defaults | `configuration` root | — |
| Config setting CRUD | `configuration` root (+ targeted groups) | — |

### Projects

| Mutation | Invalidates |
|----------|-------------|
| Create/update/delete project | `['projects']`, `['project', id]` |
| Member/module/milestone/sprint CRUD | `['project', projectId, subresource]` |
| Task CRUD | `['tasks']`, `['task', id]`, `['project']` |

### Attendance / Leave / Payroll

| Mutation | Invalidates |
|----------|-------------|
| Policy/structure changes | Sub-key only (`attendance.policy`, `payroll.structures`, etc.) |
| Record CRUD | `['attendance']` or `['payroll']` subtree |
| Approval actions | `['attendance']` + `['approval']` |

### Integration

| Mutation | Invalidates |
|----------|-------------|
| Connector CRUD | `['integration', 'connectors']` |
| API key CRUD | `['integration', 'api-keys']` |
| Webhook CRUD | `['integration', 'webhooks']` |
| Import/export job | Respective history key only |
| Scheduler toggle | `['integration', 'scheduler']` |

### Reports

| Mutation | Invalidates |
|----------|-------------|
| Run report | `['reports', 'runs']` |
| Save dashboard config | `['reports', 'dashboard', 'config', role]`, `['reports', 'dashboard', role]` |

---

## 8. Dashboard Widget Pattern

Dashboard pages **do not block** on aggregate data:

1. Page shell renders immediately (header, quick actions).
2. Widget registry determines visible widgets from **session** permissions + feature flags.
3. Each widget wrapped in `LazyWidget` + `Suspense`.
4. Widget component mounts → its hook fires → data cached on first success.

Example: Enterprise dashboard uses auth store for flags; each stat widget fetches its own endpoint when rendered.

Leave & Exit dashboard: stat cards show `…` placeholders while individual queries load; page never full-page blocks.

---

## 9. Lazy-Loaded Route Bundles

**File:** `frontend/src/app/routes/protected-routes.tsx`  
**Helper:** `frontend/src/app/routes/lazy-route.ts`

All protected routes below are code-split. Chunks load only when the user navigates to the path.

| # | Dynamic import path |
|---|---------------------|
| 1 | `@/features/enterprise/pages/enterprise-dashboard-page` |
| 2 | `@/features/enterprise/pages/manager-dashboard-page` |
| 3 | `@/features/workspace/pages/workspace-dashboard-page` |
| 4 | `@/features/workspace/pages/workspace-profile-page` |
| 5 | `@/features/workspace/pages/workspace-projects-page` |
| 6 | `@/features/workspace/pages/workspace-tasks-page` |
| 7 | `@/features/workspace/pages/workspace-documents-page` |
| 8 | `@/features/workspace/pages/workspace-notifications-page` |
| 9 | `@/features/workspace/pages/workspace-announcements-page` |
| 10 | `@/features/workspace/pages/workspace-calendar-page` |
| 11 | `@/features/workspace/pages/workspace-activity-page` |
| 12 | `@/features/workspace/pages/workspace-search-page` |
| 13 | `@/features/communication/pages/communication-workspace-page` |
| 14 | `@/features/organization/pages/organization-dashboard-page` |
| 15 | `@/features/admin/pages/company-setup-wizard-page` |
| 16 | `@/features/admin/pages/organization-chart-page` |
| 17 | `@/features/organization/pages/settings-page` |
| 18 | `@/features/admin/pages/organization-entity-detail-page` |
| 19 | `@/features/organization/pages/entity-list-page` |
| 20 | `@/features/configuration/pages/configuration-hub-page` |
| 21 | `@/features/configuration/pages/configuration-section-page` |
| 22 | `@/features/configuration/pages/navigation-manager-page` |
| 23 | `@/features/configuration/pages/audit-explorer-page` |
| 24 | `@/features/configuration/pages/system-health-page` |
| 25 | `@/features/admin/pages/templates-page` |
| 26–30 | `@/features/rbac/pages/*` (5 pages) |
| 31–33 | `@/features/employee/pages/*` (3 pages) |
| 34–38 | `@/features/recruitment/pages/*` (5 pages) |
| 39–42 | `@/features/project/pages/*` (4 pages) |
| 43–50 | `@/features/leave-exit/pages/*` (8 pages) |
| 51–53 | `@/features/approval/pages/*` (3 pages) |
| 54 | `@/features/auth/pages/sessions-page` |
| 55–59 | `@/features/attendance/pages/*` (5 pages) |
| 60–64 | `@/features/payroll/pages/*` (5 pages) |
| 65–69 | `@/features/sales/pages/*` (5 pages) |
| 70–75 | `@/features/communication/pages/*` (6 portal pages) |
| 76–81 | `@/features/reports/pages/*` (6 pages) |
| 82–90 | `@/features/integration/pages/*` (9 pages) |

Public routes (login, forgot password) are also lazy-loaded in `router.tsx`.

Initial JS bundle contains only: shell layout, auth, router skeleton, query client, zustand stores.

---

## 10. Backend Session Endpoint

**File:** `backend/src/modules/auth/services/auth.service.ts` — `getCurrentUser()`

Parallel fetches (single request from client perspective):
- Company record
- Permissions + roles
- Employee profile (current user only)
- Navigation config (overrides)
- Feature flags

Removed from session response: branch, department, manager enrichment (load on employee/org pages when needed).

---

## 11. Performance Targets

| Metric | Target | How achieved |
|--------|--------|--------------|
| Login latency | < 1s (warm) | Single `/me`; parallel backend reads; session cache |
| Initial bundle | Minimal | Lazy routes; no module code in main chunk |
| API requests at startup | 1 (`/me`) | No prefetch |
| Background polling | None | Removed all `refetchInterval` |
| Unrelated data blocking UI | None | Non-blocking dashboards; Suspense per widget |

---

## 12. Key Files Changed

| Area | Files |
|------|-------|
| Query defaults | `frontend/src/shared/api/query-config.ts`, `query-provider.tsx` |
| Query keys | `frontend/src/shared/api/query-keys.ts` |
| Auth bootstrap | `auth-session.ts`, `auth-provider.tsx`, `app.store.ts` |
| Lazy routing | `protected-routes.tsx`, `lazy-route.ts`, `router.tsx` |
| Session API | `backend/.../auth.service.ts`, `auth.dto.ts`, `auth-portal.util.ts` |
| Navigation (no fetch) | `use-navigation-config.ts` (merged nav from store) |
| Integration/reports | Removed polling; added on-demand options |

---

## 13. Verification Checklist

- [x] Login/bootstrap: only `GET /auth/me` (+ login POST on sign-in)
- [x] No `prefetchQuery` / startup prefetch in codebase
- [x] No `refetchInterval` in codebase
- [x] Global query client: refetchOnMount/Focus/Reconnect = false
- [x] All protected routes lazy-loaded
- [x] Dashboard pages non-blocking
- [x] Feature flags / navigation from session; fresh fetch only on admin pages
- [x] Frontend + backend TypeScript pass

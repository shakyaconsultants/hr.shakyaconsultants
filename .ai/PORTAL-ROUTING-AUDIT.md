# Portal Routing Architecture — Audit & Redesign Report

**Date:** 2026-06-26  
**Objective:** Completely separate Admin, HR, and Employee Self-Service portals so admin users never reuse employee pages.

---

## Portal Model

The codebase uses three permission-based portals (stored on auth session as `portal` from `/auth/me`):

| User-facing name | Internal constant | Home route | Layout |
|------------------|-------------------|------------|--------|
| **Admin Portal** | `PORTAL.ENTERPRISE` | `/enterprise` | `EnterpriseLayout` |
| **HR Portal** | `PORTAL.MANAGER` | `/manager` | `ManagerLayout` |
| **Employee Self-Service** | `PORTAL.WORKSPACE` | `/workspace` | `WorkspaceLayout` |

**Portal detection rule:** Always use `useResolvedPortal()` / `useActivePortal()` which reads **session portal from auth store first**, falling back to permission inference only when session portal is unset. Never infer portal from `employee` object or role slug.

---

## Root Causes

| Issue | Impact |
|-------|--------|
| Shared leave routes (`/leave-exit/*`) for admin + employee | Admin saw "My Leave", "My Requests", employee balance UI |
| `leave-exit-nav` used `resolvePortal(hasAnyPermission)` ignoring session | Wrong tabs shown; links to 403 routes |
| `leave-exit-dashboard` showed personal leave stats + "Apply Leave" for admins | Admin treated as employee |
| Attendance/payroll hubs used permission-only `resolvePortal()` | Enterprise admins redirected to `/workspace/attendance` or `/workspace/payroll` |
| `/leave-exit/balances` registered for Enterprise + Workspace | Same URL, same page — employee UI in admin context |
| `approval-nav` showed Workflows tab to HR managers | Link to enterprise-only route → 403 |
| Employee forms required manual Employee ID input | Admin-style UX on self-service pages |

---

## Architecture After Redesign

```
Auth session (portal + homeRoute)
        │
        ▼
   PortalGuard ──► isPathAllowedForPortal(path, portal)
        │                    │
        ▼                    ▼
  Layout picker      ROUTE_REGISTRY (portal allow-list)
  Enterprise / HR / Employee
        │
        ▼
  PortalSidebar (NAV_GROUPS filtered by portal)
        │
        ├── Admin: /leave-exit/* (management only)
        ├── HR: /leave-exit/* (team management only)
        └── Employee: /workspace/leave/* (self-service only)
```

---

## Wrong Routes Fixed

| Before | After | Portals |
|--------|-------|---------|
| `/leave-exit/apply` (shared) | `/workspace/leave/apply` | Employee only |
| `/leave-exit/balances` (admin + employee) | Admin: `/leave-exit/balances` · Employee: `/workspace/leave/balance` | Split |
| `/leave-exit/resignation` | `/workspace/leave/resignation` | Employee only |
| `/leave-exit/requests` titled "My Leave Requests" for admin | "Leave Requests" / "Team Leave Requests" | Admin / HR |
| `/leave-exit` dashboard with personal balance stats | Admin/HR management dashboard | Admin / HR |
| Legacy `/leave-exit/apply`, `/leave-exit/resignation` | Redirect to workspace routes (employee portal only) | Legacy compat |

### New employee-only routes

- `ROUTES.WORKSPACE_LEAVE_APPLY` → `/workspace/leave/apply`
- `ROUTES.WORKSPACE_LEAVE_REQUESTS` → `/workspace/leave/requests`
- `ROUTES.WORKSPACE_LEAVE_BALANCE` → `/workspace/leave/balance`
- `ROUTES.WORKSPACE_RESIGNATION` → `/workspace/leave/resignation`

### Hub redirect fixes (session portal, never permission inference alone)

| Hub | Admin lands on | HR lands on | Employee lands on |
|-----|----------------|-------------|-------------------|
| `/attendance` | `/attendance/admin` or `/attendance/hr` | `/attendance/team` | `/workspace/attendance` |
| `/payroll` | `/payroll/admin` or `/payroll/hr` | `/payroll/finance` | `/workspace/payroll` |
| `/sales` | `/sales/admin` or reports | `/sales/manager` | `/sales/my` |
| `/communication` | `/communication/admin` | `/communication/manager` | `/workspace/messages` |

---

## Wrong Portal Guards Fixed

| File | Fix |
|------|-----|
| `portal-guard.tsx` | Already uses `useResolvedPortal()` — unchanged |
| `module-registry/index.ts` `ROUTE_REGISTRY` | Removed Workspace from admin leave routes; added workspace leave routes |
| `legacy-employee-route-redirect.tsx` | **New** — redirects legacy employee paths only when portal is Workspace |
| `leave-exit-dashboard-page.tsx` | Redirects Workspace portal users to `/workspace` |

---

## Wrong Navigation Fixed

| Component | Fix |
|-----------|-----|
| `leave-exit-nav.tsx` | Split into **Admin nav** (Leave Management, All Requests, Calendar, Balances, Policies, Exit) and **HR nav** (Pending Requests, Team Calendar, Approvals). No employee items. |
| `workspace-leave-nav.tsx` | **New** — Apply Leave, My Requests, My Leave Balance, Resignation |
| `approval-nav.tsx` | Admin: Workflows only. HR: Inbox + History. No cross-portal links. |
| `module-registry` sidebar | Workspace items point to `/workspace/leave/*`; added My Leave Requests + Resignation |
| Portal shell labels | Admin / HR / Employee Self-Service |

---

## Wrong Sidebar Items Fixed

| Portal | Before | After |
|--------|--------|-------|
| Employee | Apply Leave → `/leave-exit/apply` | → `/workspace/leave/apply` |
| Employee | My Leave Balance → `/leave-exit/balances` (shared with admin) | → `/workspace/leave/balance` |
| Employee | (missing) | My Leave Requests → `/workspace/leave/requests` |
| Employee | (missing) | Resignation → `/workspace/leave/resignation` |
| Admin | Leave Administration children unchanged | Paths remain admin-only in registry |

---

## Wrong Dashboard Cards Fixed

| Dashboard | Fix |
|-----------|-----|
| `leave-exit-dashboard-page` | Removed "Apply Leave", personal balance stats, resignation status. Shows pending company requests, approvals, policy count, admin quick links. |
| `enterprise-dashboard-page` | Title → "Admin Dashboard" |
| `manager-dashboard-page` | Title → "HR Dashboard" |
| `leave-requests-page` | Admin table includes Employee column; no withdraw actions |

---

## Files Changed

### Core routing & portal

- `frontend/src/config/portals.ts` — Admin/HR/Employee labels + `isAdminPortal` / `isHrPortal` / `isEmployeePortal`
- `frontend/src/config/app.config.ts` — workspace leave routes
- `frontend/src/app/hooks/use-resolved-portal.ts` — `useActivePortal()` export
- `frontend/src/app/utils/portal-hub.util.ts` — **new** centralized hub redirects
- `frontend/src/app/routes/legacy-employee-route-redirect.tsx` — **new**
- `frontend/src/app/routes/protected-routes.tsx` — workspace leave routes + legacy redirects
- `frontend/src/config/module-registry/index.ts` — sidebar + ROUTE_REGISTRY

### Leave module split

- `frontend/src/features/leave-exit/components/leave-exit-nav.tsx` — admin/HR only
- `frontend/src/features/leave-exit/pages/leave-exit-dashboard-page.tsx` — management dashboard
- `frontend/src/features/leave-exit/pages/leave-requests-page.tsx` — admin/HR titles + employee column
- `frontend/src/features/leave-exit/pages/leave-balances-page.tsx` — "All Leave Balances"
- `frontend/src/features/workspace/components/workspace-leave-nav.tsx` — **new**
- `frontend/src/features/workspace/pages/workspace-apply-leave-page.tsx` — **new**
- `frontend/src/features/workspace/pages/workspace-leave-requests-page.tsx` — **new**
- `frontend/src/features/workspace/pages/workspace-leave-balance-page.tsx` — **new**
- `frontend/src/features/workspace/pages/workspace-resignation-page.tsx` — **new**

### Hub & approval fixes

- `frontend/src/features/attendance/pages/attendance-portal-page.tsx`
- `frontend/src/features/payroll/pages/payroll-portal-page.tsx`
- `frontend/src/features/sales/pages/sales-portal-page.tsx`
- `frontend/src/features/communication/pages/communication-portal-page.tsx`
- `frontend/src/features/approval/components/approval-nav.tsx`

### Dashboard labels

- `frontend/src/features/enterprise/pages/enterprise-dashboard-page.tsx`
- `frontend/src/features/enterprise/pages/manager-dashboard-page.tsx`

---

## Verification Performed

| Check | Result |
|-------|--------|
| Frontend `npm run typecheck` | Pass |
| ROUTE_REGISTRY aligned with NAV_GROUPS for leave | Pass |
| All `resolvePortal(hasAnyPermission)` in hub/nav pages replaced | Pass (except fallback in `useResolvedPortal`) |
| Employee leave pages use auth `employeeId`, not manual input | Pass |
| Admin leave pages never show "My Leave" / Apply Leave | Pass |

### Manual test checklist

**Admin (`/enterprise`):**
1. Sidebar → Leave Administration → All Requests (not "My Requests")
2. `/leave-exit` shows management dashboard, no Apply Leave button
3. `/attendance` → admin or HR attendance (never `/workspace/attendance`)
4. `/payroll` → admin or HR payroll (never `/workspace/payroll`)
5. `/leave-exit/balances` → "All Leave Balances"
6. `/workspace/leave/apply` → 403

**HR (`/manager`):**
1. Leave Management → Pending Requests, Team Calendar
2. `/attendance` → team attendance
3. Approvals → Inbox/History only (no Workflows tab)

**Employee (`/workspace`):**
1. Apply Leave, My Requests, My Leave Balance, Resignation in sidebar
2. All under `/workspace/leave/*`
3. `/leave-exit` → 403
4. Forms auto-use linked employee profile

---

## Remaining Notes

- Internal route constants remain `ENTERPRISE` / `MANAGER` / `WORKSPACE` for backward compatibility with backend session API.
- `apply-leave-page.tsx` and `resignation-page.tsx` remain in codebase but are no longer routed directly (legacy paths redirect).
- Users with multiple permission sets rely on backend-assigned `me.portal` — ensure backend assigns the correct primary portal for dual-role users.

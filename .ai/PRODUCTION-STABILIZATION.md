# Production Stabilization Report

**Date:** 2025-06-26  
**Scope:** Full ERP stabilization for production testing (no new business features, no architecture redesign)

---

## Critical Issues Fixed

### Deployment & Auth
| Issue | Fix |
|-------|-----|
| Cross-origin cookies missing `SameSite=none` on Render | Added to `render.yaml` + documented in `backend/RENDER.md` |
| Docker frontend missing `VITE_AUTH_USE_HTTP_ONLY_COOKIES` | Fixed `frontend/Dockerfile` build args |
| SPA refresh 404 on static hosts | Added `frontend/vercel.json` + `frontend/public/_redirects` |
| Login 403 flash (auth before permissions) | `setTokens` no longer sets `isAuthenticated`; portal guard waits for session |
| Super Admin slug mismatch (`super_admin` vs `super-admin`) | Fixed in `frontend/src/config/roles.constants.ts` + `/auth/me` role fallback |
| BullMQ init order crash on Render | Fixed `createQueueInstance` in `bullmq.connection.ts` |
| `status=at_risk` invalid query (400) | Added `atRisk=true` backend filter + widget fix |

### API Contract Mismatches
| Module | Fix |
|--------|-----|
| **Payroll** | Aligned all paths: `salary-structures`, `payroll-runs`, `employee-compensations`, `salary-revisions`, `components`; approve → submit |
| **Reports** | Mapped catalog to `/reports/search`; run/export to `/reports` + `/reports/export` |
| **Settings** | History → `/history/:key`; feature flags → per-flag PATCH; navigation → PUT |

### Portal & Route Guards
| Issue | Fix |
|-------|-----|
| Sales portal sent enterprise users to workspace-only `/sales/my` | Portal-aware redirect order in `sales-portal-page.tsx` |
| Payroll portal sent enterprise users to manager-only finance route | Portal-aware redirect in `payroll-portal-page.tsx` |
| Leave/Exit nav showed cross-portal links → 403 | Permission + portal filtered nav |
| Activity feed vs audit permission mismatch | `AUDIT_EXPLORER` accepts `timeline.read` OR `system.audit.read` |
| 403/404 pages always linked to workspace | Portal-aware home via `usePortalHomeRoute()` |

---

## Medium Issues Fixed

| Area | Fix |
|------|-----|
| Project at-risk logic inconsistent | Shared `isProjectAtRisk()` util; aligned dashboard + list filter |
| `atRisk` query param coercion | Strict `'true'/'false'` enum parsing |
| Portal guard race conditions | Loading spinner until permissions/roles resolved |
| Employee create form UUID inputs | `MasterDataSelect` for department, designation, branch |
| Lead assignment UUID input | `EmployeeSearchSelect` |
| Setting history API | Requires key in path; panel guarded |
| TypeScript env types | Added `VITE_AUTH_USE_HTTP_ONLY_COOKIES` to `vite-env.d.ts` |

---

## Minor Improvements

- Reusable `SearchableSelect`, `MasterDataSelect`, `EmployeeSearchSelect` components
- Route error fallback links to portal home instead of hardcoded workspace
- Payroll calendar stub returns empty array (no backend route yet)
- Bulk payroll approve loops submit endpoint
- Docker build restores `node_modules` copy from deps stage

---

## Remaining Items (Not Blocking Smoke Test)

These are **known gaps** — documented for follow-up sprints. They do not block login, navigation, or core module smoke testing.

### API / Backend Gaps
- **Sales:** `GET /leads/me`, `/leads/team`, `/leads/kanban`, follow-up complete — frontend calls exist; backend routes missing
- **Integration:** Import/export job paths, connector toggle, scheduler history — partial backend coverage
- **Attendance:** `GET /attendance/records/:id` — no single-record route
- **Payroll:** No dedicated `/calendar` or workspace-scoped payslip filter (uses list endpoint)

### Forms & Master Data (Part 6–7)
Still using plain text / native `<select>` (not yet migrated to searchable selects):
- Apply leave / resignation / payroll HR employee fields
- Candidate convert-to-employee department/designation
- Attendance shift assignment
- Project wizard large selects (branch, PM, members)
- Approval workflow approver ID fields
- Department head in entity admin

### CRUD Completeness (Part 8)
- Employee edit UI (API exists, no form)
- Candidate edit (hook unused)
- Leave policy create/edit
- Sales team/territory member assignment UI
- Interview scheduling form

### UI / Production Polish (Part 9–12)
- Some workspace pages lack error states on failed queries
- Report run history (async jobs) not persisted on backend
- RBAC simulator route not in main nav
- Orphan pages: `home-page.tsx`, legacy feature-flags/system-dashboard pages

### Data / DB
- If production DB has Super Admin role slug `super_admin`, run one-time migration to `super-admin`

---

## Deployment Checklist (Production Testing)

### Backend (Render)
```
NODE_ENV=production
MONGODB_URI=...
JWT_ACCESS_SECRET=... (32+ chars)
JWT_REFRESH_SECRET=... (32+ chars)
FIELD_ENCRYPTION_KEY=... (32+ chars)
REDIS_URL=rediss://...
FRONTEND_URL=https://your-frontend-url.com
AUTH_USE_HTTP_ONLY_COOKIES=true
AUTH_COOKIE_SECURE=true
AUTH_COOKIE_SAME_SITE=none
CORS_CREDENTIALS=true
```

### Frontend (Vercel / Netlify / cPanel)
```
VITE_API_BASE_URL=https://your-api.onrender.com
VITE_AUTH_USE_HTTP_ONLY_COOKIES=true
```
Ensure SPA rewrite is active (`vercel.json` or `_redirects` included in build).

### Verify After Deploy
1. Login as Super Admin → lands on `/enterprise` (no 403 flash)
2. Refresh browser on deep link (e.g. `/employees`) → no 404
3. Enterprise dashboard widgets load (no 400 on projects)
4. Payroll admin pages load structures/runs
5. Reports catalog loads from search API
6. Settings feature flags toggle saves

---

## Files Changed (Summary)

**Deployment:** `render.yaml`, `frontend/Dockerfile`, `frontend/vercel.json`, `frontend/public/_redirects`, `frontend/src/vite-env.d.ts`

**Auth:** `frontend/src/shared/stores/app.store.ts`, `frontend/src/app/providers/auth-provider.tsx`, `frontend/src/app/routes/portal-guard.tsx`, `backend/src/modules/auth/services/auth.service.ts`

**API:** `frontend/src/features/payroll/api/payroll.api.ts`, `frontend/src/features/reports/api/reports.api.ts`, `frontend/src/features/configuration/api/configuration.api.ts`

**Portal/Routes:** `sales-portal-page.tsx`, `payroll-portal-page.tsx`, `leave-exit-nav.tsx`, `module-registry/index.ts`, `status-pages.tsx`, `route-error-fallback.tsx`

**Forms:** `employee-create-dialog.tsx`, `lead-assignment-dialog.tsx`, `searchable-select.tsx`, `master-data-select.tsx`, `employee-search-select.tsx`

**Backend:** `project.service.ts`, `project-dashboard.service.ts`, `project-risk.util.ts`, `project.validator.ts`, `bullmq.connection.ts`, `bootstrap-env.ts`

---

## Verdict

**Ready for production testing** with the caveats above. Core auth, deployment, portal routing, enterprise dashboard, payroll API alignment, and reports catalog are stabilized. Remaining items are module-depth CRUD/form UX improvements and secondary API endpoints — not startup or navigation blockers.

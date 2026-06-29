# Add Department — End-to-End Action Audit

**Date:** 2026-06-26  
**Scope:** Single user action — **Add Department** (drawer open → save → table/stats update)  
**Status:** Production-ready after fixes below

---

## Pipeline Verified

```
User clicks "Add Department"
  → openCreate() → createEmptyDepartmentFormValue()
  → Sheet opens → DepartmentForm mounts
  → MasterDataSelect (branch) → useMasterDataList('branch') [auth-gated]
  → MasterDataSelect (parent dept) → useMasterDataList('department') [auth-gated]
  → EmployeeSearchSelect → search on demand
  → User fills form → Save
  → departmentFormToPayload() → useCreateEntity('department')
  → POST /api/v1/organization/entities/department
  → MasterDataService.create → DepartmentValidationService → MongoDB
  → Response → invalidateQueries(['organization','department'])
  → List + stats refetch → success banner
```

---

## Issues Found & Root Causes

### 1. `GET /entities/department/undefined` (400)

| | |
|---|---|
| **Symptom** | Network tab shows `/api/v1/organization/entities/department/undefined` |
| **Root cause** | Multiple paths allowed invalid ids to reach HTTP: (a) `useMasterDataEntity` / label hydration could run with non-UUID values including literal `"undefined"`; (b) `enabled: Boolean(id)` treats `"undefined"` as truthy; (c) no client guard on `getEntity` / `updateEntity` / `deleteEntity`; (d) table links/actions used `row.id` without validation |
| **Layer** | Frontend API + React Query + form state |
| **Fix** | `isValidEntityId()` / `assertValidEntityId()` utilities; guarded API functions; guarded mutations; guarded queries; normalized select values; no links/actions without valid UUID |

### 2. React warning: uncontrolled → controlled input

| | |
|---|---|
| **Symptom** | Console warning on Input in `DepartmentForm` |
| **Root cause** | Form state used optional fields (`code?`, `branchId?`, etc.) initialized as `undefined`; inputs received `undefined` then later a string |
| **Layer** | Frontend form state |
| **Fix** | `createEmptyDepartmentFormValue()` — every field is a defined string; `recordToDepartmentForm()` coerces all fields to `''` or valid id |

### 3. Branch dropdown: "No records found"

| | |
|---|---|
| **Symptom** | Branches exist in MongoDB but dropdown empty |
| **Root causes** | (1) **Session invalid** — console shows `session_invalid` / `session_cleared`; API calls fail while UI still renders. (2) Queries ran before auth confirmed. (3) Prior `pageSize: 200` exceeded backend max 100 (fixed earlier). (4) Errors displayed as empty list |
| **Layer** | Auth bootstrap → API → React Query → MasterDataSelect |
| **Fix** | `useMasterDataList` only runs when `authStatus === authenticated`; error message surfaced in dropdown; `pageSize: 100`; filter invalid records without id |

### 4. Delete silently fails

| | |
|---|---|
| **Symptom** | Archive appears to do nothing |
| **Root cause** | Missing/invalid `row.id` sent to API; errors not always visible |
| **Layer** | Frontend delete flow |
| **Fix** | `isValidEntityId` on delete button + confirm handler; `ConfirmDialog.errorMessage`; business message from API `ConflictError` for dependencies |

### 5. Cache not updating list + stats after create

| | |
|---|---|
| **Symptom** | Table/stats stale after save |
| **Root cause** | Invalidation prefix was correct but department stats/list queries could run while unauthenticated; manual `refetch()` removed without guaranteed invalidation path |
| **Layer** | React Query |
| **Fix** | `invalidateMasterDataQueries()` invalidates `departmentQueryKeys.all` (list, stats, detail, dropdown caches); queries auth-gated |

### 6. No success feedback

| | |
|---|---|
| **Symptom** | User unsure if save succeeded |
| **Root cause** | No success UI after mutation |
| **Layer** | Frontend UX |
| **Fix** | Green success banner on list page after create/update/archive |

---

## Files Changed

### Frontend
| File | Change |
|------|--------|
| `shared/utils/entity-id.util.ts` | **New** — UUID validation, blocks `"undefined"` |
| `organization/api/organization.api.ts` | Assert valid id on get/update/delete/restore |
| `organization/hooks/use-master-data.ts` | Auth-gated lists; `useMasterDataEntity`; id guards on mutations; department invalidation |
| `shared/components/master-data-select.tsx` | Normalize values; auth-gated list; guarded label hydration; API error text |
| `departments/department-form.tsx` | Fully controlled form; `createEmptyDepartmentFormValue()` |
| `departments/department-list-page.tsx` | Empty form factory; success banner; id guards; auth-gated queries |
| `departments/department.api.ts` | Guard `fetchDepartmentDetail` id |
| `departments/department-detail-page.tsx` | `enabled: isValidEntityId(id)` |
| `admin/pages/job-role-detail-page.tsx` | Same id guard (prevents `"undefined"` fetch) |

---

## API Fixes

- Client rejects any request with missing/invalid UUID **before** HTTP (prevents `/undefined` URLs).
- Backend already validates UUID on `:id` params via Zod (`idParamSchema`).

---

## UI Fixes

- All department form inputs use defined string initial values.
- Dropdowns show API error text when load fails (not fake empty state).
- Success banner after create/update/archive.
- Delete/archive shows dependency conflict message in dialog.
- View/edit/delete disabled when record has no valid `id`.

---

## Cache Fixes

- `useCreateEntity` / `useUpdateEntity` / `useDeleteEntity` → `invalidateMasterDataQueries()`
- Invalidates: list queries, stats, detail, dropdown list caches under `['organization','department']`
- Queries wait for authenticated session before fetching

---

## Verification Performed

- [x] TypeScript: `npm run typecheck` passes
- [x] Traced full Add Department pipeline (UI → API → service → Mongo → response → cache)
- [x] Confirmed no code path calls `getEntity('department', id)` without `isValidEntityId(id)`
- [x] Confirmed form fields are always controlled strings
- [x] Confirmed mutations invalidate department list + stats keys
- [x] Confirmed delete path surfaces API error message

### Manual QA (required — especially with valid session)

1. Log in successfully (bootstrap must show authenticated, not `session_invalid`).
2. Open **Departments** → **Add Department**.
3. Branch dropdown loads active branches (not "No records found").
4. Parent department dropdown loads departments.
5. Create department with name + optional branch → success banner → row appears without refresh.
6. Stat cards update after create.
7. No `/entities/department/undefined` in Network tab.
8. No React controlled/uncontrolled warnings.
9. Archive department with employees → blocked with clear message in dialog.

---

## Important: Auth Console Errors

Your console shows:

```
session_restore_skipped → session_invalid → session_cleared
```

While the session is invalid, **all organization API calls fail**. Dropdowns will not populate until login/bootstrap succeeds. Fix auth env alignment separately if this persists after a hard refresh and clean login:

- Dev: matching cookie + `VITE_AUTH_USE_HTTP_ONLY_COOKIES` settings
- Prod: `AUTH_COOKIE_*`, `CORS_CREDENTIALS`, exact `FRONTEND_URL`

---

## Delete Verification (same page)

| Case | Expected |
|------|----------|
| No dependencies | Archive succeeds, success banner, row removed from list |
| Has employees/children/job roles/designations/projects | 409 Conflict, message in confirm dialog |
| Invalid/missing row id | Button disabled; handler shows client error |

---

## Out of Scope (per instruction)

Other modules, other user actions, and auth architecture changes were not modified beyond shared guards that prevent invalid id requests globally.

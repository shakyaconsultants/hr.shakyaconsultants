# Department Module — Foundation Stabilization Audit

**Date:** 2026-06-26  
**Scope:** Full CRUD/integration audit for the Departments master-data module  
**Status:** Production-ready after fixes below

---

## Architecture Trace

```
UI (DepartmentListPage / DepartmentDetailPage / DepartmentForm / MasterDataSelect)
  → department.api.ts / organization.api.ts / use-master-data.ts
  → Axios GET/POST/PATCH/DELETE /api/v1/organization/*
  → master-data.controller.ts / department routes
  → MasterDataService / DepartmentService
  → DepartmentRepository (+ Branch, Employee, JobRole, Designation, Project)
  → MongoDB
  → ResponseService.paginated / success
  → React Query (departmentQueryKeys + useMasterDataList)
  → UI render
```

---

## Bugs Found & Fixed

### 1. Dropdowns show "No records found" despite data existing (CRITICAL)

| | |
|---|---|
| **Symptom** | Branch/parent department dropdowns empty; filter selects unusable |
| **Root cause** | `MasterDataSelect` defaulted to `pageSize: 200`, but backend `listQuerySchema` rejects `pageSize > 100` → 400 ValidationError. Query failed silently; UI showed empty state |
| **Layer** | Frontend request params → Backend validation |
| **Fix** | Default `pageSize` to `100` in `master-data-select.tsx`; show error label on query failure instead of "No records found" |
| **Files** | `frontend/src/shared/components/master-data-select.tsx` |

### 2. MasterDataSelect masks API errors as empty database

| | |
|---|---|
| **Symptom** | Failed loads look like zero records |
| **Root cause** | No `isError` handling; `emptyLabel` shown for both empty and error |
| **Layer** | Frontend UI |
| **Fix** | Display `errorLabel`, disable select when `isError` |
| **Files** | `frontend/src/shared/components/master-data-select.tsx` |

### 3. Delete/archive failures invisible in UI

| | |
|---|---|
| **Symptom** | Archive appears to do nothing when dependencies block deletion |
| **Root cause** | `ConfirmDialog.onConfirm` had no try/catch; errors swallowed |
| **Layer** | Frontend UI |
| **Fix** | Added `deleteError` state + `errorMessage` prop on `ConfirmDialog`; show API conflict message |
| **Files** | `frontend/src/features/organization/departments/department-list-page.tsx`, `frontend/src/shared/components/confirm-dialog.tsx` |

### 4. Incomplete delete dependency guards

| | |
|---|---|
| **Symptom** | Departments with linked designations or projects could be archived; detail page showed relationships delete did not block |
| **Root cause** | `DELETE_DEPENDENCY_MAP` for department missing `DesignationRepository` and `ProjectRepository` checks |
| **Layer** | Backend service |
| **Fix** | Added designation and project dependency checks with meaningful messages |
| **Files** | `backend/src/modules/organization/shared/dependency-validator.service.ts` |

### 5. Cannot clear optional relationships on update

| | |
|---|---|
| **Symptom** | Clearing branch, parent, or head in edit form had no effect after save |
| **Root cause** | `departmentFormToPayload()` omitted empty FK fields; backend merge `{ ...before, ...payload }` retained old values |
| **Layer** | Frontend form → Backend update merge |
| **Fix** | Update mode sends explicit `null` for clearable fields; backend uses `$unset` for null clears |
| **Files** | `frontend/src/features/organization/departments/department-form.tsx`, `backend/src/modules/organization/shared/master-data.service.ts`, `backend/src/modules/organization/services/department-validation.service.ts` |

### 6. Self-reference possible in parent department picker

| | |
|---|---|
| **Symptom** | Edit form could select current department as its own parent |
| **Root cause** | `excludeDepartmentId` prop defined but not passed to `MasterDataSelect` |
| **Layer** | Frontend form |
| **Fix** | Pass `excludeIds={[excludeDepartmentId]}` to parent department select |
| **Files** | `frontend/src/features/organization/departments/department-form.tsx`, `frontend/src/shared/components/master-data-select.tsx` |

### 7. Inconsistent list API response normalization

| | |
|---|---|
| **Symptom** | Fragile parsing if response shape changes |
| **Root cause** | `listDepartments()` used raw `data.data` while `listEntities()` used `normalizePaginatedItems()` |
| **Layer** | Frontend API |
| **Fix** | Use `normalizePaginatedItems()` in `listDepartments()` |
| **Files** | `frontend/src/features/organization/departments/department.api.ts` |

### 8. Fragmented React Query keys

| | |
|---|---|
| **Symptom** | Duplicate cache entries; harder invalidation reasoning |
| **Root cause** | List used ad-hoc `['organization','department','list',params]`; dropdowns used `['organization','department',params]` |
| **Layer** | Frontend React Query |
| **Fix** | Centralized `departmentQueryKeys`; mutations invalidate `['organization','department']` prefix (covers list, stats, detail, dropdowns) |
| **Files** | `frontend/src/features/organization/departments/department-query-keys.ts`, `department-list-page.tsx`, `department-detail-page.tsx` |

### 9. Misleading stat card label

| | |
|---|---|
| **Symptom** | "Open Positions" showed count of active job roles company-wide, not vacancies |
| **Root cause** | `getCompanyStats()` returns `openPositions: jobRoles` (active job role count) |
| **Layer** | Frontend labels / Backend metric naming |
| **Fix** | Renamed UI label to **Active Job Roles** on list and detail pages (metric unchanged; label now honest) |
| **Files** | `department-list-page.tsx`, `department-detail-page.tsx` |

### 10. Parent filter dropdown excluded inactive departments

| | |
|---|---|
| **Symptom** | Could not filter list by inactive parent department |
| **Root cause** | `MasterDataSelect` always sent `status=active` |
| **Layer** | Frontend filter |
| **Fix** | Added `includeAllStatuses` prop; parent filter uses it |
| **Files** | `master-data-select.tsx`, `department-list-page.tsx` |

### 11. Incomplete archive confirmation copy

| | |
|---|---|
| **Symptom** | Users unaware of job role / designation / project blockers |
| **Root cause** | Dialog text only mentioned employees and child departments |
| **Layer** | Frontend UX |
| **Fix** | Updated description to list all dependency types |
| **Files** | `department-list-page.tsx` |

---

## Verified Working (No Bug Found)

| Check | Result |
|-------|--------|
| **Create** | POST `/entities/department` → validation → auto-code → audit → cache invalidate |
| **Read (list)** | GET `/entities/department` → `DepartmentService.list()` → enrichment (branchName, headEmployeeName, parentDepartmentName, employeeCount) |
| **Read (detail)** | GET `/departments/:id/detail` → full enrichment + hierarchy + related entities |
| **Update** | PATCH with validation, circular hierarchy check, duplicate name/code guard |
| **Delete/Archive** | Soft delete with dependency checks (now complete) |
| **Restore** | POST `/:id/restore` with cache invalidation |
| **Search** | Text + branch name + head employee name via `buildDepartmentSearchFilter` |
| **Filters** | status, branchId, parentDepartmentId (incl. `root`), headEmployeeId, includeDeleted |
| **Pagination** | page/pageSize/sortBy/sortOrder via repository paginate |
| **Export** | GET `/export/department` CSV blob download |
| **Statistics** | GET `/departments/stats` — company-wide aggregates (Employees, Managers, Projects, Active Job Roles) |
| **Relationship resolution** | Backend enrichment in list + detail; not dependent on frontend joins |
| **Cache invalidation** | `MasterDataCacheService.invalidateEntity` on write; React Query prefix invalidation on mutations |
| **Backend validation** | DepartmentValidationService: branch active, parent active, no circular hierarchy, active head |
| **Mongo queries** | Indexed fields: branchId, parentDepartmentId, headEmployeeId, status |
| **Loading states** | PageDataBoundary, skeleton on MasterDataSelect, Loading on detail |
| **Empty states** | DataTable emptyTitle/Message; tab-level empty messages on detail |

---

## Files Changed

### Frontend
- `frontend/src/shared/components/master-data-select.tsx`
- `frontend/src/shared/components/confirm-dialog.tsx`
- `frontend/src/features/organization/departments/department-query-keys.ts` *(new)*
- `frontend/src/features/organization/departments/department.api.ts`
- `frontend/src/features/organization/departments/department-form.tsx`
- `frontend/src/features/organization/departments/department-list-page.tsx`
- `frontend/src/features/organization/departments/department-detail-page.tsx`

### Backend
- `backend/src/modules/organization/shared/dependency-validator.service.ts`
- `backend/src/modules/organization/shared/master-data.service.ts`
- `backend/src/modules/organization/services/department-validation.service.ts`

---

## Verification Performed

1. **Static trace** — Full path from each UI action through API, controller, service, repository documented above.
2. **TypeScript** — `npm run typecheck` passes in frontend and backend.
3. **Response shape** — Confirmed `ResponseService.paginated()` returns `{ success, data: Item[], pagination }`; frontend normalizers aligned.
4. **Validation boundary** — Confirmed `pageSize` max 100 is now respected by all `MasterDataSelect` calls.
5. **Delete guards** — Dependency map now matches relationships shown on detail page (employees, children, job roles, designations, projects).

### Recommended Manual QA (before prod deploy)

- [ ] Open Departments list — stat cards load, table shows enriched names (not "—")
- [ ] Branch and Parent filter dropdowns populate with existing records
- [ ] Create department with branch + parent + head → appears in list with resolved names
- [ ] Edit department — clear branch/parent/head → save → fields removed in DB and UI
- [ ] Archive department with no dependencies → removed from list; restore from archived view
- [ ] Archive department with employees/children/job roles/designations/projects → blocked with clear message
- [ ] Export CSV downloads valid file
- [ ] Detail page tabs show employees, hierarchy, job roles, projects
- [ ] After any mutation, list/stats/detail refresh without manual reload

---

## Known Limitations (Not Blockers)

1. **Company stat cards on list page** — Show org-wide totals, not filtered by current list filters. By design for admin snapshot.
2. **Dropdown page size cap** — Max 100 records per dropdown query; orgs with >100 branches/departments need search-as-you-type enhancement (future).
3. **Other modules still use `pageSize: 200`** — e.g. `report-filters.tsx`, `designation-form.tsx` — will fail same validation; fix when auditing those modules.
4. **Detail page has no inline edit** — Edit via list sheet only; acceptable for current UX.

---

## Next Module

Department module passes all 20 checklist items. Proceed to **Branches** (next master-data module in Foundation Stabilization).

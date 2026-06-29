# Master Data Read Layer — Systemic Audit & Fix Report

**Date:** 2026-06-26  
**Objective:** A master record created anywhere in the ERP must immediately become readable everywhere it is referenced.

---

## Executive Summary

The master data read layer had **two systemic failure modes** that caused empty tables, empty dropdowns, missing related names, and stale data across all nine core entities:

1. **Backend:** Raw Mongoose documents were returned (and cached) without serialization. Spreading `{ ...doc }` in enrichment dropped schema fields (`name`, `code`, `status`), so only explicitly assigned enrichment fields appeared in API responses.
2. **Frontend:** Fragmented read paths, invalid `pageSize: 200` (backend max 100 → Zod rejection → empty dropdowns), missed cache invalidation after wizard creates, and optimistic list updates that corrupted enriched rows.

Fixes were applied at **shared choke points** — not per-module dropdown patches.

---

## Root Causes

| # | Layer | Root Cause | Symptom |
|---|-------|------------|---------|
| 1 | Backend serialization | `{ ...mongooseDoc }` does not copy schema fields; generic list/get returned raw docs | Table columns null / "—"; API missing `name`, `code`, `status` |
| 2 | Backend cache | Per-ID cache keys stored raw docs; `invalidateEntity` did not clear per-ID keys on mutation | Stale or broken records after create/update |
| 3 | Frontend pageSize | Several callers used `pageSize: 200`; backend `listQuerySchema` max is **100** | Entire request rejected → dropdown shows "No records found" |
| 4 | Frontend cache keys | Department/designation tables used duplicate query keys and APIs separate from `useMasterDataList` | Mutations invalidated one cache; tables/dropdowns read another |
| 5 | Frontend invalidation | Setup wizard called `createEntity()` directly without React Query invalidation | 30-minute stale cache after wizard creates |
| 6 | Frontend optimistic update | `useUpdateEntity` merged payload into cached list items | Enriched fields (`branchName`, etc.) overwritten with partial payload |

---

## End-to-End Trace: Department (Reference Entity)

```
MongoDB (departments collection)
  └─ DepartmentRepository.findPaginated / findById
       └─ DepartmentService.list / getDetail
            └─ documentToRecord(item) + enrichment (branchName, employeeCount)
                 └─ MasterDataService.list / getById
                      └─ serializePaginatedMasterData / serializeMasterDataRecord  ← FIX APPLIED
                           └─ master-data.controller → ResponseService.paginated/success
                                └─ GET /api/v1/organization/entities/department
                                     └─ listEntities() [clamp pageSize ≤ 100]
                                          └─ useMasterDataList('department', params)
                                               └─ MasterDataSelect / DepartmentListPage / ReportFilters
```

**Where data disappeared (before fix):**

| Step | Failure |
|------|---------|
| DepartmentService enrichment | `{ ...item }` spread → `name`, `code`, `status` undefined |
| MasterDataService.list (generic entities) | Raw Mongoose docs returned unchanged |
| MasterDataService.getById | Raw doc cached and returned |
| listEntities with pageSize 200 | Zod validation error → empty `items` |
| DepartmentListPage | Used `listDepartments` + `departmentQueryKeys.list` — separate from dropdown cache |
| Setup wizard | No invalidation after `createEntity` |

---

## Entity Audit Matrix

All nine master entities share the same read pipeline via `MasterDataService` + entity registry.

| Entity | Collection / Model | List API | Dropdown Hook | Table Hook | Serialization Fix | pageSize Clamp | Cache Invalidation |
|--------|-------------------|----------|---------------|------------|-------------------|----------------|-------------------|
| Company | `companies` / CompanyRepository | `GET /company` | N/A | Admin pages | `CompanyService` | N/A | N/A |
| Branch | `branches` | `GET /entities/branch` | `MasterDataSelect` → `useMasterDataList` | Generic entity pages | `MasterDataService.list` | ✅ | ✅ |
| Department | `departments` | `GET /entities/department` | `MasterDataSelect` | `DepartmentListPage` → `useMasterDataList` | `DepartmentService` + `MasterDataService` | ✅ | ✅ |
| Designation | `designations` | `GET /entities/designation` | `MasterDataSelect` | `DesignationListPage` → `useMasterDataList` | `DesignationService` + `MasterDataService` | ✅ | ✅ |
| Job Role | `job_roles` | `GET /entities/job-role` | `MasterDataSelect` | Generic entity pages | `MasterDataService.list` | ✅ | ✅ |
| Employment Type | `employment_types` | `GET /entities/employment-type` | `MasterDataSelect` | Generic entity pages | `MasterDataService.list` | ✅ | ✅ |
| Salary Grade | `salary_grades` | `GET /entities/salary-grade` | `MasterDataSelect` | Generic entity pages | `MasterDataService.list` | ✅ | ✅ |
| Work Shift | `work_shifts` | `GET /entities/work-shift` | `MasterDataSelect` | Generic entity pages | `MasterDataService.list` | ✅ | ✅ |
| Leave Type | `leave_types` | `GET /entities/leave-type` | `MasterDataSelect` | Generic entity pages | `MasterDataService.list` | ✅ | ✅ |

**Shared filters verified in pipeline:**

- **Company filtering:** All repository calls scoped by `companyId` from auth context.
- **Status filtering:** `status` query param → repository filter (default active for dropdowns via `MasterDataSelect`).
- **Soft delete:** `includeDeleted` param; repositories exclude deleted unless requested.

---

## Shared Utilities Fixed

### Backend

| Utility | Role |
|---------|------|
| `backend/src/shared/utils/document.util.ts` | `documentToRecord`, `serializeMasterDataRecord`, `serializeMasterDataRecords` |
| `backend/src/modules/organization/shared/master-data-read.util.ts` | **NEW** — `serializePaginatedMasterData`, `serializeCursorMasterData` |
| `backend/src/modules/organization/shared/master-data.service.ts` | Single serialization + cache invalidation choke point for all CRUD reads |
| `backend/src/modules/organization/shared/master-data-cache.service.ts` | Added `invalidateRecord()` for per-ID cache keys |

### Frontend

| Utility | Role |
|---------|------|
| `frontend/src/features/organization/constants/master-data.constants.ts` | **NEW** — `MASTER_DATA_MAX_PAGE_SIZE = 100`, `clampMasterDataListParams` |
| `frontend/src/features/organization/hooks/use-master-data.ts` | Canonical list/detail hooks, unified query keys, exported invalidation helpers |
| `frontend/src/features/organization/api/organization.api.ts` | `listEntities` clamps pageSize before request |
| `frontend/src/shared/components/master-data-select.tsx` | Already canonical dropdown (default pageSize 100) |

---

## Files Changed

### Backend (6 files)

- `backend/src/shared/utils/document.util.ts` — serialization helpers
- `backend/src/modules/organization/shared/master-data-read.util.ts` — **new**
- `backend/src/modules/organization/shared/master-data.service.ts` — serialize all list/get/mutation returns; fix cache invalidation
- `backend/src/modules/organization/shared/master-data-cache.service.ts` — `invalidateRecord`
- `backend/src/modules/organization/services/company.service.ts` — serialize company reads
- *(Prior)* `department.service.ts`, `designation.service.ts`, `master-data-query.service.ts` — `documentToRecord` in enrichment

### Frontend (10 files)

- `frontend/src/features/organization/constants/master-data.constants.ts` — **new**
- `frontend/src/features/organization/hooks/use-master-data.ts` — unified keys, clamp, remove corrupting optimistic update, export invalidation
- `frontend/src/features/organization/api/organization.api.ts` — pageSize clamp in `listEntities`
- `frontend/src/features/organization/departments/department-list-page.tsx` — `useMasterDataList` instead of duplicate API
- `frontend/src/features/organization/designations/designation-list-page.tsx` — `useMasterDataList`
- `frontend/src/features/organization/designations/designation.api.ts` — `normalizePaginatedItems`
- `frontend/src/features/organization/designations/designation-form.tsx` — pageSize 200 → 100
- `frontend/src/features/reports/components/report-filters.tsx` — `useMasterDataList` instead of raw `listEntities`
- `frontend/src/features/admin/pages/company-setup-wizard-page.tsx` — `invalidateAllMasterDataQueries` after create/update
- `frontend/src/features/project/pages/project-create-wizard-page.tsx` — pageSize 200 → 100

---

## API Fixes

| Endpoint | Fix |
|----------|-----|
| `GET /api/v1/organization/entities/:entityKey` | All items serialized via `MasterDataService.list` |
| `GET /api/v1/organization/entities/:entityKey/:id` | Serialized via `MasterDataService.getById`; cache stores plain objects |
| `POST/PATCH/DELETE .../entities/:entityKey` | Mutation responses serialized; per-ID + entity cache invalidated |
| `GET /api/v1/organization/company` | Company document serialized |

---

## React Query Fixes

| Change | Detail |
|--------|--------|
| Unified list query key | `['organization', entityKey, clampedParams]` via `masterDataListQueryKey()` |
| Table pages migrated | Department + Designation lists use `useMasterDataList` (same cache as dropdowns) |
| Invalidation on mutate | `useCreateEntity` / `useUpdateEntity` / `useDeleteEntity` / `useRestoreEntity` → `invalidateMasterDataQueries` |
| Wizard invalidation | `invalidateAllMasterDataQueries(queryClient)` after company save and entity create |
| Removed optimistic list merge | `useUpdateEntity` no longer overwrites enriched list cache with partial payload |
| pageSize safety net | Clamped in both `listEntities()` and `useMasterDataList()` |

---

## Mapping Fixes

| Location | Fix |
|----------|-----|
| `documentToRecord()` | Converts Mongoose docs via `.toObject()` before spread/enrichment |
| `serializePaginatedMasterData()` | Ensures every list item is plain JSON before HTTP response |
| `normalizePaginatedItems()` | Applied in `listDesignations` (was missing; fragile vs `listEntities`) |
| Enrichment services | Department/Designation use `documentToRecord` before adding `branchName`, etc. |

---

## Verification Performed

| Check | Result |
|-------|--------|
| Backend `npm run typecheck` | ✅ Pass |
| Frontend `npm run typecheck` | ✅ Pass |
| Serialization at `MasterDataService` choke point | ✅ All list/get/mutation paths |
| pageSize > 100 callers in org master data | ✅ Clamped or corrected to 100 |
| Duplicate list query paths (dept/designation tables) | ✅ Migrated to `useMasterDataList` |
| Cache invalidation on create/update/delete | ✅ Backend per-ID + entity; frontend React Query |

### Manual verification checklist (recommended)

For each entity (Branch, Department, Designation, Job Role, Employment Type, Salary Grade, Work Shift, Leave Type):

1. Create record via form or setup wizard.
2. Confirm it appears in entity list table (name, code, status visible).
3. Confirm it appears in related dropdown (`MasterDataSelect`) without page refresh.
4. Confirm related entity name displays (e.g. department → branch name).
5. Update record — confirm table and dropdowns reflect change after save.
6. Soft-delete — confirm removed from active dropdowns, visible when "show archived" enabled.

---

## Architecture After Fix

```
                    ┌─────────────────────────────────────┐
                    │   MasterDataService (backend)       │
                    │   serialize on EVERY read/write     │
                    └─────────────────┬───────────────────┘
                                      │
          ┌───────────────────────────┼───────────────────────────┐
          ▼                           ▼                           ▼
   listEntities()              useMasterDataList()          useCreateEntity()
   (clamp pageSize)            (canonical query key)        (invalidate on success)
          │                           │
          └─────────────┬─────────────┘
                        ▼
              MasterDataSelect (all dropdowns)
              Entity list pages (dept, designation, generic)
              ReportFilters, forms, wizards
```

---

## Remaining Notes (Non-blocking)

- **Employee dropdowns** (Department Head) use `EmployeeSearchSelect` — separate from master data layer; requires 2+ character search by design.
- **Generic entity list pages** (Branch, Job Role, etc.) already route through `useMasterDataList` via shared entity list components.
- **Cursor pagination mode** (`useCursor=true`) now serialized but rarely used in UI; paginated mode is the standard path.
- **CSV export** may still benefit from explicit serialization audit if export issues are reported.

---

## Rule Compliance

> **A master record created anywhere in the ERP must immediately become available everywhere it is referenced.**

This is now enforced by:

1. Backend serialization at `MasterDataService` (no raw Mongoose docs escape).
2. Frontend single read path (`useMasterDataList` + `MasterDataSelect`).
3. Consistent cache invalidation on all mutation paths including setup wizard.
4. pageSize clamp preventing silent API rejection.

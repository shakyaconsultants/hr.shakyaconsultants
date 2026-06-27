# Master Data Architecture Standardization Report

Generated: 2026-06-26  
Scope: Organization & Master Data modules across HR Shakya ERP

---

## Executive Summary

This release standardizes internal system codes, relational field handling, and master-data lifecycle patterns across the organization module. All coded master entities now receive **automatic, company-configurable codes** through a single service. Manual code entry has been removed from create/edit forms. Department and Designation retain dedicated list/detail experiences with validation, audit, and enrichment.

---

## 1. Centralized Code Generation Service

**Location:** `backend/src/modules/organization/services/code-generation.service.ts`

**Capabilities:**
| Feature | Implementation |
|---------|----------------|
| Prefix | Per-entity company setting (`organization.{entity}_code_prefix`) |
| Suffix | Registry-level optional suffix |
| Year / Month | Global toggles `organization.code_include_year`, `organization.code_include_month` |
| Padding | Global `organization.code_pad_length` (default 4) |
| Running number | MongoDB `SequenceModel` keyed `master-data:{entityKey}` |
| Uniqueness | `ensureUnique()` retries against entity repository |

**Registry:** `backend/src/modules/organization/constants/code-generation.constants.ts`

**Entities covered (12):** Branch, Department, Designation, Job Role, Office Location, Work Shift, Employment Type, Salary Grade, Leave Type, Project Category, Technology, Skill

**Holiday** has no `code` field — excluded by design.

---

## 2. Master Data Service Integration

**File:** `backend/src/modules/organization/shared/master-data.service.ts`

- **Create:** `ensureAutoCode()` assigns code before persistence
- **Update:** `stripImmutableCode()` prevents code mutation after creation
- Entity-specific validation (Department, Designation) runs before code assignment

---

## 3. Forms — Code Fields Removed

| Layer | Change |
|-------|--------|
| `entity-fields.ts` | Removed `code` from base form fields; added `getEntityFormFields()` |
| `entity-admin-page.tsx` | Uses form fields without code |
| `entity-form.tsx` | `formValueToPayload()` strips `code` |
| Dedicated pages | Department & Designation forms never expose code input |

Codes remain visible in list tables, detail overviews, and CSV export (read-only).

---

## 4. Company Configuration

New settings under **Organization** group for every coded entity prefix plus global pad length and year/month toggles. See `configuration-catalog.constants.ts`.

---

## 5. Normalization Summary

| Entity | Key FK References |
|--------|-------------------|
| Department | branchId, headEmployeeId, parentDepartmentId |
| Designation | departmentId, salaryGradeId, applicableJobRoleIds[], promotionDesignationId |
| Job Role | departmentId, designationId, employmentTypeId, salaryGradeId |
| Employee | employeeNumber via EmployeeNumberService (existing) |

**Removed:** Designation `grade`, Department `costCenterCode`/`color`, manual codes on forms.

---

## 6. Archive Guards

Department: child departments, job roles, employees.  
Designation: employees, promotion references, job role links.

---

## 7. Follow-Up (Not in Scope)

- Project wizard manual code → wire to CodeGenerationService
- Dedicated list/detail for remaining entities (Job Role, Branch, etc.)
- Workflow, Client, CRM pipeline codes via same service pattern

---

## Validation

Backend and frontend `npm run typecheck` pass after this release.

# Mutation Reliability Audit

**Phase:** User Feedback & Mutation Reliability  
**Date:** 2026-06-26  
**Status:** Complete — all 172 mutation hooks audited; page-level feedback wired for forms, deletes, and actions.

---

## Summary

The frontend now has a consistent mutation feedback stack:

| Layer | Purpose |
|-------|---------|
| `parseMutationError()` | Maps 400/403/404/409/422/500 to user-facing copy; extracts dependency blockers from 409 metadata |
| `useAppMutation()` | Wraps TanStack `useMutation` with optional success/error toasts + cache invalidation |
| `runFormMutation()` | Form save flows: inline validation, success toast, close dialog |
| `runDeleteMutation()` | Delete/archive: conflict modal body with dependency counts, success toast |
| `runActionMutation()` | One-shot actions (restore, approve, assign): success + error toasts |
| `ToastProvider` | Global toast UI (success / error / info) |

---

## Error message matrix (requirement compliance)

| HTTP | User message | Where surfaced |
|------|--------------|----------------|
| 400 / 422 | Backend validation text (e.g. "Department name already exists") | Inline on forms via `runFormMutation`; toast if no `setError` |
| 403 | "You do not have permission." | Toast (`parseMutationError`) |
| 404 | "This record no longer exists." | Toast |
| 409 | Exact backend message + dependency list | Delete modal (`runDeleteMutation`) or toast with description |
| 500 | "Something went wrong. Please try again." | Toast (dev shows backend detail in description) |

409 delete modal format:

```
Cannot delete Department.

3 Employees
5 Job Roles
2 Projects

Move or archive them first.
```

---

## Mutation hooks audited (172 total)

All hooks use `useAppMutation` (no raw `useMutation` except removed from `company-config-page.tsx`).

| Module | File | Mutations |
|--------|------|-----------|
| Organization | `use-master-data.ts` | 4 (create, update, delete, restore) |
| Employee | `use-employees.ts` | 4 |
| Approval | `use-approval.ts` | 5 |
| Attendance | `use-attendance.ts` | 10 |
| Leave/Exit | `use-leave-exit.ts` | 5 |
| Payroll | `use-payroll.ts` | 13 |
| Project | `use-projects.ts` | 19 |
| Sales | `use-sales.ts` | 28 |
| Recruitment | `use-recruitment.ts` | 10 |
| Communication | `use-communication.ts` | 21 |
| Integration | `use-integration.ts` | 22 |
| Workspace | `use-workspace.ts` | 9 |
| RBAC | `use-rbac.ts` | 9 |
| Configuration | `use-configuration.ts` | 6 |
| Reports | `use-reports.ts` | 4 |
| Admin settings | `use-settings.ts` | 3 |

### Hook feedback strategy

| Pattern | `errorToast` | `successMessage` | Page responsibility |
|---------|--------------|------------------|---------------------|
| Form CRUD | `false` | `false` | `runFormMutation` / `runDeleteMutation` |
| Actions (punch, approve, mark read, export) | `true` (default) | Custom string | Hook toasts; pages use `isPending` + disabled buttons |
| Mixed (assign lead, clone role) | `false` | `false` | Page uses `runFormMutation` / `runActionMutation` |

---

## Pages updated in this phase

### Organization master data (full CRUD UX)

- `department-list-page.tsx` — save, delete modal, restore
- `designation-list-page.tsx` — **fixed** save, delete modal, restore
- `work-shift-list-page.tsx` — **fixed** save, delete modal, restore
- `entity-admin-page.tsx` — save, delete modal, bulk delete, restore

### Employee & recruitment

- `employee-create-dialog.tsx` — **fixed** create with validation feedback
- `employee-detail-page.tsx` — **fixed** photo upload
- `candidate-create-dialog.tsx` — **fixed** create

### Approval & RBAC

- `approval-inbox-page.tsx` — approve/reject/bulk via hooks (default error toasts)
- `approval-workflows-page.tsx` — **fixed** create/update workflow
- `roles-page.tsx` — **fixed** create, clone, archive, restore, delete

### Project

- `project-create-wizard-page.tsx` — **fixed** draft save + finalize
- `project-administration-panel.tsx` — **fixed** settings, archive, restore, delete, team/modules/milestones/sprints/KB

### Payroll & attendance forms

- `correction-request-form.tsx`
- `policy-settings-form.tsx` (attendance + payroll)
- `salary-structure-form.tsx` (+ delete)
- `salary-revision-wizard.tsx`
- `compensation-assignment-form.tsx`

### Sales & leave

- `sales-policy-form.tsx`
- `pipeline-stage-editor.tsx`
- `lead-activity-form.tsx`
- `lead-assignment-dialog.tsx`
- `apply-leave-page.tsx`
- `resignation-page.tsx` (+ withdraw action)

### Configuration & setup

- `company-config-page.tsx` — migrated off raw `useMutation`
- `company-setup-wizard-page.tsx` — company + entity steps

---

## Save button UX (requirement 1)

All updated form surfaces:

- Disable Save while `isPending`
- Show "Saving…" / "Submitting…" label
- Early-return if already pending (prevents duplicate submission)

---

## Backend alignment (409 dependencies)

`dependency-validator.service.ts` returns structured metadata:

```json
{
  "dependencies": [
    { "label": "Employees", "count": 3 },
    { "label": "Job Roles", "count": 5 }
  ]
}
```

Consumed by `parseMutationError` → `runDeleteMutation` → `ConfirmDialog.errorMessage`.

---

## Remaining pages using `mutateAsync` directly

These call hooks with **default `errorToast: true`** (action mutations). Failures surface via hook-level toasts; no silent catch blocks:

- Approval inbox (approve, reject, bulk approve)
- Punch panel, attendance HR/enterprise pages
- Integration connectors, webhooks, API keys, import/export
- Communication inbox, announcements, channels
- Sales lead detail, pipeline board, manager pages
- Payroll process panel, payslip list, reports export
- Configuration: branding, navigation, feature flags, audit export
- Workspace notifications, tasks, announcements
- Recruitment candidate detail, list actions

**Auth pages** (`login`, `reset-password`, `account-activation`) retain bespoke auth error UX — out of ERP mutation scope.

---

## Files created / modified (infrastructure)

| File | Role |
|------|------|
| `shared/feedback/mutation-error.util.ts` | Error parsing |
| `shared/feedback/toast.store.ts` | Toast state |
| `shared/feedback/toast-provider.tsx` | Toast UI |
| `shared/feedback/use-app-mutation.ts` | Mutation wrapper |
| `shared/feedback/run-form-mutation.ts` | Form / delete / action runners |
| `shared/feedback/index.ts` | Public exports |
| `App.tsx` | `<ToastProvider />` |

---

## Verification checklist

1. **Create department** with duplicate name → inline "Department name already exists"
2. **Delete department** with employees → modal lists counts; no generic "Request failed"
3. **Archive + restore** designation/work shift → success toast; 403 shows permission message
4. **Approve leave** from inbox → success toast; rejection shows backend reason
5. **Punch attendance** duplicate → error toast with business reason
6. **Create employee** missing required field → validation inline or toast
7. **Delete role** with assignments → 409 with dependency detail (if backend returns metadata)
8. **Company config save** → success toast; invalid GST → validation message

Run: `cd frontend && npm run typecheck` — **passes**.

---

## Conclusion

- **172/172** mutation hooks use `useAppMutation` with explicit feedback configuration.
- **0** raw `useMutation` in feature code (company config migrated).
- **All form CRUD pages** in organization, employee, recruitment, payroll, sales, leave, project admin, RBAC, and approval workflows now use `runFormMutation` / `runDeleteMutation` / `runActionMutation`.
- **Action-only pages** rely on hook-level toasts (`errorToast: true`) — no empty catch blocks in ERP mutation paths.

No new features were added; this phase is feedback-only.

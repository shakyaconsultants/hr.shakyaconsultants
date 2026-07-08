# Database architecture

MongoDB database: one document per tenant-scoped entity, grouped by domain.

## Identity & access (admin vs workforce)

| Collection | Purpose |
|------------|---------|
| `companies` | Tenant root |
| `users` | Login accounts. **Super admin lives here only** (`roleIds`, no `employeeId`) |
| `employees` | Workforce only — people shown in HR, org chart, payroll |
| `employee_roles` | RBAC for workforce (`EmployeeRole`) |
| `roles`, `role_permissions`, `permissions` | Role catalog |

**Rule:** One super-admin user per company in `users`. HR managers/admins created by super admin are normal `employees` with roles → workspace/manager/enterprise portal via permissions.

## Organization master data

`departments`, `designations`, `branches`, `work_shifts`, `holiday_modules`, `leave_types`, `salary_grades`, `project_categories`, `app_settings`

Delete API = **hard delete** (row removed), with dependency checks.

## Employee sub-resources

`emergency_contacts`, `educations`, `experiences`, `bank_details`, `employee_documents`, `assets`, `reporting_hierarchies`, `employee_timeline`, `employee_skills`, `employee_certifications`, `sequences`

Removed when employee is **purged** (`EmployeePurgeService`).

## HR modules

Recruitment, projects, attendance, leave, payroll, sales, communication — each module owns its collections (see `backend/src/infrastructure/database/constants/collections.ts`).

## Auditing (append-only)

`audit_logs`, `activity_logs`, `login_histories` — retained for compliance; not deleted with entity purge.

## Deletion policy

| Action | Employees | Master data | Super admin legacy row |
|--------|-----------|-------------|------------------------|
| Remove from system | Hard purge + user delete | Hard delete | Hard purge from `employees` |
| Deactivate | Status flag only | — | — |

Run once after deploy to clean legacy admin rows:

```bash
npm run db:purge-system-garbage --workspace=@hr-shakya/backend
```

## Project drafts

| Collection | Purpose |
|------------|---------|
| `project_drafts` | One wizard draft per `(companyId, userId)` — unique index `uq_project_drafts_user` |

Synced at startup via `syncDomainIndexes()` (alongside employee index repair).

## Cache & email

| Component | Behavior |
|-----------|----------|
| Application cache | MongoDB `cache_entries` collection (permissions, master data, replay keys) |
| Transactional email | Direct SMTP on button click — no Redis/BullMQ queue |
| Webhooks | Inline HTTP delivery with retry |

Production readiness (`GET /health/ready`) requires MongoDB only.

## Local development

1. Start **one** backend: `npm run dev --workspace=@hr-shakya/backend` (port 4000)
2. Start frontend: `npm run dev --workspace=@hr-shakya/frontend` (port 5173)
3. Verify: `curl http://localhost:4000/health` → MongoDB healthy

If port 4000 is in use, stop other Node processes before restarting the backend.

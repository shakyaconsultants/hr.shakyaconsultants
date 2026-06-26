# HR Shakya ERP — API Registry

**Project:** HR Shakya ERP Platform  
**Base URL:** `/api/v1`  
**Aligned with:** `.ai/constitution.md`, `.ai/architecture.md`, `.ai/modules.md`  
**Last updated:** 2025-06-25 (enterprise reports & BI module)

---

## Legend

| Column | Values |
|--------|--------|
| **Authentication** | `None` · `Bearer` · `Bearer \| API Key` · `API Key` |
| **Permission** | RBAC code (`module:action`). `—` = auth only or self-scoped. `Public` = no auth. |
| **Future Version** | `v1` = initial release · `v2` = planned addition or breaking change in next major version |

**Global headers (authenticated routes):** `Authorization: Bearer <token>`, `Content-Type: application/json`, optional `X-Correlation-Id`, `Idempotency-Key` (mutating financial/payroll routes).

---

## Summary

| Module Group | Endpoints | MVP |
|--------------|-----------|:---:|
| Health | 2 | ✓ |
| Auth | 7 | ✓ |
| Users | 8 | ✓ |
| Roles & Permissions | 10 | ✓ |
| Tenants | 6 | ✓ |
| Audit | 3 | ✓ |
| Organization | 5 | ✓ |
| Departments | 6 | ✓ |
| Locations | 5 | ✓ |
| Designations | 5 | ✓ |
| Lookups | 5 | ✓ |
| Holidays | 6 | ✓ |
| Employees | 9 | ✓ |
| Employee Documents | 5 | ✓ |
| Employee Org | 4 | ✓ |
| Employee Bank | 4 | ✓ |
| Shifts | 7 | ✓ |
| Attendance | 8 | ✓ |
| Communication | 42 | — |
| Reports & BI | 12 | — |
| Sales CRM | 58 | — |
| Leave Types | 5 | ✓ |
| Leave Policies | 5 | ✓ |
| Leave Requests | 8 | ✓ |
| Leave Balances | 4 | ✓ |
| Salary Structures | 5 | ✓ |
| Employee Compensation | 5 | ✓ |
| Tax Config | 5 | ✓ |
| Payroll Runs | 9 | ✓ |
| Payslips | 5 | ✓ |
| Payroll Adjustments | 5 | ✓ |
| Chart of Accounts | 5 | — |
| Journal Entries | 6 | — |
| Invoices | 7 | — |
| Payments | 5 | — |
| Expenses | 8 | — |
| Finance Reports | 4 | — |
| Items | 5 | — |
| Warehouses | 5 | — |
| Stock | 7 | — |
| Suppliers | 5 | — |
| Purchase Orders | 9 | — |
| Workflows | 8 | Partial |
| Notifications | 6 | Partial |
| Templates | 5 | ✓ |
| Documents | 6 | ✓ |
| Dashboards | 4 | — |
| Reports | 6 | — |
| Exports | 4 | — |
| Analytics | 4 | — |
| Webhooks | 6 | — |
| API Keys | 5 | — |
| Integrations | 5 | — |
| Import / Export Jobs | 5 | — |
| Jobs (Async Status) | 3 | ✓ |
| **Total** | **~392** | |

---

## Reports & Business Intelligence

Base path: `/api/v1/reports`. Delegates calculations to domain module services — no duplicated business logic.

| Endpoint | Method | Authentication | Permission | Description | Future Version |
|----------|--------|----------------|------------|-------------|----------------|
| `/api/v1/reports/dashboard/executive` | GET | Bearer | `analytics.dashboard.read` | Executive company overview KPIs | v1 |
| `/api/v1/reports/dashboard/{role}` | GET | Bearer | `analytics.dashboard.read` | Role dashboard (ceo, hr_head, finance_head, project_head, sales_head, operations_head) | v1 |
| `/api/v1/reports/widgets` | GET | Bearer | `analytics.dashboard.read` | Widget registry definitions | v1 |
| `/api/v1/reports/widgets/{id}/data` | GET | Bearer | `analytics.dashboard.read` | Single widget data | v1 |
| `/api/v1/reports/settings` | GET | Bearer | `analytics.dashboard.read` | Dashboard layout config | v1 |
| `/api/v1/reports/settings` | PATCH | Bearer | `analytics.dashboard.read` | Update dashboard layout | v1 |
| `/api/v1/reports/analytics/{domain}` | GET | Bearer | `analytics.report.read` | Domain analytics bundle (hr, finance, project, sales, attendance) | v1 |
| `/api/v1/reports/reports` | GET | Bearer | `analytics.report.read` | Generate report with filters | v1 |
| `/api/v1/reports/reports/export` | GET | Bearer | `analytics.report.export` | Export CSV/PDF | v1 |
| `/api/v1/reports/search` | GET | Bearer | `analytics.report.read` | Search report catalog | v1 |

---

## Communication Center

Base path: `/api/v1/communication`. Bearer auth + company scope. Workspace `/api/v1/workspace/announcements` and `/notifications` delegate to these services.

| Endpoint | Method | Authentication | Permission | Description | Future Version |
|----------|--------|----------------|------------|-------------|----------------|
| `/api/v1/communication/dashboard/enterprise` | GET | Bearer | `notifications.broadcast` | Enterprise communication dashboard | v1 |
| `/api/v1/communication/dashboard/manager` | GET | Bearer | `conversation.read` | Manager team communication dashboard | v1 |
| `/api/v1/communication/dashboard/workspace` | GET | Bearer | `notification.read` | Employee workspace communication summary | v1 |
| `/api/v1/communication/policies` | GET | Bearer | `conversation.read` | Communication policies | v1 |
| `/api/v1/communication/policies` | PATCH | Bearer | `notifications.broadcast` | Update policies | v1 |
| `/api/v1/communication/settings` | GET | Bearer | `conversation.read` | Notification preferences / settings | v1 |
| `/api/v1/communication/settings` | PATCH | Bearer | `notifications.broadcast` | Update settings | v1 |
| `/api/v1/communication/announcements` | GET | Bearer | `announcement.read` | List announcements (scoped) | v1 |
| `/api/v1/communication/announcements` | POST | Bearer | `notifications.broadcast` \| `conversation.create` | Create announcement | v1 |
| `/api/v1/communication/announcements/history` | GET | Bearer | `notifications.broadcast` \| `conversation.create` | Broadcast history | v1 |
| `/api/v1/communication/announcements/{id}` | GET | Bearer | `announcement.read` | Get announcement | v1 |
| `/api/v1/communication/announcements/{id}` | PATCH | Bearer | `notifications.broadcast` \| `conversation.update` | Update announcement | v1 |
| `/api/v1/communication/announcements/{id}` | DELETE | Bearer | `notifications.broadcast` \| `conversation.delete` | Delete announcement | v1 |
| `/api/v1/communication/announcements/{id}/publish` | POST | Bearer | `notifications.broadcast` \| `conversation.update` | Publish scheduled announcement | v1 |
| `/api/v1/communication/announcements/{id}/stats` | GET | Bearer | `notifications.broadcast` \| `conversation.read` | Read/delivery statistics | v1 |
| `/api/v1/communication/announcements/{id}/acknowledge` | POST | Bearer | `announcement.acknowledge` | Acknowledge announcement | v1 |
| `/api/v1/communication/channels` | GET | Bearer | `conversation.read` | List team channels | v1 |
| `/api/v1/communication/channels` | POST | Bearer | `conversation.create` | Create channel | v1 |
| `/api/v1/communication/channels/{id}` | GET/PATCH/DELETE | Bearer | `conversation.*` | Channel CRUD | v1 |
| `/api/v1/communication/channels/{id}/members` | GET | Bearer | `conversation.read` | Channel members | v1 |
| `/api/v1/communication/conversations/direct` | GET/POST | Bearer | `conversation.read/create` | Direct message conversations | v1 |
| `/api/v1/communication/conversations/{id}/messages` | GET/POST | Bearer | `conversation.read` / `chat.message.send` | Message thread | v1 |
| `/api/v1/communication/messages/{id}` | PATCH/DELETE | Bearer | `chat.message.send` | Edit/delete message | v1 |
| `/api/v1/communication/messages/{id}/forward` | POST | Bearer | `chat.message.send` | Forward message | v1 |
| `/api/v1/communication/messages/{id}/star` | POST | Bearer | `chat.message.send` | Star message | v1 |
| `/api/v1/communication/messages/{id}/read` | POST | Bearer | `chat.message.send` | Mark message read | v1 |
| `/api/v1/communication/notifications` | GET | Bearer | `notification.read` | Notification center list | v1 |
| `/api/v1/communication/notifications/{id}/read` | PATCH | Bearer | `notification.update` | Mark notification read | v1 |
| `/api/v1/communication/notifications/mark-all-read` | POST | Bearer | `notification.update` | Mark all read | v1 |
| `/api/v1/communication/notifications/{id}/archive` | PATCH | Bearer | `notification.manage` | Archive notification | v1 |
| `/api/v1/communication/inbox` | GET | Bearer | `notification.read` | Internal inbox (aggregated categories) | v1 |
| `/api/v1/communication/search` | GET | Bearer | `conversation.read` | Global communication search | v1 |
| `/api/v1/communication/reports` | GET | Bearer | `notifications.broadcast` | Communication analytics reports | v1 |
| `/api/v1/communication/reports/export` | GET | Bearer | `notifications.broadcast` | Export reports CSV | v1 |

---

## Sales CRM

Base path: `/api/v1/sales`. All routes require Bearer auth + company scope.

| Endpoint | Method | Authentication | Permission | Description | Future Version |
|----------|--------|----------------|------------|-------------|----------------|
| `/api/v1/sales/dashboard/enterprise` | GET | Bearer | `lead.read` | Enterprise admin CRM dashboard | v1 |
| `/api/v1/sales/dashboard/manager` | GET | Bearer | `lead.read` | Sales manager team dashboard | v1 |
| `/api/v1/sales/dashboard/executive` | GET | Bearer | `lead.read` | Sales executive personal dashboard | v1 |
| `/api/v1/sales/policies` | GET | Bearer | `lead.read` | Get assignment/scoring policies | v1 |
| `/api/v1/sales/policies` | PATCH | Bearer | `lead.update` | Update sales policies | v1 |
| `/api/v1/sales/settings` | GET | Bearer | `lead.read` | Get sales settings group | v1 |
| `/api/v1/sales/settings` | PATCH | Bearer | `lead.update` | Update sales settings | v1 |
| `/api/v1/sales/lead-sources` | GET | Bearer | `lead.read` | List lead sources | v1 |
| `/api/v1/sales/lead-sources` | POST | Bearer | `lead.create` | Create lead source | v1 |
| `/api/v1/sales/lead-sources/{id}` | GET | Bearer | `lead.read` | Get lead source | v1 |
| `/api/v1/sales/lead-sources/{id}` | PATCH | Bearer | `lead.update` | Update lead source | v1 |
| `/api/v1/sales/lead-sources/{id}` | DELETE | Bearer | `lead.delete` | Delete lead source | v1 |
| `/api/v1/sales/pipelines` | GET | Bearer | `pipeline.read` | List pipelines with stages | v1 |
| `/api/v1/sales/pipelines` | POST | Bearer | `pipeline.create` | Create pipeline | v1 |
| `/api/v1/sales/pipelines/{id}` | GET | Bearer | `pipeline.read` | Get pipeline | v1 |
| `/api/v1/sales/pipelines/{id}` | PATCH | Bearer | `pipeline.update` | Update pipeline/stages | v1 |
| `/api/v1/sales/pipelines/{id}` | DELETE | Bearer | `pipeline.delete` | Delete pipeline | v1 |
| `/api/v1/sales/sales-teams` | GET | Bearer | `lead.read` | List sales teams | v1 |
| `/api/v1/sales/sales-teams` | POST | Bearer | `lead.update` | Create sales team | v1 |
| `/api/v1/sales/sales-teams/{id}` | GET | Bearer | `lead.read` | Get sales team | v1 |
| `/api/v1/sales/sales-teams/{id}` | PATCH | Bearer | `lead.update` | Update sales team | v1 |
| `/api/v1/sales/sales-teams/{id}` | DELETE | Bearer | `lead.update` | Delete sales team | v1 |
| `/api/v1/sales/territories` | GET | Bearer | `lead.read` | List territories | v1 |
| `/api/v1/sales/territories` | POST | Bearer | `lead.update` | Create territory | v1 |
| `/api/v1/sales/territories/{id}` | GET | Bearer | `lead.read` | Get territory | v1 |
| `/api/v1/sales/territories/{id}` | PATCH | Bearer | `lead.update` | Update territory | v1 |
| `/api/v1/sales/territories/{id}` | DELETE | Bearer | `lead.update` | Delete territory | v1 |
| `/api/v1/sales/sales-targets` | GET | Bearer | `deal.read` | List sales targets | v1 |
| `/api/v1/sales/sales-targets` | POST | Bearer | `deal.create` | Create sales target | v1 |
| `/api/v1/sales/sales-targets/{id}` | GET | Bearer | `deal.read` | Get sales target | v1 |
| `/api/v1/sales/sales-targets/{id}` | PATCH | Bearer | `deal.update` | Update sales target | v1 |
| `/api/v1/sales/sales-targets/{id}` | DELETE | Bearer | `deal.delete` | Delete sales target | v1 |
| `/api/v1/sales/leads` | GET | Bearer | `lead.read` | List leads (scoped by role) | v1 |
| `/api/v1/sales/leads` | POST | Bearer | `lead.create` | Create lead | v1 |
| `/api/v1/sales/leads/import` | POST | Bearer | `lead.create` | Bulk import leads (CSV) | v1 |
| `/api/v1/sales/leads/export` | GET | Bearer | `lead.read` | Export leads CSV | v1 |
| `/api/v1/sales/leads/{id}` | GET | Bearer | `lead.read` | Get lead | v1 |
| `/api/v1/sales/leads/{id}` | PATCH | Bearer | `lead.update` | Update lead | v1 |
| `/api/v1/sales/leads/{id}` | DELETE | Bearer | `lead.delete` | Delete lead | v1 |
| `/api/v1/sales/leads/{id}/assign` | POST | Bearer | `lead.update` | Assign/reassign lead (appends history) | v1 |
| `/api/v1/sales/leads/{id}/move-stage` | POST | Bearer | `lead.update` | Move lead pipeline stage | v1 |
| `/api/v1/sales/leads/{id}/timeline` | GET | Bearer | `lead.read` | Lead activity timeline | v1 |
| `/api/v1/sales/activities` | GET | Bearer | `lead.read` | List lead activities | v1 |
| `/api/v1/sales/activities` | POST | Bearer | `lead.create` | Log activity (note, meeting, etc.) | v1 |
| `/api/v1/sales/activities/{id}` | GET | Bearer | `lead.read` | Get activity | v1 |
| `/api/v1/sales/activities/{id}` | PATCH | Bearer | `lead.update` | Update activity | v1 |
| `/api/v1/sales/activities/{id}` | DELETE | Bearer | `lead.delete` | Delete activity | v1 |
| `/api/v1/sales/call-logs` | GET | Bearer | `lead.read` | List call logs | v1 |
| `/api/v1/sales/call-logs` | POST | Bearer | `lead.create` | Create call log | v1 |
| `/api/v1/sales/call-logs/{id}` | GET | Bearer | `lead.read` | Get call log | v1 |
| `/api/v1/sales/call-logs/{id}` | PATCH | Bearer | `lead.update` | Update call log | v1 |
| `/api/v1/sales/call-logs/{id}` | DELETE | Bearer | `lead.delete` | Delete call log | v1 |
| `/api/v1/sales/follow-ups` | GET | Bearer | `lead.read` | List follow-ups | v1 |
| `/api/v1/sales/follow-ups` | POST | Bearer | `lead.create` | Schedule follow-up | v1 |
| `/api/v1/sales/follow-ups/{id}` | GET | Bearer | `lead.read` | Get follow-up | v1 |
| `/api/v1/sales/follow-ups/{id}` | PATCH | Bearer | `lead.update` | Update follow-up | v1 |
| `/api/v1/sales/follow-ups/{id}` | DELETE | Bearer | `lead.delete` | Delete follow-up | v1 |
| `/api/v1/sales/deals` | GET | Bearer | `deal.read` | List deals | v1 |
| `/api/v1/sales/deals` | POST | Bearer | `deal.create` | Create deal | v1 |
| `/api/v1/sales/deals/{id}` | GET | Bearer | `deal.read` | Get deal | v1 |
| `/api/v1/sales/deals/{id}` | PATCH | Bearer | `deal.update` | Update deal (won/lost/value) | v1 |
| `/api/v1/sales/deals/{id}` | DELETE | Bearer | `deal.delete` | Delete deal | v1 |
| `/api/v1/sales/reports` | GET | Bearer | `lead.read` | Generate CRM reports | v1 |
| `/api/v1/sales/reports/export` | GET | Bearer | `lead.read` | Export report CSV/PDF | v1 |
| `/api/v1/sales/analytics/conversion` | GET | Bearer | `lead.read` | Conversion analytics | v1 |
| `/api/v1/sales/analytics/revenue` | GET | Bearer | `deal.read` | Revenue analytics | v1 |

---

## Health

| Endpoint | Method | Authentication | Permission | Description | Future Version |
|----------|--------|----------------|------------|-------------|----------------|
| `/health` | GET | None | Public | Liveness probe — process is running | v1 |
| `/health/ready` | GET | None | Public | Readiness probe — MongoDB and Redis reachable | v1 |

---

## Auth

| Endpoint | Method | Authentication | Permission | Description | Future Version |
|----------|--------|----------------|------------|-------------|----------------|
| `/api/v1/auth/bootstrap` | POST | None | Public | Initialize system (company, branch, permissions, roles, super admin) — only when no company exists | v1 |
| `/api/v1/auth/system/status` | GET | None | Public | Returns `{ initialized: boolean }` | v1 |
| `/api/v1/auth/login` | POST | None | Public | Authenticate with company code, email, password; returns tokens + session | v1 |
| `/api/v1/auth/refresh` | POST | None | Public | Rotate refresh token and issue new access token | v1 |
| `/api/v1/auth/logout` | POST | Bearer | — | Revoke current session | v1 |
| `/api/v1/auth/logout-all` | POST | Bearer | — | Revoke all user sessions | v1 |
| `/api/v1/auth/forgot-password` | POST | None | Public | Queue password reset email | v1 |
| `/api/v1/auth/reset-password` | POST | None | Public | Reset password using token from email | v1 |
| `/api/v1/auth/me` | GET | Bearer | — | Current user, company, branch, department, roles, permissions, manager, employee profile | v1 |
| `/api/v1/auth/password/change` | POST | Bearer | — | Change password for authenticated user | v2 |
| `/api/v1/auth/mfa/setup` | POST | Bearer | — | Enable TOTP MFA for current user | v2 |
| `/api/v1/auth/mfa/verify` | POST | Bearer | — | Verify MFA code during login or setup | v2 |
| `/api/v1/auth/sso/{provider}` | GET | None | Public | Initiate OAuth2/OIDC SSO flow | v2 |

---

## Users

| Endpoint | Method | Authentication | Permission | Description | Future Version |
|----------|--------|----------------|------------|-------------|----------------|
| `/api/v1/users` | GET | Bearer | `users:read` | List users with pagination and filters | v1 |
| `/api/v1/users` | POST | Bearer | `users:create` | Create user account | v1 |
| `/api/v1/users/{id}` | GET | Bearer | `users:read` | Get user by ID | v1 |
| `/api/v1/users/{id}` | PATCH | Bearer | `users:update` | Update user profile and settings | v1 |
| `/api/v1/users/{id}` | DELETE | Bearer | `users:delete` | Soft-deactivate user | v1 |
| `/api/v1/users/{id}/lock` | POST | Bearer | `users:lock` | Lock user account | v1 |
| `/api/v1/users/{id}/unlock` | POST | Bearer | `users:lock` | Unlock user account | v1 |
| `/api/v1/users/{id}/roles` | GET | Bearer | `users:read` | List roles assigned to user | v1 |
| `/api/v1/users/{id}/roles` | PUT | Bearer | `users:assign_roles` | Replace user role assignments | v1 |
| `/api/v1/users/me/avatar` | POST | Bearer | — | Upload profile avatar | v2 |

---

## Roles & Permissions

| Endpoint | Method | Authentication | Permission | Description | Future Version |
|----------|--------|----------------|------------|-------------|----------------|
| `/api/v1/roles` | GET | Bearer | `roles:read` | List roles | v1 |
| `/api/v1/roles` | POST | Bearer | `roles:create` | Create role | v1 |
| `/api/v1/roles/{id}` | GET | Bearer | `roles:read` | Get role by ID | v1 |
| `/api/v1/roles/{id}` | PATCH | Bearer | `roles:update` | Update role | v1 |
| `/api/v1/roles/{id}` | DELETE | Bearer | `roles:delete` | Soft-delete role | v1 |
| `/api/v1/roles/{id}/permissions` | GET | Bearer | `roles:read` | List permissions for role | v1 |
| `/api/v1/roles/{id}/permissions` | PUT | Bearer | `roles:assign_permissions` | Replace role permissions | v1 |
| `/api/v1/permissions` | GET | Bearer | `permissions:read` | List all system permissions | v1 |
| `/api/v1/permissions/{id}` | GET | Bearer | `permissions:read` | Get permission by ID | v1 |

---

## Tenants

| Endpoint | Method | Authentication | Permission | Description | Future Version |
|----------|--------|----------------|------------|-------------|----------------|
| `/api/v1/tenants` | GET | Bearer | `tenants:read` | List tenants (super-admin) | v1 |
| `/api/v1/tenants` | POST | Bearer | `tenants:create` | Register new tenant | v1 |
| `/api/v1/tenants/{id}` | GET | Bearer | `tenants:read` | Get tenant details | v1 |
| `/api/v1/tenants/{id}` | PATCH | Bearer | `tenants:update` | Update tenant settings | v1 |
| `/api/v1/tenants/{id}` | DELETE | Bearer | `tenants:delete` | Soft-deactivate tenant | v1 |
| `/api/v1/tenants/current` | GET | Bearer | — | Get current tenant context from token | v1 |
| `/api/v1/tenants/current/branding` | PATCH | Bearer | `tenants:update` | Update tenant branding (logo, colors) | v2 |

---

## Audit

| Endpoint | Method | Authentication | Permission | Description | Future Version |
|----------|--------|----------------|------------|-------------|----------------|
| `/api/v1/audit-logs` | GET | Bearer | `audit:read` | Query audit logs with filters | v1 |
| `/api/v1/audit-logs/{id}` | GET | Bearer | `audit:read` | Get single audit entry | v1 |
| `/api/v1/audit-logs/export` | POST | Bearer | `audit:export` | Queue audit log export job | v2 |

---

## Organization (Implemented — Master Data Module)

Unified registry-driven CRUD at `/api/v1/organization/*`. Entity keys: `branch`, `department`, `designation`, `job-role`, `office-location`, `work-shift`, `holiday`, `employment-type`, `salary-grade`, `leave-type`, `project-category`, `technology`, `skill`.

| Endpoint | Method | Authentication | Permission | Description |
|----------|--------|----------------|------------|-------------|
| `/api/v1/organization/company` | GET | Bearer | `company.read` | Get current company profile |
| `/api/v1/organization/company` | PATCH | Bearer | `company.update` | Update company profile |
| `/api/v1/organization/entities/{entityKey}` | GET | Bearer | `{entity}.read` | List with pagination, search, filter, sort, cursor |
| `/api/v1/organization/entities/{entityKey}/{id}` | GET | Bearer | `{entity}.read` | Get by ID (cached when enabled) |
| `/api/v1/organization/entities/{entityKey}` | POST | Bearer | `{entity}.create` | Create entity |
| `/api/v1/organization/entities/{entityKey}/{id}` | PATCH | Bearer | `{entity}.update` | Update entity |
| `/api/v1/organization/entities/{entityKey}/{id}` | DELETE | Bearer | `{entity}.delete` | Soft delete with dependency check |
| `/api/v1/organization/entities/{entityKey}/{id}/restore` | POST | Bearer | `{entity}.update` | Restore soft-deleted entity |
| `/api/v1/organization/bulk/{entityKey}` | POST | Bearer | `organization.bulk` | Bulk create |
| `/api/v1/organization/bulk/{entityKey}` | PATCH | Bearer | `organization.bulk` | Bulk update |
| `/api/v1/organization/bulk/{entityKey}` | DELETE | Bearer | `organization.bulk` | Bulk soft delete |
| `/api/v1/organization/export/{entityKey}` | GET | Bearer | `organization.export` | CSV export |
| `/api/v1/organization/import/{entityKey}` | POST | Bearer | `organization.import` | CSV import |

## Settings — Enterprise Configuration Platform (Implemented)

| Endpoint | Method | Authentication | Permission | Description |
|----------|--------|----------------|------------|-------------|
| `/api/v1/settings/sections` | GET | Bearer | `settings.read` | Configuration section list |
| `/api/v1/settings/catalog` | GET | Bearer | `settings.read` | Full setting definitions catalog |
| `/api/v1/settings/seed-defaults` | POST | Bearer | `settings.manage` | Idempotent seed of default settings |
| `/api/v1/settings/history/{key}` | GET | Bearer | `settings.read` | Setting version history |
| `/api/v1/settings/feature-flags` | GET | Bearer | `settings.read` | List feature flags |
| `/api/v1/settings/feature-flags/{flagKey}` | PATCH | Bearer | `settings.manage` | Toggle feature flag |
| `/api/v1/settings/navigation` | GET | Bearer | `settings.read` | Navigation overrides config |
| `/api/v1/settings/navigation` | PUT | Bearer | `settings.manage` | Update navigation overrides |
| `/api/v1/settings/audit` | GET | Bearer | `system.audit.read` | Audit explorer query |
| `/api/v1/settings/audit/{id}` | GET | Bearer | `system.audit.read` | Audit log detail |
| `/api/v1/settings/audit/export` | GET | Bearer | `system.audit.read` | Audit CSV export |
| `/api/v1/settings/system/health` | GET | Bearer | `system.config.read` | System health (DB, Redis, queue) |
| `/api/v1/settings/email/test` | POST | Bearer | `settings.manage` | Test email configuration (stub) |
| `/api/v1/settings` | GET | Bearer | `settings.read` | List settings (group, search, pagination) |
| `/api/v1/settings/public` | GET | Bearer | `settings.read` | Public settings only |
| `/api/v1/settings/group/{group}` | GET | Bearer | `settings.read` | Settings by group |
| `/api/v1/settings/{key}` | GET | Bearer | `settings.read` | Get setting by key |
| `/api/v1/settings` | POST | Bearer | `settings.manage` | Create setting |
| `/api/v1/settings/{key}` | PATCH | Bearer | `settings.manage` | Update setting (records version) |
| `/api/v1/settings/{key}` | DELETE | Bearer | `settings.manage` | Soft delete setting |

---

## RBAC (Implemented — Enterprise Authorization)

Dynamic permission engine, role management, assignments, hierarchies, and simulator at `/api/v1/rbac/*`. Middleware checks **permission codes only** (never role names). Super Admin (`super-admin` slug) receives all catalog permissions dynamically and is protected from delete/disable/permission stripping.

### Permissions & Matrix

| Endpoint | Method | Authentication | Permission | Description |
|----------|--------|----------------|------------|-------------|
| `/api/v1/rbac/permissions` | GET | Bearer | `rbac.permission.read` | List permissions (search, module, category, pagination) |
| `/api/v1/rbac/matrix` | GET | Bearer | `rbac.matrix.read` | Permission matrix (permissions, groups, categories) |
| `/api/v1/rbac/permission-groups` | GET | Bearer | `rbac.permission.read` | List permission groups |
| `/api/v1/rbac/permission-categories` | GET | Bearer | `rbac.permission.read` | List permission categories |

### Roles

| Endpoint | Method | Authentication | Permission | Description |
|----------|--------|----------------|------------|-------------|
| `/api/v1/rbac/roles` | GET | Bearer | `rbac.role.read` | List roles (search, archive filter, pagination) |
| `/api/v1/rbac/roles` | POST | Bearer | `rbac.role.create` | Create custom role |
| `/api/v1/rbac/roles/{id}` | GET | Bearer | `rbac.role.read` | Get role with assigned permissions |
| `/api/v1/rbac/roles/{id}` | PATCH | Bearer | `rbac.role.update` | Update role (description, priority, group) |
| `/api/v1/rbac/roles/{id}` | DELETE | Bearer | `rbac.role.delete` | Delete role (blocked if in use or system-protected) |
| `/api/v1/rbac/roles/{id}/archive` | POST | Bearer | `rbac.role.update` | Archive role |
| `/api/v1/rbac/roles/{id}/restore` | POST | Bearer | `rbac.role.update` | Restore archived role |
| `/api/v1/rbac/roles/{id}/clone` | POST | Bearer | `rbac.role.clone` | Clone role with permissions |
| `/api/v1/rbac/roles/{id}/permissions` | POST | Bearer | `rbac.role.update` | Assign permissions (single/bulk, no duplicates) |
| `/api/v1/rbac/roles/{id}/permissions` | DELETE | Bearer | `rbac.role.update` | Revoke permissions (bulk) |
| `/api/v1/rbac/roles/{id}/permission-groups` | POST | Bearer | `rbac.role.update` | Assign entire permission group |
| `/api/v1/rbac/roles/compare` | POST | Bearer | `rbac.role.read` | Compare two roles (shared / only-in-A / only-in-B) |
| `/api/v1/rbac/role-templates` | GET | Bearer | `rbac.role.read` | List role templates |

### Assignments & Effective Permissions

| Endpoint | Method | Authentication | Permission | Description |
|----------|--------|----------------|------------|-------------|
| `/api/v1/rbac/assignments/roles` | POST | Bearer | `rbac.assignment.manage` | Assign role to employee |
| `/api/v1/rbac/assignments/roles` | DELETE | Bearer | `rbac.assignment.manage` | Revoke role from employee |
| `/api/v1/rbac/assignments/roles/bulk` | POST | Bearer | `rbac.assignment.manage` | Bulk assign roles |
| `/api/v1/rbac/effective-permissions/{employeeId}` | GET | Bearer | `rbac.assignment.read` | Effective permissions for employee |
| `/api/v1/rbac/assignments/employees/{employeeId}` | GET | Bearer | `rbac.assignment.read` | List employee role assignments |

### Simulator & Hierarchies

| Endpoint | Method | Authentication | Permission | Description |
|----------|--------|----------------|------------|-------------|
| `/api/v1/rbac/simulator` | POST | Bearer | `rbac.simulator.run` | Simulate effective permissions from roles/codes |
| `/api/v1/rbac/approval-hierarchy` | GET | Bearer | `rbac.hierarchy.read` | List approval hierarchy levels |
| `/api/v1/rbac/approval-hierarchy` | PUT | Bearer | `rbac.hierarchy.manage` | Upsert approval hierarchy level |
| `/api/v1/rbac/reporting-hierarchy/{employeeId}` | GET | Bearer | `rbac.hierarchy.read` | List reporting relationships for employee |
| `/api/v1/rbac/reporting-hierarchy` | POST | Bearer | `rbac.hierarchy.manage` | Assign reporting relationship (direct, dotted line, dept/branch head) |

---

## Employees (Implemented — Employee Management)

Full employee lifecycle at `/api/v1/employees/*`. Integrates with RBAC permission codes. Documents stored on Cloudinary only.

### Core CRUD

| Endpoint | Method | Authentication | Permission | Description |
|----------|--------|----------------|------------|-------------|
| `/api/v1/employees` | GET | Bearer | `employee.read` | List with search, filter, pagination, sorting |
| `/api/v1/employees/search` | GET | Bearer | `employee.read` | Quick search by name, email, employee number |
| `/api/v1/employees` | POST | Bearer | `employee.create` | Create employee (auto employee number) |
| `/api/v1/employees/{id}` | GET | Bearer | `employee.read` | Get employee by ID |
| `/api/v1/employees/{id}/dashboard` | GET | Bearer | `employee.read` | Full profile dashboard (all sub-resources) |
| `/api/v1/employees/{id}` | PATCH | Bearer | `employee.update` | Update employee |
| `/api/v1/employees/{id}` | DELETE | Bearer | `employee.delete` | Soft delete (blocks if has active reports) |
| `/api/v1/employees/{id}/archive` | POST | Bearer | `employee.update` | Archive employee |
| `/api/v1/employees/{id}/restore` | POST | Bearer | `employee.update` | Restore archived employee |
| `/api/v1/employees/{id}/deactivate` | POST | Bearer | `employee.update` | Deactivate employee |
| `/api/v1/employees/{id}/reactivate` | POST | Bearer | `employee.update` | Reactivate employee |
| `/api/v1/employees/bulk` | POST | Bearer | `employee.bulk` | Bulk archive/restore/deactivate/reactivate/delete |
| `/api/v1/employees/export` | GET | Bearer | `employee.export` | CSV export |
| `/api/v1/employees/import` | POST | Bearer | `employee.import` | CSV import |

### Sub-resources

| Endpoint | Method | Permission | Description |
|----------|--------|------------|-------------|
| `/api/v1/employees/{employeeId}/documents` | GET/POST/DELETE | `employee.documents.*` | Document list, Cloudinary upload, delete |
| `/api/v1/employees/{employeeId}/upload/signed-params` | GET | `employee.documents.manage` | Cloudinary signed upload params |
| `/api/v1/employees/{employeeId}/emergency-contacts` | GET/POST | `employee.read/update` | Emergency contacts |
| `/api/v1/employees/{employeeId}/education` | GET/POST/PATCH/DELETE | `employee.education.*` | Education records |
| `/api/v1/employees/{employeeId}/experience` | GET/POST | `employee.experience.*` | Work experience |
| `/api/v1/employees/{employeeId}/bank-details` | GET/POST | `employee.bank.*` | Bank account details |
| `/api/v1/employees/{employeeId}/skills` | GET/POST | `employee.skills.*` | Employee skills |
| `/api/v1/employees/{employeeId}/certifications` | GET/POST | `employee.certifications.*` | Certifications |
| `/api/v1/employees/{employeeId}/assets` | GET/POST | `employee.assets.*` | Assigned assets |
| `/api/v1/employees/{employeeId}/assets/{id}/return` | POST | `employee.assets.manage` | Return asset |
| `/api/v1/employees/{employeeId}/managers` | GET/POST/DELETE | `employee.managers.*` | Manager/mentor/buddy relationships |
| `/api/v1/employees/{employeeId}/timeline` | GET | `employee.timeline.read` | Employee timeline events |

---

## Recruitment (Implemented — ATS)

Full applicant tracking at `/api/v1/recruitment/*`. Integrates with Employee, RBAC, Notifications, Audit, Cloudinary, Queue, Email, Activity Feed.

### Dashboard & Pipeline

| Endpoint | Method | Authentication | Permission | Description |
|----------|--------|----------------|------------|-------------|
| `/api/v1/recruitment/dashboard` | GET | Bearer | `recruitment.dashboard.read` | Recruiter dashboard metrics |
| `/api/v1/recruitment/pipeline/kanban` | GET | Bearer | `recruitment.pipeline.read` | Kanban columns by stage |
| `/api/v1/recruitment/pipeline/stages` | GET | Bearer | `recruitment.pipeline.read` | List configurable pipeline stages |

### Candidates

| Endpoint | Method | Authentication | Permission | Description |
|----------|--------|----------------|------------|-------------|
| `/api/v1/recruitment/candidates` | GET | Bearer | `candidate.read` | List with search, filter, pagination |
| `/api/v1/recruitment/candidates` | POST | Bearer | `candidate.create` | Create candidate |
| `/api/v1/recruitment/candidates/export` | GET | Bearer | `candidate.export` | CSV export |
| `/api/v1/recruitment/candidates/import` | POST | Bearer | `candidate.import` | Bulk CSV import |
| `/api/v1/recruitment/candidates/merge` | POST | Bearer | `candidate.merge` | Merge duplicate candidates |
| `/api/v1/recruitment/candidates/{id}` | GET | Bearer | `candidate.read` | Get candidate |
| `/api/v1/recruitment/candidates/{id}` | PATCH | Bearer | `candidate.update` | Update candidate |
| `/api/v1/recruitment/candidates/{id}/archive` | POST | Bearer | `candidate.update` | Archive candidate |
| `/api/v1/recruitment/candidates/{id}/restore` | POST | Bearer | `candidate.update` | Restore candidate |
| `/api/v1/recruitment/candidates/{id}/pipeline` | POST | Bearer | `recruitment.pipeline.manage` | Transition pipeline stage |
| `/api/v1/recruitment/candidates/{candidateId}/timeline` | GET | Bearer | `candidate.read` | Candidate timeline |
| `/api/v1/recruitment/candidates/{candidateId}/resume` | POST | Bearer | `candidate.update` | Upload resume (Cloudinary) |

### Interviews

| Endpoint | Method | Authentication | Permission | Description |
|----------|--------|----------------|------------|-------------|
| `/api/v1/recruitment/interviews` | GET | Bearer | `interview.read` | List interviews |
| `/api/v1/recruitment/interviews` | POST | Bearer | `interview.create` | Schedule interview |
| `/api/v1/recruitment/interviews/{id}/reschedule` | PATCH | Bearer | `interview.update` | Reschedule interview |
| `/api/v1/recruitment/interviews/{id}/cancel` | POST | Bearer | `interview.update` | Cancel interview |
| `/api/v1/recruitment/interviews/{id}/feedback` | POST | Bearer | `interview.update` | Submit feedback, score, decision |

### Offers

| Endpoint | Method | Authentication | Permission | Description |
|----------|--------|----------------|------------|-------------|
| `/api/v1/recruitment/offers` | GET | Bearer | `offer.read` | List offers |
| `/api/v1/recruitment/offers` | POST | Bearer | `offer.create` | Generate offer letter (HTML → Cloudinary) |
| `/api/v1/recruitment/offers/{id}/send` | POST | Bearer | `offer.update` | Send offer email (queued) |
| `/api/v1/recruitment/offers/{id}/accept` | POST | Bearer | `offer.update` | Candidate accept |
| `/api/v1/recruitment/offers/{id}/reject` | POST | Bearer | `offer.update` | Candidate reject |

### Onboarding & Conversion

| Endpoint | Method | Authentication | Permission | Description |
|----------|--------|----------------|------------|-------------|
| `/api/v1/recruitment/onboarding/{candidateId}` | GET | Bearer | `onboarding.read` | Get onboarding form state |
| `/api/v1/recruitment/onboarding/{candidateId}/draft` | PATCH | Bearer | `onboarding.manage` | Save draft / resume later |
| `/api/v1/recruitment/onboarding/{candidateId}/complete-section` | POST | Bearer | `onboarding.manage` | Complete onboarding section |
| `/api/v1/recruitment/conversion` | POST | Bearer | `conversion.execute` | Convert candidate to employee |

---

## Projects (Implemented — Project Management)

Full PMS at `/api/v1/projects/*`. Integrates with Employee, RBAC, Notifications, Audit, Cloudinary, Queue, Activity Feed.

### Dashboard

| Endpoint | Method | Permission | Description |
|----------|--------|------------|-------------|
| `/api/v1/projects/dashboard/manager` | GET | `project.dashboard.read` | Manager dashboard |
| `/api/v1/projects/dashboard/developer` | GET | `project.dashboard.read` | Developer dashboard |
| `/api/v1/projects/dashboard/{projectId}` | GET | `project.dashboard.read` | Project-specific dashboard |

### Projects

| Endpoint | Method | Permission | Description |
|----------|--------|------------|-------------|
| `/api/v1/projects` | GET/POST | `project.read/create` | List/create projects |
| `/api/v1/projects/{id}` | GET/PATCH/DELETE | `project.read/update/delete` | CRUD |
| `/api/v1/projects/{id}/archive` | POST | `project.update` | Archive project |
| `/api/v1/projects/{id}/restore` | POST | `project.update` | Restore project |
| `/api/v1/projects/{id}/logo` | POST | `project.update` | Upload logo (Cloudinary) |
| `/api/v1/projects/{projectId}/members` | GET | `project.read` | List members |
| `/api/v1/projects/members` | POST | `project.update` | Assign member |
| `/api/v1/projects/{projectId}/modules` | GET | `module.read` | List modules |
| `/api/v1/projects/modules` | POST | `module.create` | Create module |
| `/api/v1/projects/{projectId}/milestones` | GET | `milestone.read` | List milestones |
| `/api/v1/projects/milestones` | POST | `milestone.create` | Create milestone |
| `/api/v1/projects/{projectId}/sprints` | GET | `sprint.read` | List sprints |
| `/api/v1/projects/sprints` | POST | `sprint.create` | Create sprint |
| `/api/v1/projects/sprints/{id}/burndown` | GET | `sprint.read` | Burndown data |
| `/api/v1/projects/{projectId}/kanban` | GET | `task.read` | Task kanban |
| `/api/v1/projects/{projectId}/knowledge-base` | GET/PUT | `project.knowledge.*` | Knowledge base |
| `/api/v1/projects/{projectId}/work-logs` | GET | `project.worklog.read` | Work logs |

### Tasks

| Endpoint | Method | Permission | Description |
|----------|--------|------------|-------------|
| `/api/v1/projects/tasks/list` | GET | `task.read` | List tasks |
| `/api/v1/projects/tasks` | POST | `task.create` | Create task |
| `/api/v1/projects/tasks/{id}` | GET/PATCH/DELETE | `task.read/update/delete` | Task CRUD |
| `/api/v1/projects/tasks/bulk-status` | POST | `task.update` | Bulk status update |
| `/api/v1/projects/tasks/{id}/comments` | GET/POST | `task.read/update` | Comments |
| `/api/v1/projects/tasks/{id}/attachments` | POST | `task.update` | Cloudinary upload |
| `/api/v1/projects/tasks/{id}/assignments` | GET | `task.read` | Assignment history |
| `/api/v1/projects/tasks/{id}/verify` | POST | `verification.execute` | Submit for verification |
| `/api/v1/projects/verifications/{id}/approve` | POST | `verification.execute` | Approve |
| `/api/v1/projects/verifications/{id}/reject` | POST | `verification.execute` | Reject |
| `/api/v1/projects/subtasks` | POST | `task.create` | Create subtask |
| `/api/v1/projects/workflow/stages` | GET | `task.read` | Workflow stages |

---

## Workspace (Implemented — Employee Self-Service Portal)

Employee daily workspace at `/api/v1/workspace/*`. Requires linked `employeeId`. Integrates with Auth, RBAC, Employee, Projects, ATS, Organization, Cloudinary, Audit, Activity Feed, Notifications.

### Layout & Widgets

| Endpoint | Method | Permission | Description |
|----------|--------|------------|-------------|
| `/api/v1/workspace` | GET | `workspace.read` | Widget catalog + saved layout |
| `/api/v1/workspace/widgets/config` | PUT | `workspace.widgets.manage` | Update widget layout (drag-and-drop ready) |
| `/api/v1/workspace/widgets/{slug}` | GET | `workspace.widgets.read` | Independent widget data loader |

Widget slugs: `today_tasks`, `my_projects`, `project_progress`, `upcoming_deadlines`, `recent_notifications`, `recent_activities`, `attendance_summary`, `leave_balance`, `payslips`, `announcements`, `quick_links`, `upcoming_birthdays`, `work_anniversaries`, `manager_messages`

### Profile & Hierarchy

| Endpoint | Method | Permission | Description |
|----------|--------|------------|-------------|
| `/api/v1/workspace/profile` | GET | `profile.read` | Self profile (dashboard + sessions + permissions) |
| `/api/v1/workspace/profile` | PATCH | `profile.update` | Update allowed self fields |
| `/api/v1/workspace/hierarchy` | GET | `workspace.read` | Org chart — manager, peers, direct reports |

### My Projects & Tasks

| Endpoint | Method | Permission | Description |
|----------|--------|------------|-------------|
| `/api/v1/workspace/projects` | GET | `workspace.read` | Assigned projects with progress |
| `/api/v1/workspace/projects/{id}` | GET | `workspace.read` | Project detail (membership required) |
| `/api/v1/workspace/tasks` | GET | `workspace.read` | My tasks (list, filters, search) |
| `/api/v1/workspace/tasks/kanban` | GET | `workspace.read` | Personal kanban |
| `/api/v1/workspace/tasks/calendar` | GET | `workspace.read` | Task calendar view |
| `/api/v1/workspace/tasks/bulk-status` | POST | `workspace.read` | Bulk status update |
| `/api/v1/workspace/tasks/{id}` | PATCH | `workspace.read` | Quick task update |

### Documents, Announcements, Notifications

| Endpoint | Method | Permission | Description |
|----------|--------|------------|-------------|
| `/api/v1/workspace/documents` | GET | `document.read` | My documents with expiry indicators |
| `/api/v1/workspace/documents/{id}` | GET | `document.read` | Document + version history |
| `/api/v1/workspace/documents/{id}/download` | POST | `document.read` | Download (audited) |
| `/api/v1/workspace/announcements` | GET | `announcement.read` | Filtered announcements + read receipts |
| `/api/v1/workspace/announcements/{id}` | GET | `announcement.read` | Detail + auto read receipt |
| `/api/v1/workspace/announcements/{id}/acknowledge` | POST | `announcement.acknowledge` | Acknowledge (audited) |
| `/api/v1/workspace/notifications` | GET | `notification.read` | Grouped notifications |
| `/api/v1/workspace/notifications/{id}/read` | PATCH | `notification.manage` | Mark read |
| `/api/v1/workspace/notifications/mark-all-read` | POST | `notification.manage` | Mark all read |
| `/api/v1/workspace/notifications/{id}/archive` | PATCH | `notification.manage` | Archive |

### Activity, Calendar, Search

| Endpoint | Method | Permission | Description |
|----------|--------|------------|-------------|
| `/api/v1/workspace/activity` | GET | `timeline.read` | Merged activity + employee timeline |
| `/api/v1/workspace/calendar` | GET | `workspace.calendar.read` | Personal calendar events |
| `/api/v1/workspace/search` | GET | `workspace.search` | Cross-entity search |

---

## Organization (Planned — legacy registry)

| Endpoint | Method | Authentication | Permission | Description | Future Version |
|----------|--------|----------------|------------|-------------|----------------|
| `/api/v1/organizations` | GET | Bearer | `organizations:read` | List organizations | v1 |
| `/api/v1/organizations` | POST | Bearer | `organizations:create` | Create organization / legal entity | v1 |
| `/api/v1/organizations/{id}` | GET | Bearer | `organizations:read` | Get organization by ID | v1 |
| `/api/v1/organizations/{id}` | PATCH | Bearer | `organizations:update` | Update organization | v1 |
| `/api/v1/organizations/{id}` | DELETE | Bearer | `organizations:delete` | Soft-delete organization | v1 |

---

## Departments

| Endpoint | Method | Authentication | Permission | Description | Future Version |
|----------|--------|----------------|------------|-------------|----------------|
| `/api/v1/departments` | GET | Bearer | `departments:read` | List departments (flat) | v1 |
| `/api/v1/departments/tree` | GET | Bearer | `departments:read` | Get department hierarchy tree | v1 |
| `/api/v1/departments` | POST | Bearer | `departments:create` | Create department | v1 |
| `/api/v1/departments/{id}` | GET | Bearer | `departments:read` | Get department by ID | v1 |
| `/api/v1/departments/{id}` | PATCH | Bearer | `departments:update` | Update department | v1 |
| `/api/v1/departments/{id}` | DELETE | Bearer | `departments:delete` | Soft-delete department | v1 |

---

## Locations

| Endpoint | Method | Authentication | Permission | Description | Future Version |
|----------|--------|----------------|------------|-------------|----------------|
| `/api/v1/locations` | GET | Bearer | `locations:read` | List locations | v1 |
| `/api/v1/locations` | POST | Bearer | `locations:create` | Create location | v1 |
| `/api/v1/locations/{id}` | GET | Bearer | `locations:read` | Get location by ID | v1 |
| `/api/v1/locations/{id}` | PATCH | Bearer | `locations:update` | Update location | v1 |
| `/api/v1/locations/{id}` | DELETE | Bearer | `locations:delete` | Soft-delete location | v1 |

---

## Designations

| Endpoint | Method | Authentication | Permission | Description | Future Version |
|----------|--------|----------------|------------|-------------|----------------|
| `/api/v1/designations` | GET | Bearer | `designations:read` | List designations | v1 |
| `/api/v1/designations` | POST | Bearer | `designations:create` | Create designation | v1 |
| `/api/v1/designations/{id}` | GET | Bearer | `designations:read` | Get designation by ID | v1 |
| `/api/v1/designations/{id}` | PATCH | Bearer | `designations:update` | Update designation | v1 |
| `/api/v1/designations/{id}` | DELETE | Bearer | `designations:delete` | Soft-delete designation | v1 |

---

## Lookups

| Endpoint | Method | Authentication | Permission | Description | Future Version |
|----------|--------|----------------|------------|-------------|----------------|
| `/api/v1/lookups` | GET | Bearer | `lookups:read` | List lookups by category | v1 |
| `/api/v1/lookups` | POST | Bearer | `lookups:create` | Create lookup value | v1 |
| `/api/v1/lookups/{id}` | GET | Bearer | `lookups:read` | Get lookup by ID | v1 |
| `/api/v1/lookups/{id}` | PATCH | Bearer | `lookups:update` | Update lookup value | v1 |
| `/api/v1/lookups/{id}` | DELETE | Bearer | `lookups:delete` | Soft-delete lookup value | v1 |

---

## Holidays

| Endpoint | Method | Authentication | Permission | Description | Future Version |
|----------|--------|----------------|------------|-------------|----------------|
| `/api/v1/holidays` | GET | Bearer | `holidays:read` | List holidays with date/location filters | v1 |
| `/api/v1/holidays` | POST | Bearer | `holidays:create` | Create holiday entry | v1 |
| `/api/v1/holidays/{id}` | GET | Bearer | `holidays:read` | Get holiday by ID | v1 |
| `/api/v1/holidays/{id}` | PATCH | Bearer | `holidays:update` | Update holiday | v1 |
| `/api/v1/holidays/{id}` | DELETE | Bearer | `holidays:delete` | Delete holiday | v1 |
| `/api/v1/holidays/import` | POST | Bearer | `holidays:import` | Bulk import holidays via CSV (async job) | v1 |

---

## Employees

| Endpoint | Method | Authentication | Permission | Description | Future Version |
|----------|--------|----------------|------------|-------------|----------------|
| `/api/v1/employees` | GET | Bearer | `employees:read` | List employees with search and filters | v1 |
| `/api/v1/employees` | POST | Bearer | `employees:create` | Create employee record | v1 |
| `/api/v1/employees/{id}` | GET | Bearer | `employees:read` | Get employee by ID | v1 |
| `/api/v1/employees/{id}` | PATCH | Bearer | `employees:update` | Update employee profile | v1 |
| `/api/v1/employees/{id}` | DELETE | Bearer | `employees:delete` | Soft-delete employee | v1 |
| `/api/v1/employees/{id}/status` | PATCH | Bearer | `employees:update_status` | Transition employee lifecycle status | v1 |
| `/api/v1/employees/import` | POST | Bearer | `employees:import` | Bulk import employees via CSV (async job) | v1 |
| `/api/v1/employees/me` | GET | Bearer | — | Get own employee record (self-service) | v1 |
| `/api/v1/employees/search` | GET | Bearer | `employees:read` | Full-text employee search | v2 |

---

## Employee Documents

| Endpoint | Method | Authentication | Permission | Description | Future Version |
|----------|--------|----------------|------------|-------------|----------------|
| `/api/v1/employees/{employeeId}/documents` | GET | Bearer | `employee_documents:read` | List documents for employee | v1 |
| `/api/v1/employees/{employeeId}/documents` | POST | Bearer | `employee_documents:create` | Upload employee document | v1 |
| `/api/v1/employees/{employeeId}/documents/{id}` | GET | Bearer | `employee_documents:read` | Get document metadata | v1 |
| `/api/v1/employees/{employeeId}/documents/{id}/download` | GET | Bearer | `employee_documents:read` | Download document file (signed URL) | v1 |
| `/api/v1/employees/{employeeId}/documents/{id}` | DELETE | Bearer | `employee_documents:delete` | Delete document | v1 |

---

## Employee Org

| Endpoint | Method | Authentication | Permission | Description | Future Version |
|----------|--------|----------------|------------|-------------|----------------|
| `/api/v1/employees/{employeeId}/org-assignment` | GET | Bearer | `employees:read` | Get current org assignment | v1 |
| `/api/v1/employees/{employeeId}/org-assignment` | PUT | Bearer | `employees:update` | Update department, designation, location, manager | v1 |
| `/api/v1/employees/{employeeId}/org-history` | GET | Bearer | `employees:read` | List effective-dated org assignment history | v1 |
| `/api/v1/employees/{employeeId}/direct-reports` | GET | Bearer | `employees:read` | List direct reports for manager | v1 |

---

## Employee Bank

| Endpoint | Method | Authentication | Permission | Description | Future Version |
|----------|--------|----------------|------------|-------------|----------------|
| `/api/v1/employees/{employeeId}/bank-accounts` | GET | Bearer | `employee_bank:read` | List bank accounts (masked) | v1 |
| `/api/v1/employees/{employeeId}/bank-accounts` | POST | Bearer | `employee_bank:create` | Add bank account | v1 |
| `/api/v1/employees/{employeeId}/bank-accounts/{id}` | PATCH | Bearer | `employee_bank:update` | Update bank account | v1 |
| `/api/v1/employees/{employeeId}/bank-accounts/{id}` | DELETE | Bearer | `employee_bank:delete` | Remove bank account | v1 |

---

## Shifts

| Endpoint | Method | Authentication | Permission | Description | Future Version |
|----------|--------|----------------|------------|-------------|----------------|
| `/api/v1/shifts` | GET | Bearer | `shifts:read` | List shift definitions | v1 |
| `/api/v1/shifts` | POST | Bearer | `shifts:create` | Create shift definition | v1 |
| `/api/v1/shifts/{id}` | GET | Bearer | `shifts:read` | Get shift by ID | v1 |
| `/api/v1/shifts/{id}` | PATCH | Bearer | `shifts:update` | Update shift | v1 |
| `/api/v1/shifts/{id}` | DELETE | Bearer | `shifts:delete` | Soft-delete shift | v1 |
| `/api/v1/shift-assignments` | GET | Bearer | `shifts:read` | List shift assignments | v1 |
| `/api/v1/shift-assignments` | POST | Bearer | `shifts:assign` | Assign shift to employee | v1 |
| `/api/v1/shift-assignments/{id}` | DELETE | Bearer | `shifts:assign` | Remove shift assignment | v1 |
| `/api/v1/shift-swap-requests` | POST | Bearer | — | Request shift swap with colleague | v2 |

---

## Attendance

| Endpoint | Method | Authentication | Permission | Description | Future Version |
|----------|--------|----------------|------------|-------------|----------------|
| `/api/v1/attendance/clock-in` | POST | Bearer | — | Clock in (self or on behalf if permitted) | v1 |
| `/api/v1/attendance/clock-out` | POST | Bearer | — | Clock out | v1 |
| `/api/v1/attendance/records` | GET | Bearer | `attendance:read` | List attendance records with filters | v1 |
| `/api/v1/attendance/records/{id}` | GET | Bearer | `attendance:read` | Get attendance record | v1 |
| `/api/v1/attendance/records` | POST | Bearer | `attendance:create` | Manual attendance entry | v1 |
| `/api/v1/attendance/records/{id}` | PATCH | Bearer | `attendance:update` | Correct attendance record | v1 |
| `/api/v1/attendance/summary` | GET | Bearer | `attendance:read` | Daily/weekly/monthly attendance summary | v1 |
| `/api/v1/attendance/import` | POST | Bearer | `attendance:import` | Bulk import attendance (async job) | v1 |
| `/api/v1/attendance/records/{id}/geo` | GET | Bearer | `attendance:read` | Get geo location audit for clock event | v2 |

---

## Leave Types

| Endpoint | Method | Authentication | Permission | Description | Future Version |
|----------|--------|----------------|------------|-------------|----------------|
| `/api/v1/leave-types` | GET | Bearer | `leave_types:read` | List leave types | v1 |
| `/api/v1/leave-types` | POST | Bearer | `leave_types:create` | Create leave type | v1 |
| `/api/v1/leave-types/{id}` | GET | Bearer | `leave_types:read` | Get leave type by ID | v1 |
| `/api/v1/leave-types/{id}` | PATCH | Bearer | `leave_types:update` | Update leave type | v1 |
| `/api/v1/leave-types/{id}` | DELETE | Bearer | `leave_types:delete` | Soft-delete leave type | v1 |

---

## Leave Policies

| Endpoint | Method | Authentication | Permission | Description | Future Version |
|----------|--------|----------------|------------|-------------|----------------|
| `/api/v1/leave-policies` | GET | Bearer | `leave_policies:read` | List leave policies | v1 |
| `/api/v1/leave-policies` | POST | Bearer | `leave_policies:create` | Create leave policy | v1 |
| `/api/v1/leave-policies/{id}` | GET | Bearer | `leave_policies:read` | Get leave policy by ID | v1 |
| `/api/v1/leave-policies/{id}` | PATCH | Bearer | `leave_policies:update` | Update leave policy | v1 |
| `/api/v1/leave-policies/{id}` | DELETE | Bearer | `leave_policies:delete` | Soft-delete leave policy | v1 |

---

## Leave Requests

| Endpoint | Method | Authentication | Permission | Description | Future Version |
|----------|--------|----------------|------------|-------------|----------------|
| `/api/v1/leave-requests` | GET | Bearer | `leave_requests:read` | List leave requests | v1 |
| `/api/v1/leave-requests` | POST | Bearer | `leave_requests:create` | Submit leave request | v1 |
| `/api/v1/leave-requests/{id}` | GET | Bearer | `leave_requests:read` | Get leave request by ID | v1 |
| `/api/v1/leave-requests/{id}` | PATCH | Bearer | `leave_requests:update` | Update pending leave request | v1 |
| `/api/v1/leave-requests/{id}/cancel` | POST | Bearer | `leave_requests:cancel` | Cancel leave request | v1 |
| `/api/v1/leave-requests/{id}/approve` | POST | Bearer | `leave_requests:approve` | Approve leave request | v1 |
| `/api/v1/leave-requests/{id}/reject` | POST | Bearer | `leave_requests:approve` | Reject leave request | v1 |
| `/api/v1/leave-requests/pending-approvals` | GET | Bearer | `leave_requests:approve` | List pending approvals for current user | v1 |

---

## Leave Balances

| Endpoint | Method | Authentication | Permission | Description | Future Version |
|----------|--------|----------------|------------|-------------|----------------|
| `/api/v1/leave-balances` | GET | Bearer | `leave_balances:read` | List leave balances by employee/type | v1 |
| `/api/v1/employees/{employeeId}/leave-balances` | GET | Bearer | `leave_balances:read` | Get balances for one employee | v1 |
| `/api/v1/leave-balances/ledger` | GET | Bearer | `leave_balances:read` | Query balance ledger entries | v1 |
| `/api/v1/leave-balances/adjust` | POST | Bearer | `leave_balances:adjust` | Manual balance adjustment with reason | v1 |

---

## Salary Structures

| Endpoint | Method | Authentication | Permission | Description | Future Version |
|----------|--------|----------------|------------|-------------|----------------|
| `/api/v1/salary-structures` | GET | Bearer | `salary_structures:read` | List salary structures | v1 |
| `/api/v1/salary-structures` | POST | Bearer | `salary_structures:create` | Create salary structure with components | v1 |
| `/api/v1/salary-structures/{id}` | GET | Bearer | `salary_structures:read` | Get salary structure by ID | v1 |
| `/api/v1/salary-structures/{id}` | PATCH | Bearer | `salary_structures:update` | Update salary structure | v1 |
| `/api/v1/salary-structures/{id}` | DELETE | Bearer | `salary_structures:delete` | Soft-delete salary structure | v1 |

---

## Employee Compensation

| Endpoint | Method | Authentication | Permission | Description | Future Version |
|----------|--------|----------------|------------|-------------|----------------|
| `/api/v1/employees/{employeeId}/compensation` | GET | Bearer | `compensation:read` | Get current compensation assignment | v1 |
| `/api/v1/employees/{employeeId}/compensation` | PUT | Bearer | `compensation:update` | Assign or update compensation | v1 |
| `/api/v1/employees/{employeeId}/compensation/history` | GET | Bearer | `compensation:read` | List compensation revision history | v1 |
| `/api/v1/compensation/revisions` | GET | Bearer | `compensation:read` | List all compensation revisions | v1 |
| `/api/v1/compensation/revisions/{id}` | GET | Bearer | `compensation:read` | Get single revision detail | v1 |

---

## Tax Config

| Endpoint | Method | Authentication | Permission | Description | Future Version |
|----------|--------|----------------|------------|-------------|----------------|
| `/api/v1/tax-configs` | GET | Bearer | `tax_config:read` | List tax configurations by region | v1 |
| `/api/v1/tax-configs` | POST | Bearer | `tax_config:create` | Create tax configuration | v1 |
| `/api/v1/tax-configs/{id}` | GET | Bearer | `tax_config:read` | Get tax config by ID | v1 |
| `/api/v1/tax-configs/{id}` | PATCH | Bearer | `tax_config:update` | Update tax slabs and statutory rules | v1 |
| `/api/v1/tax-configs/{id}` | DELETE | Bearer | `tax_config:delete` | Soft-delete tax config | v1 |

---

## Payroll Runs

| Endpoint | Method | Authentication | Permission | Description | Future Version |
|----------|--------|----------------|------------|-------------|----------------|
| `/api/v1/payroll-runs` | GET | Bearer | `payroll:read` | List payroll runs | v1 |
| `/api/v1/payroll-runs` | POST | Bearer | `payroll:create` | Create draft payroll run (requires Idempotency-Key) | v1 |
| `/api/v1/payroll-runs/{id}` | GET | Bearer | `payroll:read` | Get payroll run by ID | v1 |
| `/api/v1/payroll-runs/{id}` | DELETE | Bearer | `payroll:delete` | Cancel draft payroll run | v1 |
| `/api/v1/payroll-runs/{id}/process` | POST | Bearer | `payroll:process` | Start async payroll calculation job | v1 |
| `/api/v1/payroll-runs/{id}/finalize` | POST | Bearer | `payroll:finalize` | Finalize payroll (immutable; requires Idempotency-Key) | v1 |
| `/api/v1/payroll-runs/{id}/line-items` | GET | Bearer | `payroll:read` | List payroll line items for run | v1 |
| `/api/v1/payroll-runs/{id}/line-items/{employeeId}` | GET | Bearer | `payroll:read` | Get line item for one employee | v1 |
| `/api/v1/payroll-runs/{id}/register/export` | POST | Bearer | `payroll:export` | Export payroll register (async job) | v1 |

---

## Payslips

| Endpoint | Method | Authentication | Permission | Description | Future Version |
|----------|--------|----------------|------------|-------------|----------------|
| `/api/v1/payslips` | GET | Bearer | `payslips:read` | List payslips with filters | v1 |
| `/api/v1/payslips/{id}` | GET | Bearer | `payslips:read` | Get payslip by ID | v1 |
| `/api/v1/payslips/{id}/download` | GET | Bearer | `payslips:read` | Download payslip PDF | v1 |
| `/api/v1/employees/{employeeId}/payslips` | GET | Bearer | `payslips:read` | List payslips for employee | v1 |
| `/api/v1/payslips/me` | GET | Bearer | — | List own payslips (self-service) | v1 |

---

## Payroll Adjustments

| Endpoint | Method | Authentication | Permission | Description | Future Version |
|----------|--------|----------------|------------|-------------|----------------|
| `/api/v1/payroll-adjustments` | GET | Bearer | `payroll_adjustments:read` | List payroll adjustments | v1 |
| `/api/v1/payroll-adjustments` | POST | Bearer | `payroll_adjustments:create` | Create bonus, deduction, or arrear | v1 |
| `/api/v1/payroll-adjustments/{id}` | GET | Bearer | `payroll_adjustments:read` | Get adjustment by ID | v1 |
| `/api/v1/payroll-adjustments/{id}` | PATCH | Bearer | `payroll_adjustments:update` | Update pending adjustment | v1 |
| `/api/v1/payroll-adjustments/{id}` | DELETE | Bearer | `payroll_adjustments:delete` | Delete pending adjustment | v1 |

---

## Chart of Accounts

| Endpoint | Method | Authentication | Permission | Description | Future Version |
|----------|--------|----------------|------------|-------------|----------------|
| `/api/v1/chart-of-accounts` | GET | Bearer | `coa:read` | List accounts (tree or flat) | v1 |
| `/api/v1/chart-of-accounts` | POST | Bearer | `coa:create` | Create account | v1 |
| `/api/v1/chart-of-accounts/{id}` | GET | Bearer | `coa:read` | Get account by ID | v1 |
| `/api/v1/chart-of-accounts/{id}` | PATCH | Bearer | `coa:update` | Update account | v1 |
| `/api/v1/chart-of-accounts/{id}` | DELETE | Bearer | `coa:delete` | Soft-delete account | v1 |

---

## Journal Entries

| Endpoint | Method | Authentication | Permission | Description | Future Version |
|----------|--------|----------------|------------|-------------|----------------|
| `/api/v1/journal-entries` | GET | Bearer | `journal_entries:read` | List journal entries | v1 |
| `/api/v1/journal-entries` | POST | Bearer | `journal_entries:create` | Create draft journal entry | v1 |
| `/api/v1/journal-entries/{id}` | GET | Bearer | `journal_entries:read` | Get journal entry with lines | v1 |
| `/api/v1/journal-entries/{id}` | PATCH | Bearer | `journal_entries:update` | Update draft entry | v1 |
| `/api/v1/journal-entries/{id}/post` | POST | Bearer | `journal_entries:post` | Post entry to ledger (immutable) | v1 |
| `/api/v1/journal-entries/{id}/reverse` | POST | Bearer | `journal_entries:reverse` | Create reversal entry | v2 |

---

## Invoices

| Endpoint | Method | Authentication | Permission | Description | Future Version |
|----------|--------|----------------|------------|-------------|----------------|
| `/api/v1/invoices` | GET | Bearer | `invoices:read` | List invoices | v1 |
| `/api/v1/invoices` | POST | Bearer | `invoices:create` | Create draft invoice | v1 |
| `/api/v1/invoices/{id}` | GET | Bearer | `invoices:read` | Get invoice by ID | v1 |
| `/api/v1/invoices/{id}` | PATCH | Bearer | `invoices:update` | Update draft invoice | v1 |
| `/api/v1/invoices/{id}/send` | POST | Bearer | `invoices:send` | Mark invoice sent | v1 |
| `/api/v1/invoices/{id}/void` | POST | Bearer | `invoices:void` | Void invoice | v1 |
| `/api/v1/invoices/{id}/pdf` | GET | Bearer | `invoices:read` | Download invoice PDF | v2 |

---

## Payments

| Endpoint | Method | Authentication | Permission | Description | Future Version |
|----------|--------|----------------|------------|-------------|----------------|
| `/api/v1/payments` | GET | Bearer | `payments:read` | List payments | v1 |
| `/api/v1/payments` | POST | Bearer | `payments:create` | Record payment (requires Idempotency-Key) | v1 |
| `/api/v1/payments/{id}` | GET | Bearer | `payments:read` | Get payment by ID | v1 |
| `/api/v1/payments/{id}/reconcile` | POST | Bearer | `payments:reconcile` | Reconcile payment with invoice | v1 |
| `/api/v1/payments/gateway/callback` | POST | None | Public | Payment gateway webhook callback | v2 |

---

## Expenses

| Endpoint | Method | Authentication | Permission | Description | Future Version |
|----------|--------|----------------|------------|-------------|----------------|
| `/api/v1/expense-claims` | GET | Bearer | `expenses:read` | List expense claims | v1 |
| `/api/v1/expense-claims` | POST | Bearer | `expenses:create` | Submit expense claim | v1 |
| `/api/v1/expense-claims/{id}` | GET | Bearer | `expenses:read` | Get expense claim by ID | v1 |
| `/api/v1/expense-claims/{id}` | PATCH | Bearer | `expenses:update` | Update draft claim | v1 |
| `/api/v1/expense-claims/{id}/submit` | POST | Bearer | `expenses:submit` | Submit claim for approval | v1 |
| `/api/v1/expense-claims/{id}/approve` | POST | Bearer | `expenses:approve` | Approve expense claim | v1 |
| `/api/v1/expense-claims/{id}/reject` | POST | Bearer | `expenses:approve` | Reject expense claim | v1 |
| `/api/v1/expense-claims/{id}/reimburse` | POST | Bearer | `expenses:reimburse` | Mark claim reimbursed | v1 |

---

## Finance Reports

| Endpoint | Method | Authentication | Permission | Description | Future Version |
|----------|--------|----------------|------------|-------------|----------------|
| `/api/v1/finance-reports/trial-balance` | GET | Bearer | `finance_reports:read` | Trial balance as of date | v1 |
| `/api/v1/finance-reports/ledger` | GET | Bearer | `finance_reports:read` | Account ledger extract | v1 |
| `/api/v1/finance-reports/profit-loss` | GET | Bearer | `finance_reports:read` | Profit and loss statement | v2 |
| `/api/v1/finance-reports/balance-sheet` | GET | Bearer | `finance_reports:read` | Balance sheet | v2 |

---

## Items

| Endpoint | Method | Authentication | Permission | Description | Future Version |
|----------|--------|----------------|------------|-------------|----------------|
| `/api/v1/items` | GET | Bearer | `items:read` | List items | v1 |
| `/api/v1/items` | POST | Bearer | `items:create` | Create item | v1 |
| `/api/v1/items/{id}` | GET | Bearer | `items:read` | Get item by ID | v1 |
| `/api/v1/items/{id}` | PATCH | Bearer | `items:update` | Update item | v1 |
| `/api/v1/items/{id}` | DELETE | Bearer | `items:delete` | Soft-delete item | v1 |

---

## Warehouses

| Endpoint | Method | Authentication | Permission | Description | Future Version |
|----------|--------|----------------|------------|-------------|----------------|
| `/api/v1/warehouses` | GET | Bearer | `warehouses:read` | List warehouses | v1 |
| `/api/v1/warehouses` | POST | Bearer | `warehouses:create` | Create warehouse | v1 |
| `/api/v1/warehouses/{id}` | GET | Bearer | `warehouses:read` | Get warehouse by ID | v1 |
| `/api/v1/warehouses/{id}` | PATCH | Bearer | `warehouses:update` | Update warehouse | v1 |
| `/api/v1/warehouses/{id}` | DELETE | Bearer | `warehouses:delete` | Soft-delete warehouse | v1 |

---

## Stock

| Endpoint | Method | Authentication | Permission | Description | Future Version |
|----------|--------|----------------|------------|-------------|----------------|
| `/api/v1/stock/levels` | GET | Bearer | `stock:read` | List stock levels by item/warehouse | v1 |
| `/api/v1/stock/movements` | GET | Bearer | `stock:read` | List stock movement history | v1 |
| `/api/v1/stock/movements` | POST | Bearer | `stock:adjust` | Record stock adjustment | v1 |
| `/api/v1/stock/transfer` | POST | Bearer | `stock:transfer` | Transfer stock between warehouses | v1 |
| `/api/v1/stock/issue` | POST | Bearer | `stock:issue` | Issue stock from warehouse | v1 |
| `/api/v1/stock/receive` | POST | Bearer | `stock:receive` | Receive stock into warehouse | v1 |
| `/api/v1/stock/alerts` | GET | Bearer | `stock:read` | List low-stock alerts | v1 |

---

## Suppliers

| Endpoint | Method | Authentication | Permission | Description | Future Version |
|----------|--------|----------------|------------|-------------|----------------|
| `/api/v1/suppliers` | GET | Bearer | `suppliers:read` | List suppliers | v1 |
| `/api/v1/suppliers` | POST | Bearer | `suppliers:create` | Create supplier | v1 |
| `/api/v1/suppliers/{id}` | GET | Bearer | `suppliers:read` | Get supplier by ID | v1 |
| `/api/v1/suppliers/{id}` | PATCH | Bearer | `suppliers:update` | Update supplier | v1 |
| `/api/v1/suppliers/{id}` | DELETE | Bearer | `suppliers:delete` | Soft-delete supplier | v1 |

---

## Purchase Orders

| Endpoint | Method | Authentication | Permission | Description | Future Version |
|----------|--------|----------------|------------|-------------|----------------|
| `/api/v1/purchase-orders` | GET | Bearer | `purchase_orders:read` | List purchase orders | v1 |
| `/api/v1/purchase-orders` | POST | Bearer | `purchase_orders:create` | Create draft PO | v1 |
| `/api/v1/purchase-orders/{id}` | GET | Bearer | `purchase_orders:read` | Get PO by ID | v1 |
| `/api/v1/purchase-orders/{id}` | PATCH | Bearer | `purchase_orders:update` | Update draft PO | v1 |
| `/api/v1/purchase-orders/{id}/submit` | POST | Bearer | `purchase_orders:submit` | Submit PO for approval | v1 |
| `/api/v1/purchase-orders/{id}/approve` | POST | Bearer | `purchase_orders:approve` | Approve PO | v1 |
| `/api/v1/purchase-orders/{id}/reject` | POST | Bearer | `purchase_orders:approve` | Reject PO | v1 |
| `/api/v1/purchase-orders/{id}/receive` | POST | Bearer | `purchase_orders:receive` | Record goods receipt | v1 |
| `/api/v1/purchase-orders/{id}/close` | POST | Bearer | `purchase_orders:close` | Close completed PO | v1 |

---

## Workflows

| Endpoint | Method | Authentication | Permission | Description | Future Version |
|----------|--------|----------------|------------|-------------|----------------|
| `/api/v1/workflow-definitions` | GET | Bearer | `workflows:read` | List workflow definitions | v1 |
| `/api/v1/workflow-definitions` | POST | Bearer | `workflows:create` | Create approval workflow template | v1 |
| `/api/v1/workflow-definitions/{id}` | GET | Bearer | `workflows:read` | Get workflow definition | v1 |
| `/api/v1/workflow-definitions/{id}` | PATCH | Bearer | `workflows:update` | Update workflow definition | v1 |
| `/api/v1/workflow-instances` | GET | Bearer | `workflows:read` | List workflow instances | v1 |
| `/api/v1/workflow-instances/{id}` | GET | Bearer | `workflows:read` | Get instance with step history | v1 |
| `/api/v1/workflow-instances/{id}/approve` | POST | Bearer | `workflows:approve` | Approve current step | v1 |
| `/api/v1/workflow-instances/{id}/reject` | POST | Bearer | `workflows:approve` | Reject current step | v1 |
| `/api/v1/workflow-instances/{id}/delegate` | POST | Bearer | `workflows:delegate` | Delegate approval to another user | v1 |

---

## Notifications

| Endpoint | Method | Authentication | Permission | Description | Future Version |
|----------|--------|----------------|------------|-------------|----------------|
| `/api/v1/notifications` | GET | Bearer | — | List notifications for current user | v1 |
| `/api/v1/notifications/unread-count` | GET | Bearer | — | Get unread notification count | v1 |
| `/api/v1/notifications/{id}` | GET | Bearer | — | Get notification by ID | v1 |
| `/api/v1/notifications/{id}/read` | PATCH | Bearer | — | Mark notification as read | v1 |
| `/api/v1/notifications/read-all` | POST | Bearer | — | Mark all notifications as read | v1 |
| `/api/v1/notifications/preferences` | GET | Bearer | — | Get notification preferences | v1 |
| `/api/v1/notifications/preferences` | PUT | Bearer | — | Update notification preferences | v1 |

---

## Templates

| Endpoint | Method | Authentication | Permission | Description | Future Version |
|----------|--------|----------------|------------|-------------|----------------|
| `/api/v1/templates` | GET | Bearer | `templates:read` | List templates by channel | v1 |
| `/api/v1/templates` | POST | Bearer | `templates:create` | Create email/PDF template | v1 |
| `/api/v1/templates/{id}` | GET | Bearer | `templates:read` | Get template by ID | v1 |
| `/api/v1/templates/{id}` | PATCH | Bearer | `templates:update` | Update template | v1 |
| `/api/v1/templates/{id}/preview` | POST | Bearer | `templates:read` | Preview rendered template | v2 |

---

## Documents

| Endpoint | Method | Authentication | Permission | Description | Future Version |
|----------|--------|----------------|------------|-------------|----------------|
| `/api/v1/documents` | GET | Bearer | `documents:read` | List documents by owner/type | v1 |
| `/api/v1/documents` | POST | Bearer | `documents:create` | Upload generic document | v1 |
| `/api/v1/documents/{id}` | GET | Bearer | `documents:read` | Get document metadata | v1 |
| `/api/v1/documents/{id}/download` | GET | Bearer | `documents:read` | Download document (signed URL) | v1 |
| `/api/v1/documents/{id}/versions` | GET | Bearer | `documents:read` | List document versions | v1 |
| `/api/v1/documents/{id}` | DELETE | Bearer | `documents:delete` | Soft-delete document | v1 |

---

## Dashboards

| Endpoint | Method | Authentication | Permission | Description | Future Version |
|----------|--------|----------------|------------|-------------|----------------|
| `/api/v1/dashboards` | GET | Bearer | `dashboards:read` | Get role-based dashboard with KPI widgets | v1 |
| `/api/v1/dashboards/config` | GET | Bearer | `dashboards:read` | Get dashboard layout config | v1 |
| `/api/v1/dashboards/config` | PUT | Bearer | `dashboards:configure` | Save custom dashboard layout | v2 |
| `/api/v1/dashboards/widgets/{widgetId}` | GET | Bearer | `dashboards:read` | Get single widget data | v1 |

---

## Reports

| Endpoint | Method | Authentication | Permission | Description | Future Version |
|----------|--------|----------------|------------|-------------|----------------|
| `/api/v1/reports/definitions` | GET | Bearer | `reports:read` | List available report definitions | v1 |
| `/api/v1/reports/definitions/{code}` | GET | Bearer | `reports:read` | Get report definition and parameters | v1 |
| `/api/v1/reports/run` | POST | Bearer | `reports:run` | Execute report (sync or async) | v1 |
| `/api/v1/reports/runs` | GET | Bearer | `reports:read` | List report execution history | v1 |
| `/api/v1/reports/runs/{id}` | GET | Bearer | `reports:read` | Get report run status and result | v1 |
| `/api/v1/reports/schedules` | POST | Bearer | `reports:schedule` | Schedule recurring report | v2 |

---

## Exports

| Endpoint | Method | Authentication | Permission | Description | Future Version |
|----------|--------|----------------|------------|-------------|----------------|
| `/api/v1/exports` | POST | Bearer | `exports:create` | Request data export (async job) | v1 |
| `/api/v1/exports` | GET | Bearer | `exports:read` | List export jobs | v1 |
| `/api/v1/exports/{id}` | GET | Bearer | `exports:read` | Get export job status | v1 |
| `/api/v1/exports/{id}/download` | GET | Bearer | `exports:read` | Download export file | v1 |

---

## Analytics

| Endpoint | Method | Authentication | Permission | Description | Future Version |
|----------|--------|----------------|------------|-------------|----------------|
| `/api/v1/analytics/headcount` | GET | Bearer | `analytics:read` | Headcount trends and breakdown | v1 |
| `/api/v1/analytics/attrition` | GET | Bearer | `analytics:read` | Attrition rate and analysis | v1 |
| `/api/v1/analytics/payroll-cost` | GET | Bearer | `analytics:read` | Payroll cost summary | v1 |
| `/api/v1/analytics/attendance-rate` | GET | Bearer | `analytics:read` | Attendance rate metrics | v1 |

---

## Enterprise Integration Platform

**Base path:** `/api/v1/integration`  
**Module:** `backend/src/modules/integration/`  
**Authentication:** Bearer · **Permissions:** `system.config.read`, `system.config.manage`, `settings.manage`

### Dashboard

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/dashboard` | read | Super Admin integration dashboard aggregates |

### Connectors (Integration Center)

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/connectors` | read | List connectors (Cloudinary, SMTP, Webhook, REST API, future types) |
| POST | `/connectors` | manage | Create connector |
| PATCH | `/connectors/:id` | manage | Update connector config / enable-disable |
| DELETE | `/connectors/:id` | manage | Delete connector |
| GET | `/connectors/:id/health` | read | Connection health, last sync, last error |
| POST | `/connectors/:id/test` | manage | Test connector connection |

### API Keys

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api-keys` | read | List API keys (masked) |
| POST | `/api-keys` | manage | Create API key with permissions and expiry |
| POST | `/api-keys/:id/rotate` | manage | Rotate key secret |
| POST | `/api-keys/:id/revoke` | manage | Revoke key |
| POST | `/api-keys/:id/regenerate` | manage | Regenerate key |
| GET | `/api-keys/:id/usage` | read | Usage logs and last used |

### Webhooks

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/webhooks` | read | List webhook subscriptions |
| POST | `/webhooks` | manage | Create webhook with secret, events, retry policy |
| PATCH | `/webhooks/:id` | manage | Update webhook config / enable-disable |
| DELETE | `/webhooks/:id` | manage | Delete webhook |
| GET | `/webhooks/:id/deliveries` | read | Delivery logs and payload history |
| POST | `/webhooks/:id/test` | manage | Send test webhook event |

### Import Engine

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/import/templates/:module` | read | Download import template (organization, employee, sales_lead, recruitment) |
| POST | `/import/preview` | manage | Validate CSV and preview with error report |
| POST | `/import/execute` | manage | Execute import with rollback on failure |
| GET | `/import/history` | read | Import job history |
| GET | `/import/:id` | read | Import job detail |

### Export Engine

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| POST | `/export` | manage | Create export job (CSV/PDF/XLSX, filters, columns) |
| GET | `/export/history` | read | Export job history |
| GET | `/export/:id/download` | read | Download export file |

### Scheduler

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/scheduler/jobs` | read | List scheduled jobs |
| POST | `/scheduler/jobs` | manage | Create recurring cron job |
| PATCH | `/scheduler/jobs/:id` | manage | Update job / enable-disable |
| POST | `/scheduler/jobs/:id/run` | manage | Run job immediately |
| GET | `/scheduler/history` | read | Job execution history |

### Integration Logs

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/logs` | read | Unified logs with search and filters |
| GET | `/logs/export` | read | Export logs (CSV) |

### Backup & Restore

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/backups` | read | Backup history |
| POST | `/backups` | manage | Create manual settings backup |
| GET | `/backups/:id` | read | Backup detail and verification status |

---

## Jobs (Async Status)

| Endpoint | Method | Authentication | Permission | Description | Future Version |
|----------|--------|----------------|------------|-------------|----------------|
| `/api/v1/jobs/{id}` | GET | Bearer | — | Get async job status and progress | v1 |
| `/api/v1/jobs/{id}/result` | GET | Bearer | — | Get job result when completed | v1 |
| `/api/v1/jobs/{id}/cancel` | POST | Bearer | — | Cancel pending job if cancellable | v2 |

---

---

## Universal Approval Engine

**Base path:** `/api/v1/approvals`  
**Module:** `backend/src/modules/approval/`  
**Authentication:** Bearer · **Permissions:** `approval.*`, `workflow.*`

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/requests` | `approval.read` | List all approval requests (paginated, filter by status/requestType) |
| GET | `/inbox` | `approval.read` | Pending approvals for current approver |
| GET | `/requests/:id/history` | `approval.read` | Request detail, timeline, and action history |
| POST | `/requests/:id/approve` | `approval.execute` | Approve current stage (advances workflow or completes) |
| POST | `/requests/:id/reject` | `approval.execute` | Reject request (terminal) |
| POST | `/requests/:id/escalate` | `approval.escalate` | Escalate to next hierarchy level |
| POST | `/requests/:id/comments` | `approval.read` | Add comment to timeline |
| POST | `/requests/bulk-approve` | `approval.bulk` | Bulk approve multiple pending requests |
| GET | `/workflows` | `workflow.read` | List configurable approval workflows |
| POST | `/workflows` | `workflow.manage` | Create workflow with ordered stages |
| GET | `/workflows/:id` | `workflow.read` | Get workflow by ID |
| PATCH | `/workflows/:id` | `workflow.manage` | Update workflow stages/metadata |

**Engine features:** request type, entity type/ID, multi-stage workflow, approver resolution (manager, role, employee, hierarchy level), timeline, SLA fields, escalation, delegation-ready schema, entity sync on terminal decision.

**Default workflows (seeded):** `leave-default`, `resignation-default`, `exit-default`

---

## Leave & Exit Management

**Base path:** `/api/v1/leave-exit`  
**Module:** `backend/src/modules/leave-exit/`  
**Authentication:** Bearer · **Permissions:** `leave.*`, `leave.policy.*`, `leave.balance.*`, `resignation.*`, `exit.*`

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| POST | `/seed-defaults` | `leave.policy.manage` | Seed default workflows + exit checklist templates |
| GET | `/policies` | `leave.policy.read` | List leave policies |
| POST | `/policies` | `leave.policy.manage` | Create leave policy |
| GET | `/balances` | `leave.balance.read` | Employee leave balances (self or `?employeeId=`) |
| POST | `/balances/adjust` | `leave.balance.manage` | Manual balance adjustment with audit |
| GET | `/leave-requests` | `leave.read` | List leave requests (paginated) |
| POST | `/leave-requests` | `leave.create` | Apply leave (routes through approval engine) |
| POST | `/leave-requests/:id/withdraw` | `leave.update` | Withdraw pending leave |
| GET | `/leave-requests/calendar` | `leave.read` | Approved/pending leave calendar view |
| GET | `/calendar` | `leave.calendar.read` | Company calendar (holidays, leave, birthdays, anniversaries) |
| GET | `/resignations` | `resignation.read` | List resignations |
| POST | `/resignations` | `resignation.create` | Submit resignation (approval workflow) |
| POST | `/resignations/:id/withdraw` | `resignation.update` | Withdraw before acceptance |
| GET | `/exit/templates` | `exit.read` | Exit checklist templates |
| GET | `/exit/processes/:id` | `exit.read` | Exit process with checklist items |
| POST | `/exit/checklist/:id/complete` | `exit.manage` | Complete clearance item |
| GET | `/full-final` | `exit.read` | Full & final preparation data (no payroll calc) |

**Notifications published:** Leave Applied/Approved/Rejected, Resignation Submitted, Exit Started/Completed, Approval Pending/Escalated.

**Frontend routes:** `/leave-exit/*`, `/approvals/inbox`, `/approvals/history`, `/approvals/workflows`

---

## Authentication & Portal (Public + Session)

**Auth base:** `/api/v1/auth`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/login` | Public | Authenticate |
| POST | `/refresh` | Public | Refresh tokens |
| POST | `/forgot-password` | Public | Request reset email |
| POST | `/reset-password` | Public | Reset with token |
| GET | `/system/status` | Public | Bootstrap initialized flag |
| GET | `/me` | Bearer | Current user + permissions |
| GET | `/sessions` | Bearer | Active sessions |
| GET | `/sessions/history` | Bearer | Session history |
| POST | `/sessions/:sessionId/revoke` | Bearer | Logout device |

**Portal base:** `/api/v1/portal` (public, token-validated)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/onboarding/:token` | Load onboarding portal state |
| PUT | `/onboarding/:token/draft` | Save draft section |
| POST | `/onboarding/:token/submit` | Submit onboarding (consumes token) |
| GET | `/account-activation/:token/status` | Activation link status |
| POST | `/account-activation/:token/activate` | Set password & activate |

**Employee activation (HR):** `POST /api/v1/employees/:employeeId/activate-account`

**Recruitment portal link:** `POST /api/v1/recruitment/onboarding/:candidateId/portal-link`

**Frontend public routes:** `/login`, `/forgot-password`, `/reset-password/:token`, `/onboarding/:secureToken`, `/account-activation/:secureToken`

---

## Permission Registry (Reference)

Core permissions referenced across modules:

| Permission | Module |
|------------|--------|
| `employees:read`, `employees:create`, `employees:update`, `employees:delete`, `employees:update_status`, `employees:import` | Employees |
| `payroll:read`, `payroll:create`, `payroll:process`, `payroll:finalize`, `payroll:export` | Payroll |
| `leave_requests:read`, `leave_requests:create`, `leave_requests:approve`, `leave_requests:cancel` | Leave |
| `attendance:read`, `attendance:create`, `attendance:update`, `attendance:import` | Attendance |
| `audit:read`, `audit:export` | Audit |
| `tenants:create`, `tenants:read`, `tenants:update`, `tenants:delete` | Tenants (super-admin) |

Full permission list maintained in application constants — extend as modules ship.

---

## Versioning Policy

| Version | Scope | Status |
|---------|-------|--------|
| `v1` | All endpoints in this registry | Current — MVP through full ERP |
| `v2` | Endpoints marked `Future Version: v2` | Planned — SSO, MFA, advanced finance, geo attendance, custom dashboards |

Breaking changes require new version prefix (`/api/v2/`). Non-breaking additions stay in `v1`.

---

## Related Documents

| Document | Contents |
|----------|----------|
| `.ai/constitution.md` | API standards §15, Swagger standards §16 |
| `.ai/architecture.md` | Auth flow, module communication |
| `.ai/database.md` | MongoDB collections backing each module |
| `.ai/modules.md` | Module tracker and MVP scope |

---

## Revision History

| Date | Change | Author |
|------|--------|--------|
| 2025-06-25 | Initial API registry — ~280 endpoints across 48 module groups | AI Agent |

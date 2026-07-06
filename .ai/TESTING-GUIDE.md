# HR Shakya ERP — End-to-End Testing Guide

**Date:** 2026-07-05  
**Purpose:** Manual QA checklist to verify every module and core flow before release  
**Environment:** Local dev (`npm run dev` in backend + frontend)

---

## 1. Prerequisites

### 1.1 Services

| Service | Command | Expected |
|---------|---------|----------|
| MongoDB | Running on `localhost:27017` | Connection OK in backend logs |
| Backend | `cd backend && npm run dev` | `Server listening on port 4000` |
| Frontend | `cd frontend && npm run dev` | Vite on `http://localhost:5173` |

Redis is optional locally (`REDIS_URL` empty). Queue features degrade gracefully.

### 1.2 Database state

- **Do not re-seed** if admin already exists (`sachannishchal@gmail.com`).
- Fresh DB only: `cd backend && npm run seed` (reads seed vars from `.env`).
- Until seeded, auth returns **503 System not initialized** (by design).

### 1.3 Test accounts

| Portal | Email | Notes |
|--------|-------|-------|
| Enterprise (Admin) | `sachannishchal@gmail.com` | Super Admin — full access |
| Manager | Create or assign Manager role to a test employee | Team-scoped views |
| Workspace | Any active employee login | Self-service portal |

Use the password from your `.env` seed config. If unknown, reset via DB or seed on a fresh database only.

### 1.4 Automated checks (run before manual QA)

```bash
cd backend && npm run typecheck && npm test
cd frontend && npm run typecheck && npm run build
```

All should pass.

---

## 2. Global smoke tests

| # | Step | Expected |
|---|------|----------|
| G1 | Open `http://localhost:5173` | Login page loads |
| G2 | Login as admin | Redirect to `/enterprise` dashboard |
| G3 | Sidebar shows single links: Recruitment, Leave, Attendance, Sales, Communication (no duplicate sub-menus) | Flat nav |
| G4 | Open browser DevTools → Network; navigate Employees | API calls return 200, not 404 |
| G5 | Logout | Redirect to login; token cleared |
| G6 | Open second tab, logout in first | Second tab eventually redirects on next API call |

---

## 3. Module test flows

### 3.1 Authentication & portals

| # | Flow | Steps | Expected |
|---|------|-------|----------|
| A1 | Login | Enter valid credentials → Submit | Dashboard loads, no console errors |
| A2 | Invalid login | Wrong password 5× | Account lock message (if configured) |
| A3 | Forgot password | `/forgot-password` → submit email | Success toast (email may be console in dev) |
| A4 | Portal resolution | Login as admin | Lands on Enterprise, not Manager/Workspace |
| A5 | Forbidden route | Workspace user opens `/rbac` | 403 or redirect to forbidden page |

---

### 3.2 Administration

| # | Flow | Steps | Expected |
|---|------|-------|----------|
| AD1 | Admin dashboard | Nav → Admin Dashboard | Widgets: headcount, org chart, recruitment, etc. |
| AD2 | Organization setup | Nav → Organization Setup → Company | Company profile loads |
| AD3 | Org chart | Organization Setup → Org Chart | Admin appears under HQ (not parallel dept) |
| AD4 | Master data | Organization Setup → Departments | List, create, edit entity |
| AD5 | Roles | Administration → Roles | Role list loads |
| AD6 | Permissions | Administration → Permissions | Matrix loads |
| AD7 | Approval inbox | Administration → Approval Inbox | Pending items or empty state |
| AD8 | Approval workflows | Administration → Approval Workflows | Workflow list loads |

---

### 3.3 Employees

| # | Flow | Steps | Expected |
|---|------|-------|----------|
| E1 | List | Nav → Employees | Paginated list |
| E2 | Create | New Employee → fill required fields → Save | Employee appears in list |
| E3 | Profile tabs | Open employee → Overview, Documents, Payroll, Roles | All tabs render |
| E4 | Payroll upload | Employee → Payroll tab → upload PDF payslip | Success toast; payslip in list |
| E5 | Compensation | Payroll tab → Assign salary | Compensation saved |
| E6 | Lifecycle | Archive / restore / deactivate | Status updates correctly |
| E7 | Roles | Roles & Access tab | Assign role, permissions effective after refresh |

---

### 3.4 Recruitment

| # | Flow | Steps | Expected |
|---|------|-------|----------|
| R1 | Dashboard | Nav → Recruitment | Stats, pipeline overview, RecruitmentNav tabs |
| R2 | Candidates | Dashboard nav → Candidates | List loads |
| R3 | Add candidate | Add Candidate button | Form saves, appears in list |
| R4 | Pipeline | Dashboard nav → Pipeline | Kanban board with stages |
| R5 | Interviews | Dashboard nav → Interviews | Calendar/list loads |
| R6 | Candidate detail | Open candidate | Detail page with timeline |

---

### 3.5 Leave & exit

| # | Flow | Steps | Expected |
|---|------|-------|----------|
| L1 | Admin dashboard | Nav → Leave | Leave-exit dashboard with stats |
| L2 | All requests | In-page nav → All Requests | Request list |
| L3 | Apply (workspace) | Login as employee → Leave | Leave requests page with sub-nav |
| L4 | Apply leave | Apply Leave → dates + type → Submit | Request pending |
| L5 | Approve | Admin → Leave → approve pending | Status approved |
| L6 | Balances | In-page nav → All Balances | Balance list |
| L7 | Policies | In-page nav → Policies | Policy list |
| L8 | Calendar | In-page nav → Leave Calendar | Calendar renders |
| L9 | Resignation | In-page nav → Resignations | List loads |

---

### 3.6 Attendance

| # | Flow | Steps | Expected |
|---|------|-------|----------|
| AT1 | Enterprise hub | Nav → Attendance | Redirects to admin/HR view based on role |
| AT2 | Policies tab | Attendance admin → Policies | Policy form loads |
| AT3 | Workspace check-in | Employee → Check In/Out | Check-in recorded |
| AT4 | Manager team | Manager → Team Attendance | Team view loads |
| AT5 | Reports | Direct URL `/attendance/reports` | Report page loads (analytics permission) |

---

### 3.7 Payroll (per-employee model)

| # | Flow | Steps | Expected |
|---|------|-------|----------|
| P1 | No sidebar section | Check nav | No standalone Payroll menu |
| P2 | Admin upload | Employees → [employee] → Payroll | Upload + compensation works |
| P3 | Self-service | Workspace → My Profile → Payroll | Own payslips visible |
| P4 | Legacy URL | Open `/payroll` | Redirects to `/employees` |
| P5 | Reports | `/payroll/reports` | Analytics report page |

---

### 3.8 Projects

| # | Flow | Steps | Expected |
|---|------|-------|----------|
| PR1 | Dashboard | Nav → Projects | Portfolio overview |
| PR2 | Create | New Project wizard | Project created |
| PR3 | Detail | Open project | Tasks, members, milestones |
| PR4 | Workspace | Employee → My Projects | Assigned projects visible |

---

### 3.9 Sales CRM

| # | Flow | Steps | Expected |
|---|------|-------|----------|
| S1 | Dashboard | Nav → Sales | Enterprise CRM with tabs |
| S2 | Pipeline | Overview / Pipelines tab | Pipeline board |
| S3 | Leads | Create lead | Lead appears |
| S4 | Manager view | Login as manager → Sales Team | Manager dashboard |
| S5 | Complete follow-up | Manager/Executive → mark follow-up done | No API error (PATCH completed) |
| S6 | Reports | `/sales/reports` | Report page loads |

---

### 3.10 Communication

| # | Flow | Steps | Expected |
|---|------|-------|----------|
| C1 | Dashboard | Nav → Communication | Tabs: Overview, Announcements, etc. |
| C2 | Announcement | Create + publish announcement | Appears in list |
| C3 | Workspace messages | Employee → Messages | Chat/messages load |
| C4 | Manager | Manager → Communication | Team communication page |
| C5 | Reports | `/communication/reports` | Report page loads |

---

### 3.11 Approvals

| # | Flow | Steps | Expected |
|---|------|-------|----------|
| AP1 | Inbox | Administration → Approval Inbox | Pending approvals |
| AP2 | Action | Approve / reject item | Status updates |
| AP3 | History | URL `/approvals/history` | History list |
| AP4 | Manager | Manager → Approvals | Same inbox, team scope |

---

### 3.12 Integrations & system

| # | Flow | Steps | Expected |
|---|------|-------|----------|
| I1 | Dashboard | System → Integrations | Metrics load |
| I2 | Connectors | Connectors → create/test/toggle | Toggle uses PATCH (no 404) |
| I3 | Import | Import Center → select module → preview CSV | Preview table |
| I4 | Import execute | Execute import | Job in history |
| I5 | Export | Export Center → create export | Download works |
| I6 | API keys | Create → rotate → revoke | Key lifecycle works |
| I7 | Webhooks | Register → test delivery | Test fires |
| I8 | Scheduler | Toggle job enable/disable | PATCH succeeds |
| I9 | Backups | Create manual backup | Appears in list |
| I10 | Logs | Integration logs | Paginated entries |

**Known limitations:** Backup verify button removed (backend has no verify endpoint). Webhook delivery retry re-triggers test webhook.

---

### 3.13 Workspace (employee self-service)

| # | Flow | Steps | Expected |
|---|------|-------|----------|
| W1 | Dashboard | Login as employee | Workspace dashboard |
| W2 | Profile | My Profile → all tabs | Overview, Payroll, documents, etc. |
| W3 | Leave | Leave → Apply / Requests / Balance | Sub-nav within page |
| W4 | Attendance | Check In/Out | Record saved |
| W5 | Tasks / Projects | My Tasks, My Projects | Scoped to employee |

---

## 4. Navigation regression checklist

After nav simplification, confirm these are **single links** (no dropdown children):

- [ ] Recruitment
- [ ] Leave
- [ ] Attendance
- [ ] Sales
- [ ] Communication
- [ ] No duplicate Administration section header
- [ ] No standalone Payroll nav item
- [ ] No "My Payslips" in workspace nav (payroll on profile)

Sub-features remain accessible **inside** each module dashboard via in-page tabs (RecruitmentNav, LeaveExitNav, etc.).

---

## 5. API health checks (optional curl)

Replace `TOKEN` with a valid access token from login response.

```bash
# Health
curl http://localhost:4000/health
curl http://localhost:4000/health/ready

# Auth me
curl -H "Authorization: Bearer TOKEN" http://localhost:4000/api/v1/auth/me

# Module samples
curl -H "Authorization: Bearer TOKEN" http://localhost:4000/api/v1/employees
curl -H "Authorization: Bearer TOKEN" http://localhost:4000/api/v1/recruitment/dashboard
curl -H "Authorization: Bearer TOKEN" http://localhost:4000/api/v1/leave-exit/requests
curl -H "Authorization: Bearer TOKEN" http://localhost:4000/api/v1/reports/dashboard/executive
```

---

## 6. Pass / fail criteria

**Pass:** All G1–G6 smoke tests pass; each module section has no blocking 404/500 on primary flows; typecheck + build + backend tests green.

**Fail (block release):** Auth broken, cross-tenant data visible, employee CRUD fails, payroll upload fails for admin, seed/login loop, or any Critical open item from `.ai/SYSTEM-AUDIT.md`.

---

## 7. Reporting issues

When logging a bug, include:

1. Portal (Enterprise / Manager / Workspace)
2. URL path
3. Network tab: failing request URL + status + response body
4. Console error (if any)
5. Steps to reproduce

---

## 8. Suggested test order (half-day QA)

1. Global smoke (15 min)
2. Auth + Admin + Organization (30 min)
3. Employees + Payroll on profile (45 min)
4. Recruitment + Leave + Attendance (45 min)
5. Projects + Sales + Communication (45 min)
6. Approvals + Integrations (30 min)
7. Workspace employee flows (30 min)
8. Navigation regression + edge URLs (15 min)

**Total:** ~4 hours for one tester covering all modules.

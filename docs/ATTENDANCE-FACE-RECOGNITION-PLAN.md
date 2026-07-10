# Attendance — Simple Design & External Punch Plan

**Status:** Phase 1–2 implemented

---

## External punch API (live)

```
POST /api/v1/attendance/external-punch
Header: x-api-key: <integration API key>

Body:
{
  "externalId": "uuid-from-face-db",
  "employeeNumber": "EMP001",
  "type": "check_in",
  "timestamp": "2026-07-10T09:02:00.000Z",
  "deviceCode": "GATE-01"
}
```

Create API key: **Integration → API Keys** in HR Shakya admin.

---

## 1. Simple idea

Attendance in HR Shakya = **two things only**:

| Layer | What it stores | Purpose |
|-------|----------------|---------|
| **Punch records** | Every check-in / check-out event | Raw truth from kiosk, web, or import |
| **Daily record** | One row per employee per day | First in, last out, present/late/absent |

Your **face recognition app** only sends **punch records**. HR Shakya builds the **daily record** from those punches (already mostly built).

```
Face app → punch record → HR Shakya DB → daily attendance → reports / payroll
```

No extra systems, no duplicate logic in the face app.

---

## 2. How HR Shakya attendance works (keep this)

**Already in the project — reuse, don’t rebuild:**

- `attendance_logs` — each punch (in, out)
- `attendances` — daily summary per employee
- `PunchService` — saves punch + updates daily record
- Shifts, policies, calendar, corrections — later phases

**Employee link:** use existing `employeeNumber` (e.g. `EMP001`).  
Face app stores the same code → HR finds the employee. No new ID system needed at start.

---

## 3. Minimal DB changes (punch data only)

Only extend **`attendance_logs`** so external punches are traceable and not duplicated.

| New field | Type | Why |
|-----------|------|-----|
| `source` | string | `'manual'` or `'external'` |
| `externalId` | string, optional | Unique id from face app DB (for dedup) |

**Optional later (not phase 1):**

| Field | Why |
|-------|-----|
| `deviceCode` | Which kiosk (e.g. `GATE-01`) |

Everything else stays the same: `employeeId`, `type`, `timestamp`, `deviceInfo`.

**Index:** unique on `(companyId, externalId)` when `externalId` is set — same punch never saved twice.

No new collections. No changes to `attendances` table in phase 1.

---

## 4. Face app DB (minimal)

You can keep your face app DB simple. Only need one punch table aligned with HR:

| Column | Example | Notes |
|--------|---------|-------|
| `id` | uuid | Send to HR as `externalId` |
| `employee_number` | EMP001 | Same as HR Shakya |
| `punch_type` | check_in / check_out | |
| `punched_at` | 2026-07-10 09:02:00 | UTC or IST — pick one, stay consistent |
| `synced` | true / false | Did HR receive it? |

Enrollment, camera, face matching — all stay inside your face app. HR doesn’t need face templates.

---

## 5. How external punches enter HR Shakya

**One simple path:** face app calls HR API after each successful punch.

```
POST /api/v1/attendance/external-punch
Header: x-api-key: <company key>

Body:
{
  "externalId": "uuid-from-face-db",
  "employeeNumber": "EMP001",
  "type": "check_in",
  "timestamp": "2026-07-10T09:02:00.000Z",
  "deviceCode": "GATE-01"
}
```

**What HR does internally:**

1. Find employee by `employeeNumber`
2. If `externalId` already exists → skip (return OK)
3. Call existing `PunchService.punch()` with `source: external`
4. Daily attendance updates automatically

**Auth:** API key per company (reuse integration API keys module). No employee login on kiosk.

That’s the whole integration for phase 1.

---

## 6. What each system does

| | Face recognition app | HR Shakya |
|--|----------------------|-----------|
| Camera & face match | ✅ | — |
| Store raw punches locally | ✅ | ✅ (after sync) |
| Employee master data | — | ✅ |
| Daily present/late/absent | — | ✅ |
| Reports & payroll month | — | ✅ |
| Web punch button (optional) | — | ✅ already exists |

---

## 7. Implementation plan (3 small phases)

### Phase 1 — External punch API (~1 week)

**Backend**

- Add `source` + `externalId` (+ optional `deviceCode`) on `attendance_logs`
- New route: `POST /attendance/external-punch` with API key
- Map `employeeNumber` → `employeeId`, then call `PunchService`

**Face app**

- After punch saved locally, POST to HR API
- On success, set `synced = true`
- Retry failed rows on next punch or every few minutes

**Done when:** One employee can punch at camera and see it in HR attendance.

---

### Phase 2 — Show it in UI (~1 week)

- Employee workspace: show punch list with source (Manual / Kiosk)
- Manager: team today (already exists — verify it reads synced punches)
- HR: simple “failed sync” is optional; can check face app DB manually at first

**Done when:** HR and employees see kiosk punches in the app.

---

### Phase 3 — Polish (when needed, not now)

Pick only what you actually need:

- Shift-based late/absent rules (calculator already there)
- Correction requests for wrong/missing punch
- Monthly payroll snapshot
- Bulk backfill old punches from face DB (one-time script)

**Do not build yet:** enrollment sync UI, sync dashboards, webhooks, pull jobs, confidence scores, quarantine queues.

---

## 8. Setup (short)

**HR Shakya admin**

1. Every employee has `employeeNumber`
2. Create API key in Integration settings
3. Set shifts/policies when you’re ready for late/absent (phase 3)

**Face app**

1. Config: HR API URL + API key
2. Store `employee_number` on each enrolled person (same as HR)
3. Send punch after each recognition

---

## 9. Rules to agree on (simple)

1. **Employee key** = `employeeNumber` everywhere
2. **Punch types** = only `check_in` and `check_out` to start (no breaks from kiosk)
3. **IN/OUT logic** = face app decides (toggle or separate entry/exit device)
4. **Timezone** = store UTC in API; display IST in UI
5. **Duplicates** = same `externalId` ignored by HR

---

## 10. Out of scope for now

- Face enrollment inside HR Shakya
- Reading face app DB directly from HR (pull sync)
- Biometric connector UI / health checks
- Audit photos, confidence thresholds
- Real-time sockets on punch
- Full payroll cutover checklist

Add these only when phase 1–2 are working.

---

## 11. Summary

**Design:** HR Shakya = punch logs + daily records. Face app = sends punches only.

**DB change:** 2 fields on `attendance_logs` (`source`, `externalId`).

**Integration:** One API endpoint + API key + `employeeNumber` mapping.

**Build order:** API → face app POST → UI shows punches → policies/payroll later.

When ready to implement, start with **Phase 1** only.

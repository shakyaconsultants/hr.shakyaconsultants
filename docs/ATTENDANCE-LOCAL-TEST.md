# Attendance External Punch — Local Test Guide

Test the face recognition → HR Shakya flow on your machine **before** wiring your punch system.

---

## What you need

1. **Backend running** — `npm run dev` in `backend/` (default `http://localhost:4000`)
2. **MongoDB** — same as your `.env` `MONGODB_URI`
3. **API key** — create in HR Shakya UI (see below)
4. **Employee** — must exist with an **Employee Number** (e.g. `EMP001`)

---

## Step 1 — Create API key (simple)

1. Log in as **Admin**
2. Go to **Integration → API Keys → New API Key**
3. Click **Use attendance kiosk preset** (or manually):
   - **Name:** `Attendance Kiosk`
   - **Permissions:** leave **empty**
   - **Rate limit:** leave **empty** (uses default 1000)
   - **Expires:** leave **empty** (never expires)
4. Click **Create Key**
5. **Copy the key** (`hsk_...`) — shown only once

### Why permissions / expiry?

| Field | Required? | For attendance |
|-------|-----------|----------------|
| Name | Yes | e.g. `Attendance Kiosk` |
| Permissions | **No** | Not checked by punch API today — leave empty |
| Rate limit | No | Default is fine |
| Expires | **No** | Leave empty = key works forever |

The punch API only checks: **valid key + not revoked + not expired (if you set a date)**.

---

## Step 2 — Find an employee number

In HR Shakya → **Employees** → open any active employee → note **Employee Number** (e.g. `EMP001`).

---

## Step 3 — Test with PowerShell

Replace `YOUR_API_KEY` and `EMP001` with your values.

### Test A — Check-in (first punch)

```powershell
$headers = @{
  "x-api-key" = "hsk_YOUR_API_KEY_HERE"
  "Content-Type" = "application/json"
}

$body = @{
  externalId = "test-punch-001"
  employeeNumber = "EMP001"
  type = "check_in"
  timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
  deviceCode = "GATE-01"
} | ConvertTo-Json

Invoke-RestMethod -Method POST `
  -Uri "http://localhost:4000/api/v1/attendance/external-punch" `
  -Headers $headers `
  -Body $body
```

**Success looks like:**

```json
{
  "success": true,
  "data": {
    "attendanceLogId": "...",
    "attendanceId": "...",
    "employeeId": "...",
    "duplicate": false,
    "status": "present"
  }
}
```

### Test B — Check-out (same day)

```powershell
$body = @{
  externalId = "test-punch-002"
  employeeNumber = "EMP001"
  type = "check_out"
  timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
  deviceCode = "GATE-01"
} | ConvertTo-Json

Invoke-RestMethod -Method POST `
  -Uri "http://localhost:4000/api/v1/attendance/external-punch" `
  -Headers $headers `
  -Body $body
```

### Test C — Duplicate (same externalId — should not error)

Run **Test A** again with the same `externalId = "test-punch-001"`.

Expected: `"duplicate": true` and HTTP 201 — no second punch created.

---

## Step 4 — Verify in HR Shakya UI

1. Log in as that **employee**
2. Go to **Workspace → My Attendance**
3. You should see:
   - Today's check-in / check-out times
   - Punches listed as **Kiosk · GATE-01**

---

## Common errors

| Error | Fix |
|-------|-----|
| `401 API key required` | Add header `x-api-key: hsk_...` |
| `401 Invalid API key` | Wrong key, revoked key, or expired key |
| `404 Employee not found` | `employeeNumber` wrong or employee inactive |
| `409 Already checked in` | Send `check_out` before another `check_in` |
| `409 Check-in required before check-out` | Send `check_in` first |

---

## Production URL

Same commands — change URI only:

```powershell
-Uri "https://hr-shakyaconsultants.onrender.com/api/v1/attendance/external-punch"
```

---

## Face app integration (after local test works)

On each successful face punch, POST the same JSON to `/attendance/external-punch` with your API key.

| Field | Source |
|-------|--------|
| `externalId` | UUID from your punch DB `id` |
| `employeeNumber` | Same as HR Shakya |
| `type` | `check_in` or `check_out` |
| `timestamp` | Punch time (UTC ISO) |
| `deviceCode` | Your kiosk name (optional) |

Store `synced = true` in your DB when HR returns success.

# Authentication System Audit — Root Cause & Fix Report

**Date:** 2026-06-26  
**Severity:** Production-critical  
**Scope:** Bootstrap and authentication initialization only (no business module changes)

---

## Symptoms

| Symptom | Environment |
|---------|-------------|
| Login succeeds, protected pages work | Dev + Prod |
| Browser refresh redirects to Login | Prod (primary), Dev (misconfigured) |
| Random 401/403 after deployment | Prod |
| Dev behaves differently from Prod | Cross-origin cookies vs Vite proxy |

---

## Root Causes (Confirmed)

### 1. Silent failure → forced logout (Critical)

`performSessionRestore()` caught **all** errors and returned `null`. Bootstrap treated `null` as unauthenticated and called `clearAuth()`.

**Affected failures incorrectly logged out:**
- Network interruption
- Request timeout (`ECONNABORTED`)
- Server 5xx / cold start
- Temporary 429/408

**Only 401 (after refresh failure) should clear the session.**

### 2. Session restore skipped when cookies exist but JS has no token hint (Critical — Prod)

When backend uses HttpOnly cookies but frontend `VITE_AUTH_USE_HTTP_ONLY_COOKIES=false`:
- Login response body has empty tokens
- Nothing stored in `localStorage`
- Login worked (cookies set on API domain)
- **Refresh:** `hasStoredAuth()` false → restore skipped → immediate logout

This explains **login works, refresh fails** with env flag mismatch.

### 3. Axios interceptor cleared auth during bootstrap (Fixed previously, retained)

`clearAuth()` during `isAuthBootstrapActive()` caused route guards to redirect before bootstrap finished. Guard remains: skip `clearAuth()` during bootstrap.

### 4. Dev vs Prod cookie delivery (Configuration)

| | Development | Production |
|---|-------------|------------|
| API URL | Vite proxy (same-origin) | Cross-origin API URL |
| SameSite | `lax` works | Requires `none` + `Secure` |
| Cookie visibility | Same host `:5173` | API host separate |

### 5. 403 confused with 401 (Medium)

403 on bootstrap was treated as unauthenticated. Now classified separately — user stays on splash with error, session not cleared.

---

## Authentication Lifecycle (With Timing)

```
Application Start                    [0ms]
    ↓
AUTH_LOADING + BootstrapSplash       [blocks router]
    ↓
runAuthBootstrap()                   [auth-diag: bootstrap_started]
    ↓
shouldAttemptSessionRestore()        [session hint | tokens | cookie mode]
    ↓
restoreSession() [deduplicated]      [auth-diag: session_restore_started]
    ↓
GET /auth/me (withCredentials)       [auth-diag: fetch_me_attempt]
    ├─ 401 → refreshAccessTokenOnce  [auth-diag: refresh_attempt]
    │         → POST /auth/refresh (cookie or body)
    │         → retry GET /auth/me
    ├─ 5xx/timeout/network → retry up to 3× (400/900/1800ms)
    ├─ 401 confirmed → AUTH_UNAUTHENTICATED
    └─ 200 → apply session
    ↓
apply_session (user, employee, roles, permissions, portal, nav)
    ↓
build_navigation (client-side, 0ms network)
    ↓
AUTH_AUTHENTICATED → AppRouter mounts
    ↓
ProtectedRoute / PortalGuard / Dashboard (lazy, on-demand)
```

**Bootstrap network calls:** 1× `/auth/me` (+ optional 1× `/auth/refresh`)

**Not loaded at bootstrap:** dashboard, projects, employees, attendance, leave, payroll, reports, notifications.

---

## Fixes Implemented

### Frontend

| File | Fix |
|------|-----|
| `session-restore.types.ts` | Typed outcomes: `unauthenticated`, `forbidden`, `transient`, `no_session_hint` |
| `auth-error.util.ts` | Classify 401/403/5xx/network/timeout; retryable flag |
| `auth-session.ts` | Retry transient failures 3×; return typed outcome; structured diagnostics |
| `token-storage.ts` | Persistent `localStorage` session hint; `shouldAttemptSessionRestore()` |
| `auth-bootstrap.ts` | Propagate failure reason; mark session hint on success |
| `auth-diagnostics.ts` | Client structured logs (`VITE_AUTH_DEBUG` or dev) |
| `auth-provider.tsx` | Only `clearAuth()` on confirmed 401/no session; transient → retry UI |
| `bootstrap-splash.tsx` | Offline/retry state while staying AUTH_LOADING |
| `axios.client.ts` | Diagnostic logs; clear session only on confirmed 401 post-refresh |

### Backend

| File | Fix |
|------|-----|
| `auth-diagnostics.util.ts` | Server structured logs (`AUTH_DEBUG=true`) |
| `auth.controller.ts` | Log `/me` and `/refresh` lifecycle (no secrets) |
| `authenticate.middleware.ts` | Log auth failures with cookie/bearer presence flags |
| `cookie.util.ts` | Optional `AUTH_COOKIE_DOMAIN` for parent-domain deployments |
| `env.schema.ts` | `AUTH_DEBUG`, `AUTH_COOKIE_DOMAIN` |

---

## Error Handling Matrix

| Response | Bootstrap behaviour | Session cleared? |
|----------|--------------------|--------------------|
| 401 (confirmed) | → Login | Yes |
| 403 | Splash error message | No |
| 5xx | Auto-retry 3×, then retry button | No |
| Network/timeout | Auto-retry 3×, then retry button | No |
| No session hint | → Login (never logged in) | Yes |

Post-bootstrap axios: only 401 after failed refresh clears session and redirects.

---

## Cookie Configuration (Production)

| Property | Access token | Refresh token |
|----------|-------------|---------------|
| HttpOnly | ✅ | ✅ |
| Secure | `AUTH_COOKIE_SECURE=true` | ✅ |
| SameSite | `none` (cross-origin) | ✅ |
| Path | `/` | `/api/v1/auth` |
| Domain | optional `AUTH_COOKIE_DOMAIN` | same |
| JS readable | ❌ Never | ❌ Never |

**Required env alignment:**

```env
# Backend
AUTH_USE_HTTP_ONLY_COOKIES=true
AUTH_COOKIE_SECURE=true
AUTH_COOKIE_SAME_SITE=none
CORS_CREDENTIALS=true
FRONTEND_URL=https://app.yourdomain.com

# Frontend build
VITE_AUTH_USE_HTTP_ONLY_COOKIES=true
VITE_API_BASE_URL=https://api.yourdomain.com
```

**Dev cookie testing:**

```env
VITE_API_BASE_URL=          # empty — Vite proxy
VITE_AUTH_USE_HTTP_ONLY_COOKIES=true  # must match backend
```

---

## Diagnostics (Temporary)

Enable for production debugging:

```env
AUTH_DEBUG=true              # backend logs
VITE_AUTH_DEBUG=true         # frontend console logs
```

Events logged (no tokens/secrets):
- `bootstrap_started`, `session_restore_started`, `fetch_me_attempt`
- `fetch_me_failed` (reason, status), `refresh_attempt`, `refresh_result`
- `session_restored`, `session_cleared`, `redirect_to_login`
- Server: `auth_me_started`, `auth_authenticate_failed` (hasAccessCookie, hasBearer)

Disable after debugging.

---

## Verification

| Scenario | Expected |
|----------|----------|
| Login | Splash → ERP |
| Browser refresh | Splash → same page, session restored |
| New tab | Cookies/hint → restore via `/me` |
| Deep link | Splash → target route |
| Browser restart | Restore if refresh token valid |
| Prod cold start 503 | Retry, no logout |
| Network offline | Retry UI, no logout |
| Confirmed 401 | Login redirect only |
| Logout | Session cleared, hint removed |

```bash
cd frontend && npm run typecheck  # ✅
cd backend && npm run typecheck   # ✅
```

---

## Files Modified

**Frontend:** `auth-session.ts`, `auth-bootstrap.ts`, `token-storage.ts`, `auth-provider.tsx`, `axios.client.ts`, `bootstrap-splash.tsx`, `auth-diagnostics.ts`, `auth-error.util.ts`, `session-restore.types.ts`, `.env.production.example`

**Backend:** `auth.controller.ts`, `authenticate.middleware.ts`, `cookie.util.ts`, `auth-diagnostics.util.ts`, `env.schema.ts`, `.env.production.example`

**No business module files modified.**

---

## Related Reports

- `.ai/BOOTSTRAP-AUDIT.md`
- `.ai/AUTH-SESSION-RESTORE-AUDIT.md`

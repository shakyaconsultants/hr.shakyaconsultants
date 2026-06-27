# Authentication & Session Restoration Audit

**Date:** 2026-06-26  
**Severity:** Production-blocking  
**Symptom:** Login succeeds → user enters ERP → browser refresh redirects to `/login` despite valid session.

---

## Executive Summary

The session was being destroyed **during bootstrap** before `AuthProvider` finished restoring it. The axios 401 interceptor called `clearAuth()` on refresh/retry failure even while `isAuthBootstrapActive()` was true. That flipped `authStatus` to `unauthenticated` mid-restore, and `ProtectedRoute` / `PortalGuard` immediately redirected to login — even when HttpOnly cookies or localStorage tokens were still valid.

A secondary bug prevented cookie-mode sessions from being tracked across page reloads: `setStoredTokens()` only marked the session active when token strings were non-empty, but cookie-mode API responses intentionally return empty token bodies.

---

## STEP 1 — Authentication Lifecycle

```
Application Start
      ↓
authStatus = 'loading' (Zustand initial state)
      ↓
AuthProvider useEffect → setAuthStatus('loading')
      ↓
restoreSession() [deduplicated singleton promise]
      ↓
bootstrapActive = true
      ↓
Session Detection
  • Cookie mode: always attempt restore (HttpOnly cookies sent via withCredentials)
  • Bearer mode: skip if no tokens in localStorage
      ↓
GET /api/v1/auth/me
  • withCredentials: true
  • Bearer header if localStorage token exists
      ↓
[401] → refreshAccessTokenOnce() [deduplicated]
      ↓
POST /api/v1/auth/refresh (body token OR refresh_token cookie)
      ↓
New Set-Cookie headers → markCookieSessionActive()
      ↓
Retry GET /auth/me
      ↓
GET /auth/me success
      ↓
applySessionFromMe()
  • User, Company, Employee, Roles, Permissions
  • Portal, homeRoute, Navigation, FeatureFlags
      ↓
setAuthStatus('authenticated')
      ↓
ProtectedRoute / PortalGuard render application
```

### Where the flow broke (before fix)

```
GET /auth/me → 401
      ↓
Refresh attempt (may succeed — cookies valid)
      ↓
Retry GET /auth/me → 401 (transient / cross-origin cookie issue)
      ↓
axios interceptor: clearAuth()  ← BUG: ran during bootstrap
      ↓
authStatus = 'unauthenticated'  ← BEFORE AuthProvider finished
      ↓
ProtectedRoute → <Navigate to="/login" />
      ↓
User sees login page despite valid refresh cookies
```

**Break point:** axios response interceptor line calling `clearAuth()` without guarding `isAuthBootstrapActive()`.

---

## STEP 2 — Cookie Audit (Backend)

**File:** `backend/src/modules/auth/utils/cookie.util.ts`

| Property | Access Token (`access_token`) | Refresh Token (`refresh_token`) |
|----------|------------------------------|--------------------------------|
| HttpOnly | ✅ `true` | ✅ `true` |
| Secure | `AUTH_COOKIE_SECURE` | `AUTH_COOKIE_SECURE` |
| SameSite | `AUTH_COOKIE_SAME_SITE` | `AUTH_COOKIE_SAME_SITE` |
| Path | `/` | `/api/v1/auth` |
| Domain | default (request host) | default |
| MaxAge | access JWT TTL (~15m) | refresh JWT TTL (~7d) |
| JS readable | ❌ No | ❌ No |

### Production requirements

| Variable | Value |
|----------|-------|
| `AUTH_USE_HTTP_ONLY_COOKIES` | `true` |
| `AUTH_COOKIE_SECURE` | `true` |
| `AUTH_COOKIE_SAME_SITE` | `none` (cross-origin SPA + API) |
| `CORS_CREDENTIALS` | `true` |
| `FRONTEND_URL` | exact SPA origin(s) |
| `VITE_AUTH_USE_HTTP_ONLY_COOKIES` | `true` (must match backend) |

### Development requirements

| Variable | Value |
|----------|-------|
| `VITE_API_BASE_URL` | `""` (empty — use Vite proxy for same-origin cookies) |
| `VITE_API_PROXY_TARGET` | `http://localhost:4000` |

**Why:** HttpOnly cookies with `SameSite=Lax` are **not** sent on cross-origin XHR from `:5173` → `:4000`. Using the Vite proxy makes API calls same-origin so cookies survive refresh.

---

## STEP 3 — Frontend Startup (Three Auth States)

| State | UI | Redirect |
|-------|-----|----------|
| `loading` | Splash / "Securing your session..." | ❌ Never |
| `authenticated` | Application | — |
| `unauthenticated` | Login page | ✅ Only after validation completes |

**Guards implementing this:**

- `ProtectedRoute` — waits on `loading`, redirects only on `unauthenticated`
- `PortalGuard` — same three-state check
- `PublicRoute` — waits on `loading`, redirects authenticated users to portal home

**Initial state:** `authStatus: 'loading'` in `app.store.ts` — no premature redirect on first paint.

---

## STEP 4 — Session Restore on Refresh

**File:** `frontend/src/shared/auth/auth-session.ts`

```typescript
restoreSession() → performSessionRestore()
  → GET /auth/me (withCredentials + auto-refresh via axios)
  → returns MeResult | null
```

**On success, `AuthProvider` restores:**

- User, Employee, Roles, Permissions
- Portal, homeRoute, Navigation, FeatureFlags
- Company (shell context)

**No business module data** is loaded during restore.

---

## STEP 5 — Route Guard Audit

| Guard | Loading handled | Premature redirect | Permission race |
|-------|----------------|-------------------|-------------------|
| `ProtectedRoute` | ✅ Splash | ✅ Fixed (bootstrap no longer clears auth) | ✅ Checks after authenticated |
| `PortalGuard` | ✅ Splash | ✅ Fixed | ✅ Waits for permissions/roles |
| `PublicRoute` | ✅ Splash | ✅ N/A | — |
| `LoginPage` | ✅ Splash | ✅ N/A | — |

`PortalGuard` additional safety: shows "Resolving permissions..." if authenticated but permissions array empty (non-super-admin).

---

## STEP 6 — Axios / Fetch Credentials

**File:** `frontend/src/shared/api/axios.client.ts`

```typescript
export const apiClient = axios.create({
  baseURL: APP_CONFIG.apiBaseUrl,
  withCredentials: true,  // ← cookies sent on every request
  ...
});
```

- Bearer token attached only when present in localStorage (never for HttpOnly cookie mode)
- Cookie mode: `Authorization` header omitted; server reads `access_token` cookie
- 401 refresh deduplicated via `refreshAccessTokenOnce()`
- `/auth/login`, `/auth/refresh`, etc. excluded from refresh loop

---

## STEP 7 — Backend `/auth/me`

**Endpoint:** `GET /api/v1/auth/me`  
**Middleware:** `authenticateMiddleware` (Bearer OR `access_token` cookie)

**Returns (session shell only):**

- `user`, `employee`, `roles`, `permissions`
- `portal`, `homeRoute`
- `navigation`, `featureFlags` (for sidebar — no extra client fetch)
- `company`, `sessionId`

**Does NOT return:** employees list, departments, dashboard metrics, notifications, or any business module data.

---

## STEP 8 — Performance

| Operation | Target | Implementation |
|-----------|--------|----------------|
| Session restore | < 300ms warm | Single `/auth/me`; parallel backend fetches; session cache |
| Login bootstrap | 1 API call after tokens | `fetchMe()` only |
| No prefetch | ✅ | Removed startup module prefetch |

---

## Root Cause

### Primary (Critical)

**Axios interceptor cleared auth state during bootstrap.**

When `GET /auth/me` returned 401 and the refresh/retry cycle failed (or partially failed), the interceptor called `clearAuth()` **before** `AuthProvider` completed `restoreSession()`. This set `authStatus = 'unauthenticated'` while guards were mounted, triggering React Router `<Navigate to="/login" />`.

The previous fix only suppressed `window.location.assign('/login')` during bootstrap — it did **not** suppress `clearAuth()`.

### Secondary (High — Cookie mode)

**`setStoredTokens()` did not mark cookie sessions when API returned empty token strings.**

In HttpOnly cookie mode, login/refresh responses sanitize tokens to `""` in JSON. The old code:

```typescript
if (accessToken || refreshToken) { markCookieSessionActive(); }
```

…never ran, so in-memory/session hints were inconsistent after refresh.

### Tertiary (Configuration — Dev/Prod)

Cross-origin API URL (`VITE_API_BASE_URL=http://localhost:4000`) bypasses Vite proxy → cookies not sent on XHR with `SameSite=Lax`.

---

## Fix Applied

| File | Change |
|------|--------|
| `frontend/src/shared/api/axios.client.ts` | Skip `clearAuth()` and `clearStoredTokens()` when `isAuthBootstrapActive()` — only `AuthProvider` decides unauthenticated after restore completes |
| `frontend/src/shared/auth/token-storage.ts` | Always `markCookieSessionActive()` on `setStoredTokens()` in cookie mode; persist `sessionStorage` marker for reload detection; clear marker on logout |
| `frontend/src/shared/auth/auth-session.ts` | `bootstrapActive` flag guards interceptor (unchanged); restore remains single `fetchMe()` with axios auto-refresh |

---

## Files Changed

1. `frontend/src/shared/api/axios.client.ts`
2. `frontend/src/shared/auth/token-storage.ts`
3. `frontend/src/shared/auth/auth-session.ts` (verified, no logic regression)

**No backend changes required** — cookie issuance, `/auth/me`, refresh rotation already correct.

---

## Verification Steps

### Manual

1. **Login** — sign in, confirm portal loads.
2. **Refresh** — F5 on any protected page (`/enterprise`, `/employees`, etc.) → must stay authenticated.
3. **New tab** — open same URL in new tab → must restore session via cookies/tokens.
4. **Deep link** — paste protected URL while logged in → must load after splash, not redirect.
5. **Browser restart** — close browser, reopen, navigate to app → session persists if refresh token valid.
6. **Role/permission** — sidebar and gated routes match pre-refresh state.
7. **Portal** — correct portal layout after refresh.
8. **Dashboard** — widgets load independently after shell renders.

### Dev setup checklist

```env
# frontend/.env
VITE_API_BASE_URL=
VITE_AUTH_USE_HTTP_ONLY_COOKIES=false   # or true with proxy

# backend/.env
AUTH_USE_HTTP_ONLY_COOKIES=false        # or true matching frontend
CORS_CREDENTIALS=true
FRONTEND_URL=http://localhost:5173
```

For cookie-mode dev testing: both flags `true` + empty `VITE_API_BASE_URL` (proxy required).

### Production checklist

```env
AUTH_USE_HTTP_ONLY_COOKIES=true
AUTH_COOKIE_SECURE=true
AUTH_COOKIE_SAME_SITE=none
CORS_CREDENTIALS=true
FRONTEND_URL=https://app.yourdomain.com
VITE_AUTH_USE_HTTP_ONLY_COOKIES=true
```

### TypeScript

```bash
cd frontend && npm run typecheck   # ✅ passes
cd backend && npm run typecheck    # ✅ passes
```

---

## Regression Risk

| Area | Risk | Mitigation |
|------|------|------------|
| Post-bootstrap 401 | Low | Interceptor still clears auth + redirects when not bootstrapping |
| Cookie mode login | Low | `setStoredTokens` always marks session |
| Bearer mode dev | None | localStorage path unchanged |
| Double refresh | None | No duplicate refresh added to restore |

---

## Related Documents

- `.ai/AUTH-PRODUCTION-AUDIT.md` — prior auth audit (cookie refresh body, Strict Mode dedup)
- `.ai/ON-DEMAND-LOADING-MAP.md` — on-demand architecture (login = shell only)

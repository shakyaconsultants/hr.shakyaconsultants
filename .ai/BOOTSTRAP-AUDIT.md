# Application Bootstrap Audit

**Date:** 2026-06-26  
**Severity:** Production-blocking  
**Scope:** Bootstrap and authentication initialization only (no business module changes)

---

## Executive Summary

Bootstrap is now a **single-purpose pipeline**: validate session → restore auth shell → build navigation client-side → render app. No business modules load during bootstrap. A **BootstrapGate** blocks the entire router until auth state resolves, preventing login-page flashes on refresh.

---

## Bootstrap Pipeline

```
App mount
    ↓
authStatus = AUTH_LOADING
    ↓
BootstrapSplash (full screen — router NOT mounted)
    ↓
runAuthBootstrap()
    ├─ session_detected / no_session_hint / skip_restore
    ├─ restoreSession() → GET /api/v1/auth/me
    │     └─ [401] → refreshAccessTokenOnce() → retry (axios, bootstrap-safe)
    ├─ apply_session (Zustand)
    └─ build_navigation (client-side, no network)
    ↓
AUTH_AUTHENTICATED | AUTH_UNAUTHENTICATED
    ↓
AppRouter mounts → guards see final state only
```

---

## Operations During Bootstrap

| # | Operation | Network | Module data |
|---|-----------|---------|-------------|
| 1 | Session detection | No | — |
| 2 | `GET /auth/me` | Yes (once) | No |
| 3 | `POST /auth/refresh` | Only if access token expired | No |
| 4 | Apply session to store | No | Auth shell only |
| 5 | Build navigation (client) | No | Registry + session overrides |

### Restored from `/auth/me`

- Current user
- Employee profile
- Roles
- Permissions
- Portal + homeRoute
- Navigation overrides
- Feature flags (required for nav filtering — not business data)
- Company name/code (shell context)

### Explicitly NOT loaded at bootstrap

- Dashboard metrics
- Projects, recruitment, employees
- Attendance, leave, payroll
- Reports, notifications
- Configuration catalog, audit logs
- Any React Query prefetch

---

## Three Authentication States

| Constant | Value | Behaviour |
|----------|-------|-----------|
| `AUTH_STATUS.LOADING` | `loading` | BootstrapSplash — **no redirects** |
| `AUTH_STATUS.AUTHENTICATED` | `authenticated` | Router + app render |
| `AUTH_STATUS.UNAUTHENTICATED` | `unauthenticated` | Login redirect (after bootstrap only) |

**File:** `frontend/src/shared/auth/auth-status.constants.ts`

---

## Bootstrap Gate

**File:** `frontend/src/app/providers/auth-provider.tsx`

While `AUTH_LOADING`, `AuthProvider` renders `<BootstrapSplash />` and **does not mount** `AppRouter`. This guarantees:

- Protected routes never evaluate before session restore completes
- No lazy route chunks load during bootstrap
- No login-page flash on protected URL refresh

---

## Route Guards (Post-Bootstrap)

| Guard | Loading handling | Redirect |
|-------|------------------|----------|
| `AuthProvider` | BootstrapSplash | — |
| `ProtectedRoute` | Delegated to gate | Login if unauthenticated |
| `PortalGuard` | Delegated to gate | Login if unauthenticated |
| `PublicRoute` | Delegated to gate | Portal home if authenticated |

Guards no longer duplicate splash screens — single source of truth at `AuthProvider`.

---

## Session Restore on Refresh

**File:** `frontend/src/shared/auth/auth-session.ts`

- **Cookie mode:** Always attempts `GET /auth/me` (HttpOnly cookies may exist without JS hints)
- **Bearer mode:** Skips network if no localStorage tokens
- `bootstrapActive` flag prevents axios interceptor from calling `clearAuth()` mid-restore
- Deduplicated `restoreSession()` promise (Strict Mode safe)

**Credentials:** `withCredentials: true` on all axios requests.

---

## Bootstrap Timing Profiler

**File:** `frontend/src/shared/auth/bootstrap-profiler.ts`

In development, bootstrap logs a structured timing report:

```
[bootstrap] ✓ 142ms (target ≤300ms)
  bootstrap_start              +   0ms  (0ms)
  session_detected             +   1ms  (1ms)
  fetch_me_start               +   0ms  (1ms)
  fetch_me_complete            + 128ms  (129ms)
  apply_session                +   1ms  (130ms)
  build_navigation             +   0ms  (130ms)
  bootstrap_complete           +   0ms  (130ms)
```

**Target:** ≤ 300ms warm (depends on `/auth/me` backend latency).

Backend `AuthPerfTimer('auth_me')` logs server-side phases separately.

---

## Root Causes Fixed (Refresh → Login)

| Issue | Fix |
|-------|-----|
| Axios `clearAuth()` during bootstrap | Skip when `isAuthBootstrapActive()` |
| Router mounted before restore | BootstrapGate blocks children until `AUTH_LOADING` ends |
| Cookie session not marked after login | `setStoredTokens()` always marks cookie session |
| Multiple competing splash/redirect layers | Single BootstrapSplash at provider level |

---

## Files Changed

| File | Purpose |
|------|---------|
| `shared/auth/auth-status.constants.ts` | Three-state constants |
| `shared/auth/bootstrap-profiler.ts` | Timing report |
| `shared/auth/auth-bootstrap.ts` | Bootstrap orchestration |
| `shared/auth/auth-session.ts` | Session restore (comments clarified) |
| `shared/auth/token-storage.ts` | Cookie session persistence (prior fix) |
| `shared/api/axios.client.ts` | Bootstrap-safe 401 handling (prior fix) |
| `app/components/bootstrap-splash.tsx` | Lightweight splash |
| `app/providers/auth-provider.tsx` | BootstrapGate + profiler |
| `app/routes/protected-route.tsx` | No duplicate loading UI |
| `app/routes/public-route.tsx` | No duplicate loading UI |
| `app/routes/portal-guard.tsx` | No duplicate loading UI |
| `shared/stores/app.store.ts` | Uses `AUTH_STATUS` constants |
| `features/auth/pages/login-page.tsx` | Uses `AUTH_STATUS` |

**No business module files modified.**

---

## Verification Checklist

| Scenario | Expected |
|----------|----------|
| Login | Splash → ERP, session stored |
| F5 refresh on protected page | Splash → same page, no login |
| New tab (same browser) | Splash → session restored via cookies/tokens |
| Direct URL paste | Splash → deep link loads |
| Browser restart | Session restored if refresh token valid |
| Roles / permissions / sidebar | Match pre-refresh state |
| Dev console | Bootstrap timing report logged |

### Dev configuration

```env
VITE_API_BASE_URL=                    # empty — Vite proxy (same-origin cookies)
VITE_AUTH_USE_HTTP_ONLY_COOKIES=false  # or true matching backend
```

### Production configuration

```env
AUTH_USE_HTTP_ONLY_COOKIES=true
AUTH_COOKIE_SECURE=true
AUTH_COOKIE_SAME_SITE=none
CORS_CREDENTIALS=true
VITE_AUTH_USE_HTTP_ONLY_COOKIES=true
```

---

## TypeScript

```bash
cd frontend && npm run typecheck  # ✅ passes
```

---

## Related Documents

- `.ai/AUTH-SESSION-RESTORE-AUDIT.md` — axios clearAuth during bootstrap
- `.ai/ON-DEMAND-LOADING-MAP.md` — no module prefetch at login

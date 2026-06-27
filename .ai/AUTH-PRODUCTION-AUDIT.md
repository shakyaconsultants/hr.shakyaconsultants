# Production Authentication Audit

**Date:** 2026-06-26  
**Scope:** Full auth flow (login, logout, refresh, cookies, session restore, route guards, RBAC)  
**Constraint:** No backend business-logic changes

---

## Executive Summary

Browser refresh was logging users out because the frontend treated successful HttpOnly-cookie refreshes as failures, duplicated refresh calls during bootstrap (React Strict Mode), and redirected to `/login` before session restoration finished.

Fixes centralize session restoration, deduplicate token refresh, support cookie-only auth without in-memory Bearer tokens, and introduce an explicit three-state auth model (`loading` | `authenticated` | `unauthenticated`) so route guards never redirect while auth is still loading.

---

## Root Causes

### 1. Cookie-mode refresh treated as failure (Critical — Production)

When `AUTH_USE_HTTP_ONLY_COOKIES=true`, the backend strips tokens from JSON responses and sets `access_token` / `refresh_token` HttpOnly cookies. The axios interceptor expected a non-empty `accessToken` in the response body to consider refresh successful:

```typescript
// Previous behavior
return accessToken || getAccessToken(); // null in cookie mode → logout
```

This caused immediate redirect to `/login` even when cookies were valid.

### 2. Duplicate refresh during bootstrap (Critical — Development)

`AuthProvider` called `fetchMe()` and, on failure, manually called `refreshTokens()` while the axios 401 interceptor also refreshed. In React Strict Mode (dev), parallel bootstrap runs could trigger **two refresh requests with the same refresh token**, risking replay detection and session revocation.

### 3. Redirect before auth initialization (High)

The axios interceptor used `window.location.assign('/login')` on any 401+refresh failure, including during bootstrap. Route guards could also observe `isInitialized=true` + `isAuthenticated=false` briefly and redirect before restoration completed.

### 4. Cross-origin API URL in development (Medium)

Default `VITE_API_BASE_URL=http://localhost:4000` bypassed the Vite proxy. HttpOnly cookies cannot be sent cross-origin from `:5173` to `:4000`, breaking cookie-mode testing and any misconfigured production setups.

### 5. No startup resource prefetch (Medium)

Navigation and feature flags loaded lazily after render, causing permission/navigation flicker after refresh.

---

## Fix Implemented

### Session restoration pipeline

```
Loading Screen
      ↓
restoreSession() — deduplicated, bootstrap-guarded
      ↓
GET /auth/me (axios auto-refreshes on 401 via shared refresh promise)
      ↓
setSession(user, company, permissions, roles)
      ↓
prefetch navigation + feature flags
      ↓
authStatus = 'authenticated'
      ↓
Render application
```

### Key changes

| Area | Fix |
|------|-----|
| **auth-session.ts** | Singleton `restoreSession()`, `refreshAccessTokenOnce()`, bootstrap flag, nav/feature-flag prefetch |
| **token-storage.ts** | `COOKIE_AUTH_SENTINEL`, `markCookieSessionActive()`, `resolveBearerToken()` skips sentinel |
| **axios.client.ts** | Refresh returns boolean; cookie mode retries without Bearer; skips `/auth/refresh`; `_authRetried` flag; no redirect during bootstrap |
| **app.store.ts** | `authStatus: 'loading' \| 'authenticated' \| 'unauthenticated'` |
| **auth-provider.tsx** | Uses restore pipeline; prefetch before marking authenticated |
| **Route guards** | Three-state checks; never redirect during `loading` |
| **app.config.ts** | Default API base URL `''` (Vite proxy / same-origin) |
| **.env examples** | Document cookie flag alignment |

---

## Backend Audit (Verified — No Changes Required)

### Login (`POST /api/v1/auth/login`)

- Creates DB session, signs access + refresh JWTs
- Sets HttpOnly cookies when `AUTH_USE_HTTP_ONLY_COOKIES=true`
- Returns sanitized JSON (empty token strings in cookie mode)

### Logout (`POST /api/v1/auth/logout`)

- Revokes session in DB
- `clearAuthCookies()` with matching path/options

### Refresh (`POST /api/v1/auth/refresh`)

- Reads refresh token from body **or** `refresh_token` cookie
- Rotation with Redis replay detection
- Issues new cookies + sanitized JSON

### Cookie configuration

| Property | Access Token | Refresh Token |
|----------|-------------|---------------|
| Name | `access_token` | `refresh_token` |
| HttpOnly | ✅ true | ✅ true |
| Secure | `AUTH_COOKIE_SECURE` | `AUTH_COOKIE_SECURE` |
| SameSite | `AUTH_COOKIE_SAME_SITE` | `AUTH_COOKIE_SAME_SITE` |
| Path | `/` | `/api/v1/auth` |
| Domain | (default — request host) | (default) |
| Expiry | `JWT_ACCESS_EXPIRES_IN` (15m) | `JWT_REFRESH_EXPIRES_IN` (7d) |

**Production requirements (enforced in env schema):**

- `AUTH_USE_HTTP_ONLY_COOKIES=true`
- `AUTH_COOKIE_SECURE=true`
- `AUTH_COOKIE_SAME_SITE=none` (cross-origin SPA + API)
- `CORS_CREDENTIALS=true`
- `REDIS_URL` required (refresh replay cache)
- `FRONTEND_URL` must include SPA origin

### Access token verification

- Bearer header **or** `access_token` cookie
- Validates JWT, user `tokenVersion`, active DB session, user status

---

## Frontend Audit

### User store (`app.store.ts`)

- Zustand, **not persisted** (session restored from tokens/cookies)
- `authStatus` is the guard source of truth
- Permissions/roles loaded from `/auth/me` (not separate RBAC call)

### Route guards

| Guard | Loading | Authenticated | Unauthenticated |
|-------|---------|---------------|-----------------|
| `ProtectedRoute` | Loading screen | `<Outlet />` | → `/login` |
| `PublicRoute` | Loading screen | → portal home | `<Outlet />` |
| `PortalGuard` | Loading screen | Portal RBAC + layout | → `/login` |

### API credentials

- `withCredentials: true` on all requests
- Bearer attached only when localStorage token exists
- Cookie mode relies on HttpOnly cookies + sentinel marker

### React Query

- No auth hydration (by design)
- Navigation + feature flags prefetched after session restore
- `queryClient.clear()` on logout only

---

## Files Changed

| File | Change |
|------|--------|
| `frontend/src/shared/auth/auth-session.ts` | **New** — session restore, refresh dedup, prefetch |
| `frontend/src/shared/auth/token-storage.ts` | Cookie sentinel, safe token resolution |
| `frontend/src/shared/api/axios.client.ts` | Fixed refresh + bootstrap-safe redirect |
| `frontend/src/shared/stores/app.store.ts` | `authStatus` three-state model |
| `frontend/src/app/providers/auth-provider.tsx` | Bootstrap pipeline |
| `frontend/src/app/routes/protected-route.tsx` | Three-state guard |
| `frontend/src/app/routes/public-route.tsx` | Three-state guard |
| `frontend/src/app/routes/portal-guard.tsx` | Three-state guard |
| `frontend/src/features/auth/pages/login-page.tsx` | Uses `authStatus` |
| `frontend/src/features/payroll/pages/payroll-portal-page.tsx` | Uses `authStatus` |
| `frontend/src/features/sales/pages/sales-portal-page.tsx` | Uses `authStatus` |
| `frontend/src/config/app.config.ts` | Default empty API base URL |
| `frontend/.env.example` | Proxy + cookie flag docs |
| `frontend/.env.production.example` | Cookie flag docs |

---

## Verification Steps

### Development (localStorage mode)

1. Set `VITE_AUTH_USE_HTTP_ONLY_COOKIES=false` (backend `AUTH_USE_HTTP_ONLY_COOKIES=false`)
2. Login → confirm `hr_shakya_*` tokens in localStorage
3. Navigate to a protected URL (e.g. `/organization/work-shift`)
4. **Hard refresh (F5)** → must stay on page, no redirect to login
5. Open same URL in **new tab** → must load authenticated
6. Wait 15+ minutes (access token expiry) → refresh page → session restored via refresh token
7. Logout → tokens cleared, redirect to login

### Development (cookie mode testing)

1. Set `VITE_API_BASE_URL=` (empty) and `VITE_AUTH_USE_HTTP_ONLY_COOKIES=true`
2. Backend: `AUTH_USE_HTTP_ONLY_COOKIES=true`, `AUTH_COOKIE_SECURE=false`, `AUTH_COOKIE_SAME_SITE=lax`
3. Login → Network tab shows `Set-Cookie` for `access_token`, `refresh_token`
4. Hard refresh → `/auth/me` succeeds with cookies, no login redirect
5. Confirm no Bearer header on requests (cookies only)

### Production

1. Align flags: frontend + backend both use HttpOnly cookies
2. `AUTH_COOKIE_SECURE=true`, `AUTH_COOKIE_SAME_SITE=none`
3. `FRONTEND_URL` includes SPA origin; CORS credentials enabled
4. Login → cookies set on API domain
5. Hard refresh on protected page → session restored
6. New tab → session preserved
7. Logout → cookies cleared (`Set-Cookie` with expired max-age)
8. Direct URL navigation → loading screen → authenticated render

### RBAC after refresh

1. Login as user with known permissions
2. Note visible nav items and accessible routes
3. Hard refresh
4. Confirm same permissions, roles, and nav (no empty-permission stuck state for valid users)

### TypeScript

```bash
cd frontend && npm run typecheck
```

---

## Production vs Development

| Aspect | Development | Production |
|--------|-------------|------------|
| Token storage | localStorage (default) | HttpOnly cookies |
| API URL | Empty → Vite proxy | Full API URL or same-origin |
| Cookie Secure | false | true (required) |
| SameSite | lax | none (cross-origin) |
| Redis | optional | required |
| Refresh replay | optional protection | enforced |

---

## Residual Notes

- Users with **zero permissions and zero roles** still see "Resolving permissions…" (existing business rule, unchanged)
- `/session-expired` route exists but axios redirects to `/login` on hard failure (unchanged)
- Remember-me extends DB session to 30 days but cookie maxAge follows refresh JWT (7d) — pre-existing backend behavior

---

## Status

✅ TypeScript passes  
✅ Session survives browser refresh  
✅ Route guards support loading/authenticated/unauthenticated  
✅ Cookie-mode refresh fixed  
✅ Refresh deduplicated  
✅ No backend business-logic changes

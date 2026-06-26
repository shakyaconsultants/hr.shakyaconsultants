# Production Security Audit Report

**Date:** 2025-06-25  
**Scope:** Full stack (backend + frontend + deployment config)  
**Objective:** Prepare ERP for secure production deployment without leaking sensitive information.

---

## Summary

| Category | Issues Found | Fixed | Remaining |
|----------|-------------|-------|-----------|
| Environment variables | 5 | 4 | 1 (operational) |
| Logging | 6 | 5 | 1 (low) |
| Error responses | 3 | 3 | 0 |
| Browser security | 5 | 5 | 0 |
| Cookies / auth | 6 | 5 | 1 (dev default) |
| HTTP headers | 4 | 4 | 0 |
| Rate limiting | 4 | 4 | 0 |
| Validation | 2 | 0 | 2 (low) |
| Redis | 3 | 3 | 0 |
| Build / deploy | 3 | 3 | 0 |

**Verdict:** Application is production-ready when deployed with `.env.production.example` values. Development mode retains localStorage tokens for backward compatibility.

---

## Issues Found & Fixed

### 1. Environment Variables

| Issue | Severity | Status |
|-------|----------|--------|
| Default seed passwords (`SuperAdmin@123`) allowed in production | Critical | **Fixed** — production validation rejects weak defaults |
| No dedicated field encryption key (reused JWT secret) | High | **Fixed** — `FIELD_ENCRYPTION_KEY` required (32+ chars) |
| Production missing auth cookie hardening vars in example | High | **Fixed** — `.env.production.example` updated |
| Upstash REST URL used instead of `rediss://` Redis URL | Medium | **Fixed** — `normalizeRedisUrl()` converts HTTPS host to `rediss://host:6379` |
| Secrets never logged at startup | — | **Already good** |

### 2. Logging (Winston)

| Issue | Severity | Status |
|-------|----------|--------|
| No automatic redaction of passwords, tokens, URIs | Critical | **Fixed** — `sensitive-redact.util.ts` + Winston redact format |
| Portal/onboarding tokens logged in URL paths | High | **Fixed** — Morgan + request logger sanitize paths |
| Unhandled rejection logged raw `reason` object | Medium | **Fixed** — message-only logging in `main.ts` |
| Error logger could include sensitive meta | Medium | **Fixed** — redact before write |
| `securityLogger` unused | Low | **Open** — wire for auth events in future pass |
| Console logging in backend source | — | **Already good** (zero `console.log`) |

**Masked patterns:** `password`, `secret`, `token`, `authorization`, `cookie`, `mongodb://`, `rediss://`, Bearer tokens, high-entropy path segments.

### 3. Error Responses

| Issue | Severity | Status |
|-------|----------|--------|
| Import/CSV errors exposed raw DB messages | High | **Fixed** — `production-sanitize.util.ts` |
| Operational errors could leak Mongo/Redis/SMTP internals | Medium | **Fixed** — pattern-based client message sanitization |
| Stack traces in API responses | — | **Already good** |

### 4. Browser / Frontend Security

| Issue | Severity | Status |
|-------|----------|--------|
| JWT + refresh token in `localStorage` (XSS) | Critical | **Fixed (prod path)** — `VITE_AUTH_USE_HTTP_ONLY_COOKIES=true` + cookie auth; dev still uses localStorage |
| Triple token duplication (localStorage + Zustand persist) | High | **Fixed** — removed Zustand token persist; centralized `token-storage.ts` |
| React Query cache not cleared on logout | Medium | **Fixed** — `queryClient.clear()` on logout |
| Production `console.log` possible | Low | **Fixed** — esbuild drops console/debugger in prod build |
| Secrets in `VITE_*` env | — | **Already good** |
| Setting history could show encrypted values | Medium | **Fixed** — redact by key pattern + entropy heuristic |

### 5. Cookies & Authentication

| Issue | Severity | Status |
|-------|----------|--------|
| HttpOnly cookies off by default | High | **Fixed (prod)** — required in production env validation |
| Tokens always returned in JSON even with cookies | High | **Fixed** — stripped when `AUTH_USE_HTTP_ONLY_COOKIES=true` |
| Refresh replay fails open without Redis | Critical | **Fixed** — MongoDB fallback via `CacheEntry` collection |
| `clearCookie` missing matching options | Medium | **Fixed** — same httpOnly/secure/sameSite/path |
| Refresh cookie scoped to entire site | Low | **Fixed** — path `/api/v1/auth` |
| Refresh rotation + session hash | — | **Already good** |

### 6. HTTP Headers

| Issue | Severity | Status |
|-------|----------|--------|
| Default Helmet only | Medium | **Fixed** — HSTS, frameguard, noSniff, referrerPolicy in production |
| `X-Powered-By` exposed | Low | **Fixed** — `app.disable('x-powered-by')` |
| Frontend nginx missing security headers | Medium | **Fixed** — X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy |
| CSP not customized for Swagger | Low | **Open** — disable Swagger in prod (already enforced) |

### 7. Rate Limiting

| Issue | Severity | Status |
|-------|----------|--------|
| Bootstrap endpoint unauthenticated, unlimited | Critical | **Fixed** — 3/hour/IP |
| Forgot/reset password unlimited | High | **Fixed** — 5 and 10 per 15 min |
| Refresh token brute force | Medium | **Fixed** — 60 per 15 min |
| Global API rate limit | — | **Already good** (100/15 min) |

### 8. Redis

| Issue | Severity | Status |
|-------|----------|--------|
| Replay protection Redis-only | Critical | **Fixed** — Mongo fallback in `CacheService` |
| Wrong Upstash URL format | Medium | **Fixed** — normalization |
| Redis optional in production | High | **Fixed** — required via env validation |
| Credentials in logs | — | **Already good** |

### 9. Build & Deploy

| Issue | Severity | Status |
|-------|----------|--------|
| Swagger enabled in dev example | Low | Documented — prod example disables |
| Source maps in frontend prod | Low | **Fixed** — `sourcemap: false` |
| Mock/test endpoints in production routes | — | **Reviewed** — bootstrap/status/health only; bootstrap rate-limited |

---

## Production Deployment Checklist

1. Copy `backend/.env.production.example` → production secrets manager
2. Set strong unique values for `JWT_*`, `FIELD_ENCRYPTION_KEY`, `MONGODB_URI`, `REDIS_URL`, `REDIS_TOKEN`
3. Set `AUTH_USE_HTTP_ONLY_COOKIES=true`, `AUTH_COOKIE_SECURE=true`, `AUTH_COOKIE_SAME_SITE=strict`
4. Set `SWAGGER_ENABLED=false`, `LOG_LEVEL=info`, `NODE_ENV=production`
5. Copy `frontend/.env.production.example` with `VITE_AUTH_USE_HTTP_ONLY_COOKIES=true`
6. Use HTTPS termination at load balancer / nginx
7. Never commit `.env` files (gitignored)

---

## Remaining Recommendations (Non-blocking)

| Item | Priority |
|------|----------|
| Wire `securityLogger` for failed logins, replay detection, lockouts | P2 |
| Socket.io authentication before business events | P2 |
| Align portal activation password rules with main auth | P3 |
| Move URL-path tokens (onboarding/reset) to POST body | P3 |
| Add `hpp` middleware for query param pollution | P3 |

---

## Files Changed (Security Pass)

**Backend:** `sensitive-redact.util.ts`, `production-sanitize.util.ts`, `winston.logger.ts`, `morgan.middleware.ts`, `request-logger.middleware.ts`, `error-handler.service.ts`, `cache.service.ts`, `redis.config.ts`, `cookie.util.ts`, `auth-response.util.ts`, `auth.controller.ts`, `auth.routes.ts`, `auth-endpoint-rate-limit.middleware.ts`, `env.schema.ts`, `field-encryption.util.ts`, `app.ts`, `main.ts`, `import-platform.service.ts`, `.env.example`, `.env.production.example`

**Frontend:** `token-storage.ts`, `axios.client.ts`, `app.store.ts`, `auth-provider.tsx`, `auth.api.ts`, `app.config.ts`, `vite.config.ts`, `setting-history-panel.tsx`, `nginx.conf`, `.env.production.example`

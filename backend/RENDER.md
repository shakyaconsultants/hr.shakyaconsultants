# Render — minimum required environment variables

Set these in **Render → Environment** (Dashboard). All other vars use safe defaults.

| Variable | Required | Example |
|----------|----------|---------|
| `NODE_ENV` | Yes | `production` |
| `MONGODB_URI` | Yes | `mongodb+srv://...` |
| `JWT_ACCESS_SECRET` | Yes | 32+ random chars (`openssl rand -base64 32`) |
| `JWT_REFRESH_SECRET` | Yes | different 32+ random chars |
| `FIELD_ENCRYPTION_KEY` | Yes | different 32+ random chars |
| `REDIS_URL` | Yes | `rediss://default:TOKEN@host.upstash.io:6379` |
| `AUTH_USE_HTTP_ONLY_COOKIES` | Yes | `true` |
| `AUTH_COOKIE_SECURE` | Yes | `true` |
| `FRONTEND_URL` | Yes | your deployed frontend URL |

Optional but recommended: `CLOUDINARY_*`, `SMTP_*`, `LOG_LEVEL=info`

Do **not** set `SEED_*` or `SUPER_ADMIN_*` on Render unless running seed locally.

If startup fails, logs will show `=== HR Shakya ERP — startup failed ===` with the exact missing/invalid variable.

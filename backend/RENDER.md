# Render — minimum required environment variables

Set these in **Render → Environment** (Dashboard). All other vars use safe defaults.

| Variable | Required | Example |
|----------|----------|---------|
| `NODE_ENV` | Yes | `production` |
| `MONGODB_URI` | Yes | `mongodb+srv://...` |
| `JWT_ACCESS_SECRET` | Yes | 32+ random chars (`openssl rand -base64 32`) |
| `JWT_REFRESH_SECRET` | Yes | different 32+ random chars |
| `FIELD_ENCRYPTION_KEY` | Yes | different 32+ random chars |
| `AUTH_USE_HTTP_ONLY_COOKIES` | Yes | `true` |
| `AUTH_COOKIE_SECURE` | Yes | `true` |
| `FRONTEND_URL` | Yes | your deployed frontend URL |

**Cross-origin auth (frontend and API on different domains):**
- Set `AUTH_COOKIE_SAME_SITE=none` (not `strict`) on the backend
- Set `VITE_AUTH_USE_HTTP_ONLY_COOKIES=true` on the frontend build
- `FRONTEND_URL` must exactly match the frontend origin (no trailing slash)

Optional but recommended: `CLOUDINARY_*`, `SMTP_*`, `LOG_LEVEL=info`

Do **not** set `SEED_*` or `SUPER_ADMIN_*` on Render unless running seed locally.

If startup fails, logs will show `=== HR Shakya ERP — startup failed ===` with the exact missing/invalid variable.

## MongoDB: `Server selection timed out`

This means Render could not reach your Atlas cluster (not a code bug).

1. **Render env** — add `MONGODB_URI` with the same `mongodb+srv://...` string you use locally.
2. **Atlas Network Access** — [MongoDB Atlas](https://cloud.mongodb.com) → your project → **Network Access** → **Add IP Address** → **Allow Access from Anywhere** (`0.0.0.0/0`). Render uses dynamic outbound IPs; without this, only your home IP can connect.
3. **Password encoding** — if the DB password contains `@`, `#`, `/`, etc., URL-encode it in the URI (`@` → `%40`).
4. **Database name** — set `MONGODB_DB_NAME=hr_shakya` (or your actual DB name).

After changing Atlas network rules, wait ~1 minute, then **Manual Deploy** on Render.

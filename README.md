# HR Shakya ERP

Production-grade multi-tenant ERP platform focused on HR, payroll, and expandable finance/inventory capabilities.

## Project

HR Shakya is built as a **modular monolith** with a React SPA frontend and Express API backend. Phase 0 provides the production foundation — no business modules yet.

## Architecture

```
Frontend (React/Vite)  →  Express API  →  MongoDB (Mongoose)
                              ↓
                         Redis + BullMQ
```

- **Clean Architecture:** Controllers → Services → Repositories
- **API:** REST `/api/v1` with standardized response envelope
- **Docs:** `.ai/` directory (constitution, architecture, roadmap, ADRs)

See [`.ai/architecture.md`](.ai/architecture.md) for full system design.

## Tech Stack

### Backend

| Technology | Purpose |
|------------|---------|
| Node.js 20+ | Runtime |
| Express | HTTP framework |
| TypeScript (strict) | Language |
| MongoDB + Mongoose | Database |
| Redis + BullMQ | Cache, locks, job queues |
| Winston | Application logging (daily rotation) |
| Morgan | HTTP access logging |
| Zod | Config & validation |
| Swagger | OpenAPI (initialized, no endpoints yet) |
| Socket.io | Real-time (initialized only) |

### Frontend

| Technology | Purpose |
|------------|---------|
| React 18 | UI |
| Vite | Build tool |
| TypeScript (strict) | Language |
| TailwindCSS + shadcn/ui | Styling & components |
| React Router | Routing |
| TanStack Query | Server state |
| Zustand | Client state |
| Axios | HTTP client |
| React Hook Form + Zod | Forms (ready for modules) |

## Prerequisites

- Node.js >= 20
- npm >= 10
- MongoDB 7.x (local or Docker)
- Redis 7.x (local or Docker)
- Docker & Docker Compose (optional, for containerized stack)

## Setup

### 1. Clone and install

```bash
npm install
```

### 2. Environment

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Edit `backend/.env` — set `MONGODB_URI`, `REDIS_HOST`, and JWT secrets (min 32 chars).

### 3. Start infrastructure (Docker)

```bash
docker compose up mongodb redis -d
```

Or use locally installed MongoDB and Redis.

### 4. Development

```bash
# Terminal 1 — API (port 4000)
npm run dev:backend

# Terminal 2 — Frontend (port 5173)
npm run dev:frontend
```

### 5. Verify

- Health: http://localhost:4000/health
- Swagger: http://localhost:4000/api/docs
- Frontend: http://localhost:5173

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev:backend` | Start API with hot reload |
| `npm run dev:frontend` | Start Vite dev server |
| `npm run build` | Build all workspaces |
| `npm run typecheck` | TypeScript check all workspaces |
| `npm run lint` | Lint all workspaces |
| `docker compose up -d` | Start full stack (MongoDB, Redis, backend, frontend) |

### Backend only (`backend/`)

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Compile to `dist/` |
| `npm start` | Run production build |
| `npm run typecheck` | TypeScript validation |

### Frontend only (`frontend/`)

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |

## Folder Structure

```
hr-shakya/
├── .ai/                    # Project documentation (constitution, architecture, ADRs)
├── .husky/                 # Git hooks
├── backend/
│   ├── src/
│   │   ├── config/         # Env, JWT, upload config
│   │   ├── constants/      # App-wide constants
│   │   ├── infrastructure/ # MongoDB, Redis, BullMQ, Swagger, Socket.io
│   │   ├── logging/        # Winston loggers
│   │   ├── middleware/     # Express middleware
│   │   ├── modules/        # Feature modules (health only in Phase 0)
│   │   ├── routes/         # API version routers
│   │   ├── shared/         # Errors, types, utils, validators
│   │   ├── app.ts          # Express app factory
│   │   ├── server.ts       # HTTP server lifecycle
│   │   └── main.ts         # Entry point
│   ├── tests/
│   ├── logs/               # Rotating log files (gitignored)
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── app/            # Routes, layouts, pages, providers
│   │   ├── config/
│   │   ├── modules/        # Feature modules (future)
│   │   ├── shared/         # Components, API client, stores, utils
│   │   └── styles/
│   └── Dockerfile
├── docker-compose.yml
└── package.json            # npm workspaces root
```

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|----------|-------------|
| `NODE_ENV` | `development` \| `production` \| `test` |
| `PORT` | API port (default `4000`) |
| `MONGODB_URI` | MongoDB connection string |
| `REDIS_HOST` | Redis hostname |
| `JWT_ACCESS_SECRET` | JWT signing secret (min 32 chars) |
| `JWT_REFRESH_SECRET` | Refresh token secret (min 32 chars) |
| `LOG_LEVEL` | `error` \| `warn` \| `info` \| `debug` |
| `SWAGGER_ENABLED` | Enable Swagger UI |
| `CORS_ORIGIN` | Allowed frontend origin |

See [`backend/.env.example`](backend/.env.example) for all variables.

### Frontend (`frontend/.env`)

| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | Backend URL |
| `VITE_API_PREFIX` | API version prefix |

See [`frontend/.env.example`](frontend/.env.example).

## API Response Format

```json
{
  "success": true,
  "data": {},
  "meta": {
    "correlationId": "uuid",
    "timestamp": "ISO-8601",
    "requestId": "uuid"
  }
}
```

## License

Private — All rights reserved.

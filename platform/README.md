# Career platform (NestJS + Prisma + Next.js)

This folder contains a **separate** production-style implementation of the career-guidance test system using the stack you specified. The existing `app/` (FastAPI) + `frontend/` (Vite) project remains unchanged.

## Prerequisites

- Node.js 20+
- PostgreSQL 14+

## Backend (`backend/`)

1. Create a database and set `DATABASE_URL` in `backend/.env` (see `backend/.env.example`).
2. Install and migrate:

```bash
cd platform/backend
npm install
npx prisma migrate dev --name init
npm run db:seed
npm run start:dev
```

API base URL defaults to `http://localhost:4000/api`.

### Admin authentication

All `/api/admin/*` routes require `ADMIN_API_KEY` to be set on the server.

Send either header:

- `x-admin-key: <ADMIN_API_KEY>` **or**
- `Authorization: Bearer <ADMIN_API_KEY>`

If the key is missing on the server, admin routes return **503** (fail‑closed).

### Quality checks (automated)

Backend unit tests (scoring + tie logic + aggregation):

```bash
cd platform/backend
npm test
```

### Key endpoints

- `POST /api/sessions` — start anonymous session
- Warmup: `GET/POST /api/sessions/:id/warmup/*`
- Main/adaptive: `GET/POST /api/sessions/:id/main/*`, `.../adaptive/*`
- `GET /api/sessions/:id/result`
- `GET /api/faculties?clusterId=&city=&language=&type=&mode=&minScore=&maxScore=&userScore=&margin=`
- Admin:
  - `GET/POST/PATCH/DELETE /api/admin/questions`
  - `POST /api/admin/faculties/import` (multipart field `file`, `.xlsx`)

## Frontend (`web/`)

```bash
cd platform/web
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3001`.

Set `NEXT_PUBLIC_API_URL` to your API base (must include `/api`).

## Notes

- Warmup scoring thresholds: `>= 3` continue, `-2..2` warning, `<= -3` retry later.
- Main battery: 15 random questions × 5 clusters = 75; Likert `0..4` maps to `-2..+2` per question.
- Adaptive: if #2 cluster is within **10%** of #1 (`second >= top * 0.9` with `top > 0`), 10 extra questions are selected (5 per cluster) from unused MAIN pool items.

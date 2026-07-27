# ifNote API — NestJS backend

NestJS + TypeScript backend for **ifNote Web**. Database via Prisma on
Heroku Postgres. Auth via JWT. AI proxied through this server so the
frontend never sees an API key.

- **Framework:** NestJS 10
- **Language:** TypeScript 5.3 (strict)
- **Database:** PostgreSQL via Prisma 5.10
- **Auth:** JWT (HS256, 7d default)
- **AI:** OpenAI / Azure / custom-compatible chat completions, with mock fallback
- **Deploy:** Heroku via `Procfile` + `heroku-postbuild`

---

## Endpoints overview

| Method | Path | Auth | Purpose |
|---|---|:-:|---|
| `GET` | `/health` | — | Liveness check |
| `POST` | `/api/auth/register` | — | Register, returns `{ token, user }` |
| `POST` | `/api/auth/login` | — | Login, returns `{ token, user }` |
| `POST` | `/api/auth/logout` | — | No-op (JWT stateless) |
| `GET` | `/api/auth/me` | ✅ | Current user + profile |
| `GET` | `/api/users/me/profile` | ✅ | Profile (display name, JLPT goal, daily target) |
| `PUT` | `/api/users/me/profile` | ✅ | Update profile |
| `GET` | `/api/catatan` | ✅ | Combined Kotoba + Bunpou search/filter/page |
| `GET / POST / PUT / DELETE` | `/api/kotoba` | ✅ | CRUD vocabulary |
| `GET / POST / PUT / DELETE` | `/api/bunpou` | ✅ | CRUD grammar |
| `GET` | `/api/hafalan?mode&slide` | ✅ | One slide of fixed-20 deck |
| `GET` | `/api/hafalan/slides?mode` | ✅ | All slide ranges |
| `POST` | `/api/hafalan/add` | ✅ | Append item to order |
| `PUT` | `/api/hafalan/mastery` | ✅ | Update item mastery |
| `POST` | `/api/hafalan/shuffle-preview` | ✅ | UI-only shuffle (no DB write) |
| `POST` | `/api/hafalan/rebuild-order` | ✅ | Renumber order from 1 |
| `GET / POST` | `/api/quiz` | ✅ | Generate questions / list |
| `POST` | `/api/quiz/answer` | ✅ | Submit answer, persist progress |
| `GET` | `/api/quiz/progress` | ✅ | Per-quiz-type counters |
| `POST` | `/api/quiz/generate` | ✅ | AI- or pool-based question generation |
| `POST` | `/api/ai/{8 modes}` | ✅ | AI proxy (see below) |
| `GET / PUT` | `/api/settings` | ✅ | UserSettings |
| `GET / POST` | `/api/kanji` | ✅ | Kanji lookup with cache |
| `GET / POST` | `/api/backup/{export,import,reset}` | ✅ | Per-user data backup |

AI proxy modes (all `POST`):
`explain-kotoba`, `explain-bunpou`, `correct-sentence`, `make-example`,
`generate-quiz`, `create-hafalan`, `bulk-kotoba`, `analyze-sentence`.

Each AI endpoint returns `{ source: "ai" | "mock", data: {...} }`. If
`AI_API_KEY` isn't set or the upstream call fails, the server returns
the structured **mock fallback** with the same JSON shape — never throws.

---

## Hafalan rules (server-enforced)

1. New items append at `MAX(orderIndex) + 1` per user.
2. UNIQUE `(userId, orderIndex)` and UNIQUE `(userId, itemType, itemId)` enforce no collisions and no duplicates.
3. Slide N = items `[(N-1)·20 .. N·20)`.
4. Last slide may have fewer than 20 — never auto-filled.
5. Order is **never rebalanced** automatically. Only `POST /api/hafalan/rebuild-order` (user-initiated) renumbers.
6. `shuffle-preview` is read-only, returns the slide reshuffled in memory; no DB write.
7. Items deleted from `kotoba`/`bunpou` are removed from `hafalan_order` too. Gaps in order indexes are tolerated by the read path.

---

## Local development

```bash
cd ifnote-api

# 1. Install deps (also runs prisma generate via postinstall)
npm install

# 2. Create .env from template, fill DATABASE_URL + JWT_SECRET
cp .env.example .env

# 3. Apply migration to local Postgres
npm run prisma:migrate -- --name init

# 4. (Optional) seed real Japanese N5 content into your existing user
SEED_USER_EMAIL=you@example.com npm run prisma:seed

# 5. Run dev server with hot reload
npm run start:dev

# Verify
curl -s http://localhost:3000/health
```

> **No mock user is created in seed.** You must register through
> `/api/auth/register` first; seed only inserts real content into your
> account. See `prisma/seed.ts`.

---

## Heroku deploy

```bash
# 1. Create app + Postgres
heroku create ifnote-api
heroku addons:create heroku-postgresql:essential-0 --app ifnote-api

# 2. Set secrets (NEVER commit these)
heroku config:set JWT_SECRET="$(openssl rand -hex 32)" --app ifnote-api
heroku config:set AI_API_KEY="sk-..."                   --app ifnote-api
heroku config:set AI_BASE_URL="https://api.openai.com/v1" --app ifnote-api
heroku config:set AI_MODEL_ID="gpt-4o-mini"             --app ifnote-api
heroku config:set AI_REQUEST_FORMAT="openai"            --app ifnote-api
heroku config:set FRONTEND_URL="https://ifnote.vercel.app" --app ifnote-api
heroku config:set NODE_ENV="production"                  --app ifnote-api

# 3. Deploy. Procfile runs:
#    release → npx prisma migrate deploy
#    web     → node dist/src/main.js
git push heroku main

# 4. Tail logs
heroku logs --tail --app ifnote-api
```

`heroku-postbuild` runs `npm run build && npm run prisma:migrate:deploy`
so the build slug already includes compiled JS, the Prisma client, and
applied migrations.

---

## Security guarantees

- **Server-side AI key only.** `AI_API_KEY` lives in Heroku Config Vars; not in DB, not in JWT, not in any response body.
- **All `/api/...` routes (except `/api/auth/*` and `/health`) require JWT.** `userId` is read from the token, never from request body.
- **Every Prisma query filters by `userId`.** Direct ID lookups (`findFirst`) verify ownership before edits.
- **Validation:** every DTO uses `class-validator` with `whitelist + forbidNonWhitelisted + transform`. Unknown fields are rejected.
- **Rate limit:** global 60 req/min per IP. Auth endpoints tighter (5–10/min). Bulk AI import 5/min.
- **Helmet:** sane HTTP security headers.
- **CORS:** allowlist `FRONTEND_URL` only.
- **Error filter:** sanitises responses, hides stack traces in production.
- **Password hashing:** `bcryptjs` with cost 10.
- **Backup export:** strips secrets defensively. Import never accepts password hashes.
- **No `Flashcard` entity** anywhere in code or schema (the legacy concept is replaced by Hafalan).

---

## Module map

```
src/
├── main.ts                    bootstrap, helmet, CORS, validation pipe, error filter
├── app.module.ts              wires every feature module + global Throttler
├── health.controller.ts       /, /health
├── config/env.ts              typed env loader, asserts in production
├── prisma/                    PrismaService + global module
├── common/
│   ├── auth/                  JwtStrategy, JwtAuthGuard, JwtUser type
│   ├── decorators/            @CurrentUser()
│   ├── filters/               HttpErrorFilter
│   └── utils/hafalan-order.util.ts   nextOrderIndex, append, retryOnUniqueViolation
├── auth/                      register / login / me + DTOs
├── users/                     profile read/update
├── catatan/                   combined search across Kotoba + Bunpou
├── kotoba/                    CRUD + auto-append HafalanOrder
├── bunpou/                    CRUD + auto-append HafalanOrder
├── hafalan/                   slide-by-20 logic + shuffle-preview + rebuild-order
├── quiz/                      generator from user pool + answer + progress
├── ai/
│   ├── ai-client.service.ts   real OpenAI/Azure call, AiLog, never throws
│   ├── mock-ai.ts             deterministic fallback shapes
│   ├── ai.service.ts          eight modes, always returns { source, data }
│   └── ai.controller.ts       JWT + per-mode throttle
├── settings/                  GET / PUT user_settings (no API keys)
├── kanji/                     cache-first → AI → fallback
└── backup/                    export, import (validate + rebuild order), reset
```

---

## Acceptance test (PRD §17 / prompt block)

| # | Item | Status |
|---|---|---|
| 1 | Backend starts locally | ✅ `npm run start:dev` boots, `/health` → 200 |
| 2 | Prisma connects | ✅ Lazy connect on first query; survives boot if DB temporarily unreachable |
| 3 | Auth works | ✅ register/login produce JWT; `/api/auth/me` returns user |
| 4 | Protected routes work | ✅ Missing/invalid token → 401 with sanitised message |
| 5 | CRUD works | ✅ Kotoba/Bunpou create/read/update/delete; new item appended to HafalanOrder |
| 6 | AI proxy fallback works | ✅ `AI_API_KEY` unset → endpoints return `source: "mock"` shaped payloads |
| 7 | No secrets exposed | ✅ Helmet, CORS allowlist, sanitized errors, JWT secret only on server |
| 8 | Ready for Heroku deploy | ✅ `Procfile` (release migrates, web serves), `heroku-postbuild` builds JS |

---

## What's NOT in this phase

- Frontend Next.js UI (next milestone)
- Forgot/reset password (placeholder route only)
- Email verification
- Per-user encrypted AI keys
- Admin dashboard
- Full integration tests (Jest setup deferred)

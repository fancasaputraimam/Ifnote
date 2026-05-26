# ifNote

Aplikasi belajar bahasa Jepang (kotoba, bunpou, hafalan, quiz, AI tutor)
untuk pelajar Indonesia level N5/N4. Calm Japanese notebook UI, mobile-first,
dengan AI proxy aman di backend.

## Struktur project

```
IFV2/
├── PRD_ifNote_Web.md     Spec produk (sumber kebenaran)
├── index.html            HTML mockup awal (prototype lokal)
├── style.css             CSS mockup
├── script.js             JS mockup
├── ifnote-api/           Backend NestJS + Prisma + Heroku Postgres
└── ifnote-web/           Frontend Next.js 14 + Tailwind + TanStack Query
```

## Stack

| Layer | Tech | Deploy |
|---|---|---|
| Frontend | Next.js 14 + TypeScript + Tailwind + TanStack Query + RHF + Zod | Vercel |
| Backend | NestJS + TypeScript + Prisma 5 + JWT + bcrypt + Helmet | Heroku |
| Database | PostgreSQL via Heroku Postgres | Heroku |
| AI | Server-side proxy ke OpenAI/Azure compatible (mock fallback) | — |

## Quick start

```bash
# Backend
cd ifnote-api
npm install
cp .env.example .env                # isi DATABASE_URL + JWT_SECRET
npm run prisma:migrate -- --name init
PORT=3001 npm run start:dev          # http://localhost:3001

# Frontend (terminal kedua)
cd ifnote-web
npm install
cp .env.example .env.local           # default sudah point ke localhost:3001
npm run dev                          # http://localhost:3000
```

Buka `http://localhost:3000`. Daftar akun → otomatis ke `/app/home`.

## Fitur

- **Auth**: register / login / logout / me (JWT)
- **Catatan**: gabungan kotoba + bunpou, search, filter (tipe / level N5-N1 / status), accordion detail, Add/Edit/Delete dialogs
- **Hafalan**: slide tetap 20 item per slide, mode kotoba/bunpou/mixed/weak, hide meaning, shuffle preview (UI-only), tandai mastery
- **Quiz**: 4 tipe (kotoba/bunpou/mixed/AI generated), pilihan ganda + isian, progress tersimpan per tipe
- **AI Tutor**: 8 mode (jelaskan kotoba/bunpou, koreksi kalimat, buat contoh, buat quiz, plan hafalan, bulk import, analisa kalimat) lewat backend proxy
- **Settings**: theme system/light/dark, JP mode beginner/normal/furigana, AI provider config (no API key di frontend), backup export/import JSON, reset data
- **Kanji**: cache-first lookup, popup dengan onyomi/kunyomi/contoh

## Deploy

### Backend ke Heroku

```bash
cd ifnote-api
heroku create ifnote-api
heroku addons:create heroku-postgresql:essential-0 --app ifnote-api
heroku config:set JWT_SECRET="$(openssl rand -hex 32)" --app ifnote-api
heroku config:set AI_API_KEY="sk-..." --app ifnote-api
heroku config:set AI_BASE_URL="https://api.openai.com/v1" --app ifnote-api
heroku config:set AI_MODEL_ID="gpt-4o-mini" --app ifnote-api
heroku config:set FRONTEND_URL="https://ifnote.vercel.app" --app ifnote-api
heroku config:set NODE_ENV="production" --app ifnote-api
git subtree push --prefix=ifnote-api heroku main
# Procfile release phase auto-runs `prisma migrate deploy`
```

### Frontend ke Vercel

```bash
cd ifnote-web
npx vercel link
npx vercel env add NEXT_PUBLIC_API_BASE_URL production
# masukkan URL Heroku backend
npx vercel --prod
```

## Security

- JWT secret di Heroku Config Vars, tidak di-commit
- AI API key server-side only, tidak pernah ada di frontend / DB
- Helmet HTTP headers, CORS allowlist single origin
- bcrypt cost 10 untuk password hashing
- Rate limit global 60/min, auth 5-10/min, AI bulk 5/min
- Semua query Prisma filter by `userId` dari JWT, bukan request body
- Backup export sanitized (no passwordHash, no AI keys)

## Lisensi

Proprietary — semua hak dilindungi.

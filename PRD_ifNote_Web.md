# PRD — ifNote Web App

## 1. Ringkasan Produk

**ifNote Web** adalah aplikasi website untuk belajar bahasa Jepang yang membantu user menyimpan, mengatur, menghafal, dan menguji materi **kotoba**, **bunpou**, contoh kalimat, kanji, dan quiz.

Versi website ini memakai backend production agar data user tersimpan di cloud, bisa login, bisa dibuka dari banyak perangkat, dan aman untuk integrasi AI.

Target fase ini adalah membuat **website production-ready** dengan:

- Frontend: Next.js
- Backend: NestJS atau Express
- Deployment backend: Heroku
- Database: Heroku Postgres
- ORM: Prisma
- Auth: JWT/session
- AI Proxy: backend Heroku
- Frontend deploy: Vercel atau Heroku

---

## 2. Tujuan Produk

### 2.1 Tujuan Utama

1. Membuat website belajar Jepang berbasis akun user.
2. Menyediakan Catatan gabungan untuk Kotoba dan Bunpou.
3. Menyediakan Hafalan dengan fixed slide deck 20 item per slide.
4. Menyediakan Quiz untuk menguji pemahaman.
5. Menyediakan AI Tutor berbasis task/workflow.
6. Menyimpan data user di database cloud.
7. Menyediakan AI proxy aman di backend agar API key tidak bocor ke frontend.
8. Membuat arsitektur yang bisa dikembangkan ke APK/native app nanti.

### 2.2 Non-Goals Fase Ini

1. Tidak membuat APK Android.
2. Tidak memakai Capacitor.
3. Tidak memakai Room/DataStore.
4. Tidak menyimpan AI secret di frontend.
5. Tidak membuat payment/subscription dulu.
6. Tidak membuat native mobile app dulu.
7. Tidak membuat fitur sosial/public sharing dulu.

---

## 3. Stack Teknologi

### 3.1 Frontend

- Next.js
- TypeScript
- Tailwind CSS
- TanStack Query
- Zustand optional untuk state ringan
- React Hook Form + Zod untuk form validation
- PWA optional

### 3.2 Backend

- NestJS atau Express
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT Auth
- bcrypt/argon2 untuk password hash
- AI Proxy service
- Deployment: Heroku

### 3.3 Database

- Heroku Postgres
- PostgreSQL sebagai database utama

Alasan memakai PostgreSQL:

- Data ifNote bersifat relasional.
- User punya banyak Kotoba.
- User punya banyak Bunpou.
- Hafalan order butuh urutan stabil.
- Quiz progress per user.
- Settings per user.
- Kanji cache per user.

### 3.4 Deployment

Recommended deployment:

```txt
Frontend: Vercel
Backend: Heroku
Database: Heroku Postgres
AI Proxy: Heroku backend
```

Alternative:

```txt
Frontend + Backend: Heroku
Database: Heroku Postgres
```

---

## 4. Struktur Produk Final

Screen utama website:

1. **Home**
2. **Catatan**
3. **Hafalan**
4. **Quiz**
5. **AI Tutor**
6. **Settings**
7. **Auth Pages**

Mobile bottom nav:

1. Home
2. Catatan
3. Hafalan
4. Quiz
5. AI Tutor

Settings tidak masuk bottom nav.  
Settings diakses dari icon gear/topbar.

---

## 5. User Roles

### 5.1 Guest

Guest adalah user belum login.

Bisa:

- Melihat landing/auth page
- Mencoba demo terbatas jika disediakan
- Login/register

Tidak bisa:

- Menyimpan catatan permanen
- Menggunakan AI production
- Mengakses database pribadi

### 5.2 Authenticated User

User login.

Bisa:

- CRUD Kotoba
- CRUD Bunpou
- Mengatur Hafalan
- Mengikuti Quiz
- Menggunakan AI Tutor
- Mengatur Settings
- Export/import data
- Sinkron data antar perangkat

### 5.3 Admin Optional

Tidak wajib untuk fase awal.

Nanti bisa ditambah untuk:

- Monitoring user
- Monitoring AI logs
- Manage abuse/rate limit
- Manage seed data

---

## 6. Auth Requirements

### 6.1 Auth Flow

Wajib:

- Register
- Login
- Logout
- Forgot password optional
- Reset password optional
- Session persistence
- Protected routes

Optional:

- Login with Google
- Email verification

### 6.2 Auth Data

Tabel `users`:

```txt
id
email
password_hash
name
avatar_url
created_at
updated_at
```

Tabel `profiles` optional:

```txt
id
user_id
display_name
avatar_url
jlpt_goal
daily_target
created_at
updated_at
```

### 6.3 Security Auth

- Password harus di-hash.
- JWT secret disimpan di Heroku Config Vars.
- Token/session tidak boleh hardcoded.
- Protected API wajib cek user.
- Semua query data harus filter by `user_id`.

---

## 7. Database Schema

### 7.1 users

```txt
id UUID PRIMARY KEY
email TEXT UNIQUE NOT NULL
password_hash TEXT NOT NULL
name TEXT
avatar_url TEXT
created_at TIMESTAMP
updated_at TIMESTAMP
```

### 7.2 profiles

```txt
id UUID PRIMARY KEY
user_id UUID REFERENCES users(id)
display_name TEXT
avatar_url TEXT
jlpt_goal TEXT
daily_target INTEGER DEFAULT 10
created_at TIMESTAMP
updated_at TIMESTAMP
```

### 7.3 kotoba

```txt
id UUID PRIMARY KEY
user_id UUID REFERENCES users(id)
jp TEXT NOT NULL
romaji TEXT
meaning TEXT NOT NULL
type TEXT
level TEXT
tags TEXT[]
beginner_example TEXT
normal_example TEXT
furigana_example TEXT
example_meaning TEXT
mastery TEXT DEFAULT 'mid'
created_at TIMESTAMP
updated_at TIMESTAMP
```

Allowed mastery:

```txt
good
mid
weak
```

### 7.4 bunpou

```txt
id UUID PRIMARY KEY
user_id UUID REFERENCES users(id)
pattern TEXT NOT NULL
meaning TEXT NOT NULL
formula TEXT
usage TEXT
level TEXT
tags TEXT[]
beginner_example TEXT
normal_example TEXT
furigana_example TEXT
example_meaning TEXT
note TEXT
common_mistake TEXT
mastery TEXT DEFAULT 'mid'
created_at TIMESTAMP
updated_at TIMESTAMP
```

### 7.5 hafalan_order

```txt
id UUID PRIMARY KEY
user_id UUID REFERENCES users(id)
item_type TEXT NOT NULL
item_id UUID NOT NULL
order_index INTEGER NOT NULL
created_at TIMESTAMP
updated_at TIMESTAMP
```

Rules:

- `item_type` hanya `kotoba` atau `bunpou`.
- `order_index` menentukan posisi tetap.
- Item baru selalu append ke `MAX(order_index) + 1`.
- Jangan rebalance order lama.
- Jangan insert item baru ke awal.

### 7.6 quiz_progress

```txt
id UUID PRIMARY KEY
user_id UUID REFERENCES users(id)
quiz_type TEXT NOT NULL
correct_count INTEGER DEFAULT 0
wrong_count INTEGER DEFAULT 0
total_answered INTEGER DEFAULT 0
last_score INTEGER
updated_at TIMESTAMP
```

### 7.7 kanji_cache

```txt
id UUID PRIMARY KEY
user_id UUID REFERENCES users(id)
kanji TEXT NOT NULL
meaning TEXT
onyomi TEXT
kunyomi TEXT
explanation TEXT
words_json JSONB
example_jp TEXT
example_id TEXT
created_at TIMESTAMP
updated_at TIMESTAMP
```

Unique:

```txt
user_id + kanji
```

### 7.8 user_settings

```txt
id UUID PRIMARY KEY
user_id UUID REFERENCES users(id)
theme TEXT DEFAULT 'system'
jp_mode TEXT DEFAULT 'beginner'
onboarding_seen BOOLEAN DEFAULT false
ai_provider TEXT
ai_base_url TEXT
ai_model_id TEXT
ai_request_format TEXT DEFAULT 'openai'
use_real_ai BOOLEAN DEFAULT false
created_at TIMESTAMP
updated_at TIMESTAMP
```

Important:

- Jangan simpan API key AI user secara plaintext untuk public app.
- Untuk fase awal, jika user memasukkan API key sendiri, pertimbangkan enkripsi server-side.
- Pilihan lebih aman: API key utama disimpan di Heroku Config Vars sebagai server secret, bukan per-user key.

### 7.9 ai_logs optional

```txt
id UUID PRIMARY KEY
user_id UUID REFERENCES users(id)
mode TEXT
input_preview TEXT
output_preview TEXT
status TEXT
error_message TEXT
created_at TIMESTAMP
```

Gunakan untuk monitoring, debugging, dan rate limit.

---

## 8. Hafalan Fixed Slide Rules

Hafalan adalah fitur inti.

Aturan wajib:

1. Satu slide maksimal 20 item.
2. Slide 1 = item order 1–20.
3. Slide 2 = item order 21–40.
4. Slide 3 = item order 41–60.
5. Slide terakhir boleh kurang dari 20 item.
6. Jangan auto-fill slide terakhir dari slide sebelumnya.
7. Jangan rebalance item lama.
8. Item baru selalu append ke akhir `hafalan_order`.
9. Jika item lama dihapus, boleh ada gap secara data, tapi saat render bisa skip missing item.
10. Shuffle hanya temporary di UI, tidak mengubah `hafalan_order`.

Mode Hafalan:

- Kotoba
- Bunpou
- Mixed
- Weak Only

Backend harus menyediakan ordered items berdasarkan mode.

---

## 9. API Requirements

Base URL backend contoh:

```txt
https://ifnote-api.herokuapp.com
```

### 9.1 Auth API

```txt
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
POST /api/auth/forgot-password
POST /api/auth/reset-password
```

### 9.2 Catatan API

Combined notes:

```txt
GET /api/catatan
```

Query params:

```txt
search
type=all|kotoba|bunpou
level=N5|N4|N3|N2|N1
status=good|mid|weak|review|new
page
limit
```

Response:

```json
{
  "items": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

### 9.3 Kotoba API

```txt
GET    /api/kotoba
GET    /api/kotoba/:id
POST   /api/kotoba
PUT    /api/kotoba/:id
DELETE /api/kotoba/:id
```

When creating Kotoba:

- Insert into `kotoba`
- Append to `hafalan_order`
- Return created item

### 9.4 Bunpou API

```txt
GET    /api/bunpou
GET    /api/bunpou/:id
POST   /api/bunpou
PUT    /api/bunpou/:id
DELETE /api/bunpou/:id
```

When creating Bunpou:

- Insert into `bunpou`
- Append to `hafalan_order`
- Return created item

### 9.5 Hafalan API

```txt
GET  /api/hafalan?mode=mixed&slide=1
GET  /api/hafalan/slides?mode=mixed
POST /api/hafalan/add
PUT  /api/hafalan/mastery
POST /api/hafalan/shuffle-preview
POST /api/hafalan/rebuild-order
```

Important:

- `shuffle-preview` must not save changed order.
- `rebuild-order` should be admin/user-confirmed only.
- Default behavior never rebalances.

### 9.6 Quiz API

```txt
GET  /api/quiz?type=kotoba
POST /api/quiz/answer
GET  /api/quiz/progress
POST /api/quiz/generate
```

Quiz types:

- kotoba
- bunpou
- mixed
- ai

### 9.7 Settings API

```txt
GET /api/settings
PUT /api/settings
```

Settings include:

- theme
- jp_mode
- onboarding_seen
- AI provider config without exposing secrets

### 9.8 Kanji API

```txt
GET  /api/kanji/:kanji
POST /api/kanji/cache
```

Flow:

- Check user kanji_cache.
- If exists, return cached result.
- If not, call AI proxy or seed dictionary.
- Save result to cache.
- Return result.

### 9.9 AI Proxy API

Frontend must call backend only.

```txt
POST /api/ai/explain-kotoba
POST /api/ai/explain-bunpou
POST /api/ai/correct-sentence
POST /api/ai/make-example
POST /api/ai/generate-quiz
POST /api/ai/create-hafalan
POST /api/ai/bulk-kotoba
POST /api/ai/analyze-sentence
```

AI backend behavior:

- Validate user auth.
- Apply rate limit.
- Sanitize input.
- Call AI provider using server-side API key.
- Return structured JSON.
- Do not auto-save unless endpoint is explicitly save/confirm.
- Log minimal AI usage in `ai_logs`.

---

## 10. AI Workflows

### 10.1 Bulk Kotoba Import

Frontend:

1. User paste many kotoba.
2. User click analyze.
3. Frontend sends to backend AI proxy.
4. Backend analyzes.
5. Backend checks duplicates for that user.
6. Backend returns preview.

Preview statuses:

- `new`
- `exists`
- `manual`

User actions:

- Add all new
- Add one
- Edit manual
- Ignore

Save endpoint should only run after confirmation.

### 10.2 Sentence Analysis

Input:

```txt
ごはんを食べてから、テレビを見ます。
```

Output:

- sentence
- meaning
- bunpouFound
- kotobaFound
- particles
- recommendations

Actions:

- Save Bunpou
- Save Kotoba New
- Add to Hafalan
- Generate Quiz
- Copy

### 10.3 Explain Kotoba

Input:

```txt
食べます
```

Output:

- topic
- meaning
- type
- level
- romaji
- example
- exampleMeaning
- note

### 10.4 Explain Bunpou

Input:

```txt
〜ながら
```

Output:

- pattern
- meaning
- formula
- usage
- example
- exampleMeaning
- commonMistake

---

## 11. Frontend Requirements

### 11.1 Pages / Routes

Recommended Next.js routes:

```txt
/
 /login
 /register
 /forgot-password
 /app/home
 /app/catatan
 /app/hafalan
 /app/quiz
 /app/ai
 /app/settings
```

Alternative with app shell:

```txt
/app
```

and internal tab routing.

### 11.2 Components

Reusable components:

- AppShell
- TopBar
- BottomNav
- Sidebar optional
- NotebookCard
- Badge
- SearchInput
- FilterSheet
- AccordionCard
- ConfirmDialog
- LoadingState
- Toast/Snackbar
- EmptyState
- KanjiPopup
- NoteForm
- BunpouForm
- KotobaForm
- AIStudyNote
- HafalanSlideTable
- QuizCard

### 11.3 Responsive

Website must support:

- Mobile
- Tablet
- Desktop

Mobile behavior:

- Bottom nav visible
- Settings via gear
- Single-column cards
- Touch-friendly controls

Desktop behavior:

- Optional sidebar
- Wider content
- Cards/grid layout

---

## 12. Screen Requirements

### 12.1 Home

Purpose: Daily dashboard.

Components:

- Welcome-back card
- Today mission card
- Stats
- AI Study Plan
- Kanji Hari Ini
- Bunpou Fokus Hari Ini
- Recent Kotoba
- Recent Bunpou
- Quick Actions

Navigation:

- Mulai Hafalan → Hafalan
- Buka Catatan → Catatan
- Tanya AI → AI Tutor
- Buat Quiz → Quiz

### 12.2 Catatan

Purpose: Manage Kotoba + Bunpou.

Features:

- Search
- Filter
- Combined list
- Accordion detail
- Add/Edit Kotoba
- Add/Edit Bunpou
- Delete optional
- AI Jelaskan
- Buat Quiz
- Tambah ke Hafalan
- Kanji popup

### 12.3 Hafalan

Purpose: Memorization fixed slides.

Features:

- Mode cards
- Fixed slide navigation
- Show/hide meaning
- Temporary shuffle
- Row detail
- Mark good/mid/weak
- Generate quiz from item

### 12.4 Quiz

Purpose: Test knowledge.

Features:

- Quiz type cards
- Question card
- Multiple choice
- Blank answer
- Feedback
- Explanation
- Progress

### 12.5 AI Tutor

Purpose: Task-based AI assistant.

Modes:

- Jelaskan Kotoba
- Jelaskan Bunpou
- Koreksi Kalimat
- Buat Contoh
- Buat Quiz
- Tambahkan ke Hafalan
- Import Kotoba Massal
- Analisa Kalimat

### 12.6 Settings

Purpose: User preferences and account configuration.

Sections:

- Account
- Appearance
- Japanese display mode
- AI configuration
- Backup/export/import
- Danger zone

---

## 13. Security Requirements

1. No AI API key in frontend.
2. No database secret in frontend.
3. All API endpoints protected except auth.
4. Every query must filter by authenticated `user_id`.
5. Validate input with Zod/class-validator.
6. Rate limit AI endpoints.
7. Limit bulk import size.
8. Sanitize AI input/output.
9. Hash passwords.
10. Use HTTPS in production.
11. Store secrets in Heroku Config Vars.
12. CORS allow only frontend domain.
13. Avoid returning stack traces to client.

---

## 14. Heroku Backend Requirements

Heroku Config Vars:

```txt
DATABASE_URL
JWT_SECRET
AI_API_KEY
AI_BASE_URL
AI_MODEL_ID
FRONTEND_URL
NODE_ENV=production
```

Commands target:

```bash
heroku create ifnote-api
heroku addons:create heroku-postgresql:essential-0
heroku config:set JWT_SECRET=...
heroku config:set AI_API_KEY=...
heroku config:set AI_BASE_URL=...
heroku config:set AI_MODEL_ID=...
git push heroku main
```

Prisma commands:

```bash
npx prisma migrate deploy
npx prisma generate
```

---

## 15. Frontend Deployment Requirements

Recommended: Vercel.

Env:

```txt
NEXT_PUBLIC_API_BASE_URL=https://ifnote-api.herokuapp.com
```

Do not expose:

- AI_API_KEY
- DATABASE_URL
- JWT_SECRET

---

## 16. Backup / Export / Import

Website should support:

- Export user data JSON
- Import user data JSON
- Reset user data

Export includes:

- kotoba
- bunpou
- hafalan_order
- quiz_progress
- settings
- kanji_cache

Export should not include secret API key.

Import should:

- Validate JSON
- Confirm before overwrite
- Append or replace based on user choice
- Rebuild missing hafalan_order if needed

---

## 17. Acceptance Criteria

### 17.1 Backend

- Auth works
- Protected routes work
- Kotoba CRUD works
- Bunpou CRUD works
- Catatan combined API works
- Hafalan fixed order API works
- Quiz progress works
- AI proxy works with mock/fallback
- Settings API works
- Prisma migrations run on Heroku
- No secrets exposed

### 17.2 Frontend

- Login/register works
- App shell works
- Bottom nav correct
- Settings not in bottom nav
- Home works
- Catatan works
- Hafalan works
- Quiz works
- AI Tutor works
- Settings works
- Responsive mobile/desktop
- No Flashcard screen
- No user-facing Flashcard text

### 17.3 Hafalan Rules

- Slide max 20
- Last slide can be less than 20
- No auto-fill from previous slide
- New item append to end
- Shuffle temporary only
- Order stable across sessions

### 17.4 AI Rules

- AI key not in frontend
- AI proxy through backend
- Bulk import preview before save
- Duplicate detection
- Sentence analysis
- Fallback on error
- Rate limiting

---

## 18. Out of Scope

- APK Android
- Capacitor
- Native Android
- Payment/subscription
- Public note sharing
- Team/collaboration
- Admin dashboard
- Push notification
- OCR camera
- Voice recognition
- Offline-first browser sync
- Real-time collaboration

---

## 19. Milestones

### Milestone 1 — Web PRD and Database

- Finalize PRD Web
- Create Prisma schema
- Define API contracts

### Milestone 2 — Backend Foundation

- Auth
- Prisma
- Heroku Postgres
- Core CRUD APIs

### Milestone 3 — Frontend Foundation

- Next.js setup
- App shell
- Auth pages
- API client

### Milestone 4 — Core Screens

- Home
- Catatan
- Hafalan
- Quiz

### Milestone 5 — AI Tutor

- AI proxy endpoints
- Bulk import
- Sentence analysis
- Quiz generation

### Milestone 6 — Settings and Backup

- User settings
- Export/import
- Reset data

### Milestone 7 — Deploy and QA

- Backend Heroku deploy
- Frontend Vercel deploy
- End-to-end testing
- Security review

---

## 20. Definition of Done

Website production MVP selesai jika:

1. User bisa register/login.
2. User bisa CRUD Kotoba dan Bunpou.
3. Catatan gabungan berjalan.
4. Hafalan fixed slide berjalan.
5. Quiz berjalan.
6. AI Tutor berjalan via backend proxy.
7. Settings berjalan.
8. Data tersimpan di Heroku Postgres.
9. Backend deploy di Heroku.
10. Frontend deploy di Vercel/Heroku.
11. Tidak ada secret di frontend.
12. Tidak ada user-facing Flashcard.
13. Semua endpoint aman by user_id.

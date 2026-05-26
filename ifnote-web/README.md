# ifNote Web — Frontend Shell (Next.js)

Frontend shell untuk **ifNote Web**. Fase ini cuma foundation: routing,
auth pages, app shell, dan placeholder untuk 6 screen utama. Backend AI /
data integration di-wire lewat `lib/api-client.ts` tapi screen-nya di-isi
detail di fase berikutnya.

- **Framework:** Next.js 14 (App Router) + TypeScript strict
- **Styling:** Tailwind CSS dengan tema *Japanese notebook* tenang (warm off-white + soft blue/lilac)
- **State / data:** TanStack Query 5
- **Forms:** React Hook Form + Zod
- **State helper:** Zustand (toast viewport)
- **Theme:** light / dark / system, persisted di `localStorage`
- **Auth:** JWT MVP via `localStorage` (TODO: pindah ke httpOnly cookie)
- **Deploy target:** Vercel

---

## Struktur

```
ifnote-web/
├── package.json
├── next.config.js
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json (paths "@/*" → "./src/*")
├── .eslintrc.json
├── .env.example
└── src/
    ├── app/
    │   ├── layout.tsx                root HTML, providers, theme-color, viewport
    │   ├── page.tsx                  landing (CTA Daftar / Masuk)
    │   ├── login/page.tsx
    │   ├── register/page.tsx
    │   ├── forgot-password/page.tsx
    │   └── app/
    │       ├── layout.tsx            <ProtectedRoute><AppShell></AppShell></ProtectedRoute>
    │       ├── page.tsx              redirect → /app/home
    │       ├── home/page.tsx
    │       ├── catatan/page.tsx
    │       ├── hafalan/page.tsx
    │       ├── quiz/page.tsx
    │       ├── ai/page.tsx
    │       └── settings/page.tsx
    ├── components/
    │   ├── layout/
    │   │   ├── AppShell.tsx
    │   │   ├── Providers.tsx         (Query, Auth, Theme, Toast)
    │   │   └── ScreenPlaceholder.tsx
    │   ├── ui/
    │   │   ├── Button.tsx
    │   │   ├── IconButton.tsx
    │   │   ├── TextInput.tsx
    │   │   ├── SearchInput.tsx
    │   │   ├── FilterButton.tsx
    │   │   ├── NotebookCard.tsx
    │   │   ├── Badge.tsx
    │   │   ├── Modal.tsx
    │   │   └── Accordion.tsx
    │   ├── forms/
    │   │   ├── LoginForm.tsx
    │   │   ├── RegisterForm.tsx
    │   │   └── ForgotPasswordForm.tsx
    │   ├── feedback/
    │   │   ├── LoadingState.tsx
    │   │   ├── EmptyState.tsx
    │   │   ├── Toast.tsx
    │   │   └── ConfirmDialog.tsx
    │   └── navigation/
    │       ├── TopBar.tsx            (logo, gear→Settings, user menu)
    │       ├── BottomNav.tsx         (mobile only — 5 items, Settings DI-EXCLUDED)
    │       └── Sidebar.tsx           (desktop only — 5 items + Settings)
    ├── features/
    │   ├── auth/
    │   │   ├── AuthProvider.tsx      (useAuth, refresh, logout, listens 401 + cross-tab)
    │   │   ├── ProtectedRoute.tsx    (client guard, redirect ke /login)
    │   │   └── QueryProvider.tsx
    │   └── settings/
    │       └── ThemeProvider.tsx     (system/light/dark, applies .dark on <html>)
    ├── lib/
    │   ├── api-client.ts             (fetch wrapper + ApiError + 401 broadcast)
    │   ├── auth-client.ts            (register/login/logout/me + token storage)
    │   ├── query-client.ts
    │   ├── constants.ts              (ROUTES, BOTTOM_NAV, TOKEN_STORAGE_KEY)
    │   ├── types.ts                  (response shapes for backend)
    │   └── utils.ts                  (cn, safeStorage)
    └── styles/
        └── globals.css
```

---

## Setup local

```bash
cd ifnote-web

# Install
npm install

# Set backend URL
cp .env.example .env.local
# .env.local default points to http://localhost:3001 (NestJS backend in ifnote-api)

# Dev with HMR
npm run dev
# → http://localhost:3000

# Production build + serve
npm run build
npm run start
```

Wajib backend (`ifnote-api`) jalan di port 3001 untuk register/login. Tanpa
backend, halaman public (`/`, `/login`, `/register`, `/forgot-password`)
tetap render OK.

> Backend NestJS default-nya juga port 3000. Kalau frontend dan backend
> dijalanin bareng, ubah backend ke `PORT=3001` (lewat `.env`-nya backend)
> dan biarkan frontend di 3000.

---

## Routes

### Public

| Path | Tujuan |
|---|---|
| `/` | Landing — CTA "Daftar" / "Masuk" |
| `/login` | Login form (email + password) |
| `/register` | Register form (name + email + password + confirm) |
| `/forgot-password` | Placeholder (backend endpoint belum siap di fase ini) |

### Protected (`/app/*`)

Semua dilindungi oleh `<ProtectedRoute>`. Tanpa token valid → redirect ke `/login`.

| Path | Status |
|---|---|
| `/app/home` | Placeholder ScreenPlaceholder + AppShell |
| `/app/catatan` | Placeholder |
| `/app/hafalan` | Placeholder |
| `/app/quiz` | Placeholder |
| `/app/ai` | Placeholder |
| `/app/settings` | Placeholder (akses dari gear icon di TopBar atau dari Sidebar desktop) |

`/app` (tanpa subroute) → redirect ke `/app/home`.

---

## Acceptance test

| # | Item | Status | Bukti |
|---|---|---|---|
| 1 | Next.js app runs | ✅ | `npm run start` → 200 di semua 7 route, build sukses 14 pages |
| 2 | Tailwind works | ✅ | `bg-paper-50` + `text-ink-800` ter-apply, kelas `dark:` aktif via `<html class="dark">` |
| 3 | API base env works | ✅ | `getApiBaseUrl()` baca `NEXT_PUBLIC_API_BASE_URL`, fallback `http://localhost:3001` |
| 4 | Auth pages render | ✅ | `/login`, `/register`, `/forgot-password` semua HTTP 200, RHF + Zod validation aktif |
| 5 | Protected app layout renders | ✅ | `/app/home` show "Memeriksa sesi…" → redirect ke `/login` saat tanpa token |
| 6 | Bottom nav correct | ✅ | 5 items: Home, Catatan, Hafalan, Quiz, AI Tutor (Settings tidak ada) |
| 7 | Settings only from gear/topbar | ✅ | Gear icon di TopBar route ke `/app/settings`; Sidebar desktop tampilin Settings; BottomNav tidak |
| 8 | No Flashcard text | ✅ | `grep -ri flashcard src/` returns nothing |
| 9 | Responsive mobile/desktop | ✅ | BottomNav `md:hidden`, Sidebar `hidden md:block`, TopBar selalu terlihat |
| 10 | Ready for screen implementation | ✅ | Semua hook (`useAuth`, `useTheme`), API helpers, dan types sudah ter-export |

Plus:
- ✅ TypeScript strict, `tsc --noEmit` clean
- ✅ `next build` sukses (84.2 kB shared bundle, semua page < 5 kB)
- ✅ Light + dark theme via class strategy, persistent di `localStorage`
- ✅ Cross-tab auth sync (logout di tab A → tab B refresh state)
- ✅ Global `ifnote:unauthorized` event saat 401 → AuthProvider clear session

---

## Hal yang sengaja DI-LUAR scope di fase ini

- Implementasi screen detail (Home, Catatan, Hafalan, Quiz, AI Tutor, Settings)
- Furigana renderer + KanjiPopup
- AddEditNote dialog + form Kotoba/Bunpou
- Hafalan slide table + shuffle
- Quiz interactive UI
- Backup export/import flow
- Dark mode toggle di Settings (provider sudah siap)
- Forgot/reset password backend integration
- Real-time / optimistic update untuk note CRUD
- Per-user encrypted AI key storage

Semua di atas akan dikerjakan di fase implementasi screen-specific.

---

## Deploy ke Vercel

```bash
# 1. Push ke GitHub repo
# 2. Import di vercel.com → Framework "Next.js" auto-detect
# 3. Set environment variable:
#    NEXT_PUBLIC_API_BASE_URL = https://ifnote-api.herokuapp.com
# 4. Deploy

# Atau lewat CLI:
npx vercel link
npx vercel env add NEXT_PUBLIC_API_BASE_URL production
# masukkan URL backend Heroku
npx vercel --prod
```

Backend NestJS di Heroku perlu CORS-allowlist domain Vercel. Set
`FRONTEND_URL` di Heroku Config Vars sesuai URL Vercel kamu.

---

## Security notes

- **Tidak ada API key AI di frontend.** Semua call AI lewat backend (`POST /api/ai/*`).
- **JWT token disimpan di `localStorage` untuk MVP.** Komentar TODO di `auth-client.ts` mengingatkan untuk pindah ke httpOnly cookie. Kalau kamu sudah set up cookie di backend, tinggal ubah `credentials: "omit"` jadi `"include"` di `api-client.ts`, dan ganti `safeStorage` calls jadi server-side.
- **Backend adalah otoritas auth sesungguhnya.** `<ProtectedRoute>` cuma cegah flicker — proteksi sebenarnya di JWT guard backend.
- **CORS:** backend harus allowlist domain frontend (Vercel + localhost dev).
- **Tidak ada user-supplied API key tersimpan di Settings frontend di fase ini.** Settings UI di-render placeholder dulu; konfigurasi AI client-side kalau dipakai harus encrypt server-side.

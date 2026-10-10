# ifNote Startup-Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship About, Kontak, honest Forgot-password, an audit-clean landing and auth set, and format auto-detection for the AI base URL.

**Architecture:** Frontend changes stay inside the existing Next.js 14 app and Tailwind token set (Zen Ink). Static-page behavior is pinned by a dependency-free Node check script (`ifnote-web/scripts/check-pages.mjs`) run against `next start`. Backend change is one pure function with Jest tests.

**Tech Stack:** Next.js 14.1, React 18, Tailwind 3.4, framer-motion, NestJS + Jest, Node fetch (no new dependencies).

**Spec:** `docs/superpowers/specs/2026-10-09-ifnote-startup-readiness-design.md`

## Global Constraints

- antislop active: during. Every UI task ends clean against R-02 (no em dash `—` in any UI text), R-24, R-25, R-26, R-32, R-38.
- UI language is Indonesian. Product name is written `ifNote`.
- Contact email is `founder@ifnote.app`. No other address appears in UI.
- Contrast: normal text ≥ 4.5:1, large text and non-text UI ≥ 3:1. Every changed pair is checked with `python C:\Users\Administrator\.kiro\skills\antislop-human\contrast-check.py <fg> <bg>`.
- Dials: ENERGY 2 / RHYTHM 2 / MOTION 1. No `repeat: Infinity` animations on landing or auth.
- Seeded content is N5 and N4 only. Copy never says "N5–N1 semua level".
- No new npm dependencies. Shell on this machine: use `npm.cmd` and `npx.cmd`.
- The folder is not a git repo, so "commit" steps are replaced by a task checkpoint (run the listed verification).
- `NEXT_PUBLIC_POWERED_BY_CLAUDE` defaults off. "Claude" claims render only when it is `"true"`.

## Review Focus

- Visitor without JS or a crawler requests `/`: the HTML must contain the hero text, not a spinner.
- Logged-in user opens `/`: still redirected to `/app/home`.
- Base URL that is not a valid URL (`"not a url"`, empty string): format detection returns the chosen format and does not throw.
- Base URL `https://API.Anthropic.com/v1/` (case, trailing slash): detected as anthropic.
- Keyboard-only user on `/login`: Tab reaches the password visibility toggle.
- `NEXT_PUBLIC_CONTACT_EMAIL` unset: pages still show `founder@ifnote.app`.

---

### Task 1: AI request-format auto-detection

**Files:**
- Create: `ifnote-api/src/ai/request-format.ts`
- Create: `ifnote-api/src/ai/request-format.spec.ts`
- Modify: `ifnote-api/src/ai/ai-client.service.ts` (the three places that build a `ResolvedAiConfig`: Path 1, Path 2, `loadOwnerServerConfig`)

**Interfaces:**
- Produces: `export type RequestFormat = "openai" | "azure" | "anthropic" | "custom"` and `export function resolveRequestFormat(baseUrl: string | null | undefined, format: RequestFormat): RequestFormat`

- [ ] **Step 1: Write failing tests** in `request-format.spec.ts`: `returns anthropic for api.anthropic.com host`, `ignores case and trailing slash` (`https://API.Anthropic.com/v1/`), `keeps chosen format for other hosts` (`https://api.openai.com/v1` with `openai`), `keeps azure when chosen even on other hosts`, `does not throw on invalid url` (`"not a url"`, `""`, `null`, `undefined` all return the input format).
- [ ] **Step 2:** Run `npx.cmd jest src/ai/request-format.spec.ts` in `ifnote-api`. Expected: FAIL, module not found.
- [ ] **Step 3:** Implement `resolveRequestFormat` using `new URL(...)` in a try/catch and a lowercase hostname compare to `api.anthropic.com`. Move the `RequestFormat` union out of `ai-client.service.ts` and `env.ts` to import from here.
- [ ] **Step 4:** In `ai-client.service.ts`, wrap the format in each of the three config builders with `resolveRequestFormat(baseUrl, format)` before `pickBaseUrl` and `pickModelId` run, so an Anthropic host with format `openai` gets the Anthropic defaults and headers.
- [ ] **Step 5:** Add one case to `ai-client.service.spec.ts`: owner settings `aiBaseUrl: "https://api.anthropic.com/v1"`, `aiRequestFormat: "openai"` resolve to `requestFormat: "anthropic"`.
- [ ] **Step 6:** Run `npx.cmd jest` and `npx.cmd tsc --noEmit` in `ifnote-api`. Expected: all suites PASS, no tsc output.

### Task 2: Check script and shared constants

**Files:**
- Create: `ifnote-web/scripts/check-pages.mjs`
- Modify: `ifnote-web/src/lib/constants.ts`, `ifnote-web/.env.example`, `ifnote-web/src/app/layout.tsx`

**Interfaces:**
- Produces: `ROUTES.about = "/about"`, `ROUTES.contact = "/contact"`, `CONTACT_EMAIL` (default `"founder@ifnote.app"`, overridden by `NEXT_PUBLIC_CONTACT_EMAIL`), `POWERED_BY_CLAUDE: boolean`.
- Produces: `node scripts/check-pages.mjs <baseUrl>` prints one `PASS`/`FAIL` line per assertion and exits 1 on any FAIL.

- [ ] **Step 1:** Write `check-pages.mjs` asserting, per page via `fetch`: status 200 for `/`, `/login`, `/register`, `/forgot-password`, `/about`, `/contact`, `/privacy`, `/terms`; `/` HTML contains the hero text `Catat. Hafal.` and does not contain `aria-label="Memuat"`; no page HTML contains `—`; `/about` and `/contact` contain `mailto:founder@ifnote.app`; `/` does not contain `N5–N1`; `/login` and `/register` do not contain `Daftar dengan Google`; the document viewport meta does not contain `user-scalable=no` or `maximum-scale`.
- [ ] **Step 2:** Run `npm.cmd run build` then `npx.cmd next start -p 3100` in the background, then `node scripts/check-pages.mjs http://localhost:3100`. Expected: multiple FAIL lines (this is the baseline).
- [ ] **Step 3:** Edit `constants.ts` to add the three exports and routes above; set `CONTACT_EMAIL` default; update `.env.example` comment to name `founder@ifnote.app` and add `NEXT_PUBLIC_POWERED_BY_CLAUDE=`.
- [ ] **Step 4:** In `layout.tsx` remove `maximumScale` and `userScalable` from `viewport`.

### Task 3: Color tokens and focus contrast

**Files:**
- Modify: `ifnote-web/tailwind.config.js` (`accent-gradient` stops, `glow` shadows if tied to the old stops), `ifnote-web/src/components/ui/Button.tsx`, `ifnote-web/src/components/ui/LinkButton.tsx`, `ifnote-web/src/components/ui/TextInput.tsx`, `ifnote-web/src/components/auth/PasswordInput.tsx`

**Interfaces:**
- Consumes: Task 2 constants (none directly).
- Produces: `bg-accent-gradient` whose every stop gives white text ≥ 4.5:1; focus ring color ≥ 3:1 on `paper-50` and on `ink-800`.

- [ ] **Step 1:** Run the contrast script for white on each of the three current gradient stops (`#e2603f`, `#d94f33`, `#c03a24`) and record which fail.
- [ ] **Step 2:** Choose replacement stops from the `accent-600` to `accent-700` range (`#ba3c23`, `#97311e`) so every stop passes; re-run the script for each and for white on the chosen mid stop. Expected: all PASS at 4.5.
- [ ] **Step 3:** Replace `focus:ring-accent-400` and `focus-visible:ring-accent-400/70` with a ring that passes 3:1 against `paper-50` and against `ink-800` (script both; use `accent-600` in light and `accent-300` in dark via `dark:` variants).
- [ ] **Step 4:** In inputs, replace `placeholder:text-ink-400/80` with a placeholder color that passes 4.5:1 on white and on `ink-800` (script both). For small muted text on dark surfaces used in the audited pages, use `dark:text-ink-300` and script it against `#1a1a18`.
- [ ] **Step 5:** Run `npx.cmd tsc --noEmit` and `npm.cmd run build` in `ifnote-web`. Expected: both clean.

### Task 4: Landing

**Files:**
- Modify: `ifnote-web/src/features/landing/LandingScreen.tsx`, `ifnote-web/src/app/page.tsx`

**Interfaces:**
- Consumes: `ROUTES`, `CONTACT_EMAIL`, `POWERED_BY_CLAUDE` from Task 2.

- [ ] **Step 1:** Remove the `checking` state and the spinner branch. Keep the `useEffect` that calls `router.replace(ROUTES.app.home)` when `authClient.hasToken()`. The component must render the full page on first render.
- [ ] **Step 2:** Rewrite copy to remove every `—` (STEPS descriptions, hero paragraph, ShodoSheet caption, AI Tutor card, footer tagline, `page.tsx` metadata title and description). Replace the "N5–N1" claims with "Materi bawaan: N5 dan N4. Catatan buatanmu bisa diberi level N5 sampai N1." Replace "Tanpa kartu kredit" with "Tidak ada pembayaran di app".
- [ ] **Step 3:** Remove the decorative dot above the H1, the N5 to N1 chip row, the `ZenStrip` stats block, and the `ArrowRight` icons on CTAs. Replace the `Bot` icon with a relevant one already in `lucide-react` or remove the icon tile.
- [ ] **Step 4:** Replace the 4/2/2/4 bento with a layout where the AI Tutor and Catatan cards are full width in sequence and Hafalan and Quiz sit side by side, each with a one-line reason comment (R-31). Label every mock UI block with a visible text `Contoh tampilan`.
- [ ] **Step 5:** Remove `repeat: Infinity` animations (`KanaBackdrop`) and make `ShodoSheet` play once without the loop timer. Keep the "Tulis ulang" button.
- [ ] **Step 6:** Replace `FOOTER_COLS` with one list of links that all exist: Masuk, Daftar, Tentang (`ROUTES.about`), Kontak (`ROUTES.contact`), Kebijakan Privasi, Ketentuan Layanan. Render the "ditenagai Claude" badge only when `POWERED_BY_CLAUDE`.
- [ ] **Step 7:** Rebuild, restart `next start`, run `node scripts/check-pages.mjs http://localhost:3100`. Expected: all `/` assertions PASS.

### Task 5: Auth pages

**Files:**
- Modify: `ifnote-web/src/components/auth/AuthCard.tsx`, `PasswordInput.tsx`, `LoginForm.tsx`, `RegisterForm.tsx`, `ifnote-web/src/app/forgot-password/page.tsx`
- Delete usage of: `ForgotPasswordForm` (file removed in Step 4)
- Create: `ifnote-web/src/components/auth/FormError.tsx`

**Interfaces:**
- Produces: `export function FormError({ message }: { message: string | null })` rendering `<p role="alert">` when `message` is set and nothing otherwise.

- [ ] **Step 1:** In `PasswordInput.tsx` delete `tabIndex={-1}` from the toggle button.
- [ ] **Step 2:** Create `FormError`. In `LoginForm` and `RegisterForm` keep a `formError` state set in the catch block with the same text as the toast, render `<FormError />` above the submit button, and remove `icon: "🌸"` from the success toasts.
- [ ] **Step 3:** In `AuthCard.tsx` replace the em dashes, make the left-panel quote plain descriptive text without quotation marks and without a `blockquote` or attribution footer, remove `FloatingKana` and the infinite `animate` loops, and add Tentang and Kontak links to the legal sentence at the bottom.
- [ ] **Step 4:** Rewrite `forgot-password/page.tsx` as a static page: heading "Reset password belum otomatis", one paragraph explaining that the owner resets it by hand, and a `mailto:` button to `CONTACT_EMAIL` with `subject=Reset%20password%20ifNote` and a body asking for the account email. Delete `ForgotPasswordForm.tsx`.
- [ ] **Step 5:** Rebuild and run the check script. Expected: auth assertions PASS (no `Daftar dengan Google`, no `—`).

### Task 6: About, Kontak, legal footers

**Files:**
- Create: `ifnote-web/src/app/about/page.tsx`, `ifnote-web/src/app/contact/page.tsx`
- Modify: `ifnote-web/src/components/legal/LegalPage.tsx` (footer nav adds Tentang and Kontak)

**Interfaces:**
- Consumes: `LegalPage`, `LegalSection` (existing), `CONTACT_EMAIL`, `POWERED_BY_CLAUDE`.

- [ ] **Step 1:** Create `/about` using the spec's approved draft text verbatim (maker "Imam Fanca Saputra", product-side reason, "Yang sudah ada", "Yang belum ada", contact). Mention "AI tutor berbasis Claude" only when `POWERED_BY_CLAUDE`; otherwise "AI tutor".
- [ ] **Step 2:** Create `/contact` with the `mailto:` link, the list of suitable topics (bug, permintaan hapus akun, pertanyaan data), and no response-time promise.
- [ ] **Step 3:** Add the two links to the `LegalPage` nav.
- [ ] **Step 4:** Rebuild, run the check script. Expected: every line PASS.

### Task 7: DESIGN.md and Impeccable

**Files:**
- Create: `ifnote-web/DESIGN.md`
- Install: `C:\Users\Administrator\.kiro\skills\impeccable\` (copy from the `pbakaus/impeccable` repo's skill folder)

- [ ] **Step 1:** Write `DESIGN.md` by transcribing from `tailwind.config.js` only: palette tokens, fonts, radii, shadows, and the line `Dial: ENERGY 2 / RHYTHM 2 / MOTION 1`. No invented content.
- [ ] **Step 2:** Clone `pbakaus/impeccable` shallow into `%TEMP%`, inspect its skill folder and launcher, copy it to `~/.kiro/skills/impeccable`, delete the temp clone. Confirm `impeccable.exe` runs with `--version`.
- [ ] **Step 3:** With the dev server running on `http://localhost:3100`, run `npx.cmd impeccable detect --json http://localhost:3100/` and the same for `/login`, `/register`, `/forgot-password`, `/about`, `/contact` at default viewport and `--viewport 390x844`. Fix any primary finding it reports.

### Task 8: Verification and Delivery Gate

- [ ] **Step 1:** `npx.cmd tsc --noEmit`, `npm.cmd run lint`, and `npm.cmd run build` in `ifnote-web`; `npx.cmd jest` and `npx.cmd tsc --noEmit` in `ifnote-api`. Expected: no errors (the existing `no-page-custom-font` warning is allowed).
- [ ] **Step 2:** `node scripts/check-pages.mjs http://localhost:3100`. Expected: no FAIL.
- [ ] **Step 3:** Re-run the contrast script for every pair changed in Task 3 and record the ratios.
- [ ] **Step 4:** Click-through list, element by element, recorded as evidence (R-35): header Masuk, Mulai gratis, every CTA, every footer link, login submit empty, register submit empty, password toggle by keyboard, forgot-password mailto, about and contact mailto, privacy and terms nav. If no headless browser is available, say so and verify each by code inspection instead of claiming it was clicked.
- [ ] **Step 5:** Write the antislop Delivery Gate report (four blocks, PASS/FAIL with evidence) in the final message.

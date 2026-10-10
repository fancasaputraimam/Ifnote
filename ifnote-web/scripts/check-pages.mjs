#!/usr/bin/env node
// Static page checks for ifNote.
//   node scripts/check-pages.mjs .next/server/app        (prerendered HTML after `next build`, no server)
//   node scripts/check-pages.mjs http://localhost:3100   (running server)
// One PASS/FAIL line per assertion; exit 1 if any FAIL. Node built-in fetch only.
// Em dash rule: <script>/<style> bodies are dropped (Next.js payloads), the rest of the HTML is scanned.

const arg = process.argv[2] ?? "http://localhost:3100";
const fromDir = !/^https?:\/\//i.test(arg);
const base = arg.replace(/\/+$/, "");
const PAGES = ["/", "/login", "/register", "/forgot-password"];
const REMOVED = ["/about", "/contact", "/privacy", "/terms"];
const EM_DASH = "\u2014";
const CONTACT = "mailto:founder@ifnote.app";

let failed = 0;
const report = (ok, label) => {
  if (!ok) failed += 1;
  console.log(`${ok ? "PASS" : "FAIL"} ${label}`);
};

const stripCode = (html) =>
  html.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "");

// Directory mode reads prerendered HTML from `next build` (e.g. .next/server/app),
// URL mode fetches from a running server. A missing file counts as 404.
async function load(path) {
  if (fromDir) {
    const { readFile } = await import("node:fs/promises");
    const file = `${base}/${path === "/" ? "index" : path.slice(1)}.html`;
    try {
      return { status: 200, html: await readFile(file, "utf8") };
    } catch {
      return { status: 404, html: "" };
    }
  }
  const res = await fetch(base + path);
  return { status: res.status, html: await res.text() };
}

const pages = {};
for (const path of [...PAGES, ...REMOVED]) {
  try {
    const { status, html } = await load(path);
    pages[path] = { status, html, visible: stripCode(html) };
  } catch (err) {
    pages[path] = { status: 0, html: "", visible: "" };
    console.log(`FAIL ${path} unreachable (${err.message})`);
    failed += 1;
  }
}

const has = (path, needle) => pages[path].visible.includes(needle);

// Halaman yang ada dan yang sudah dihapus
for (const path of PAGES) report(pages[path].status === 200, `${path} returns 200 (got ${pages[path].status})`);
for (const path of REMOVED) report(pages[path].status === 404, `${path} is removed (got ${pages[path].status})`);
for (const path of PAGES) {
  const dead = REMOVED.filter((r) => pages[path].visible.includes(`href="${r}"`));
  report(dead.length === 0, `${path} has no links to removed pages${dead.length ? ` (${dead.join(", ")})` : ""}`);
}

// Landing
report(has("/", "Buku catatan bahasa Jepang yang bisa menguji kamu"), "/ server HTML contains the hero headline");
report(!pages["/"].html.includes('aria-label="Memuat"'), "/ server HTML has no loading spinner");
report(!has("/", "N5\u2013N1"), "/ does not claim 'N5-N1' levels");
for (const id of ["tentang", "kontak", "privasi", "ketentuan"]) {
  report(has("/", `id="${id}"`), `/ keeps the ${id} block`);
}
report(has("/", CONTACT), "/ Kontak block links to mailto:founder@ifnote.app");
report(has("/", "Imam Fanca Saputra"), "/ names the maker");
report(/lang="ja"/.test(pages["/"].visible), "/ marks Japanese text with lang=\"ja\"");
report(/property="og:title"/.test(pages["/"].html) && /property="og:image"/.test(pages["/"].html), "/ has Open Graph title and image");
report(/<h2[^>]*class="sr-only"[^>]*>Cara kerja</.test(pages["/"].visible), "/ steps have a parent heading");

// Semua halaman
for (const path of PAGES) report(!pages[path].visible.includes(EM_DASH), `${path} has no em dash`);
for (const path of PAGES) report(!pages[path].html.includes("fonts.googleapis.com"), `${path} does not load Google Fonts CSS`);
for (const path of PAGES) {
  const meta = pages[path].html.match(/<meta[^>]+name="viewport"[^>]*>/i)?.[0] ?? "";
  report(meta !== "" && !/user-scalable=no|maximum-scale/i.test(meta), `${path} viewport allows zoom`);
}
for (const path of ["/login", "/register"]) {
  report(!has(path, "dengan Google"), `${path} has no dead social-login button`);
}

// --- Audit auth 2026-10-09 ---
const AUTH = ["/login", "/register", "/forgot-password"];
for (const path of AUTH) {
  report(!/opacity:0/.test(pages[path].html), `#1 ${path} server HTML is visible without JavaScript (no opacity:0)`);
  report(/lang="ja"/.test(pages[path].visible), `#12 ${path} marks Japanese text with lang="ja"`);
  report(has(path, "ringkasan"), `#5 ${path} consent line says it refers to the landing summaries`);
  report(!/shadow-glow(?!-)/.test(pages[path].visible) && (pages[path].visible.match(/shadow-glow-sm/g) ?? []).length <= 1, `#10 ${path} uses at most one glow`);
}
for (const path of ["/login", "/register"]) {
  report(/<input[^>]*class="[^"]*\btext-base\b/.test(pages[path].visible), `#6 ${path} inputs are 16px on mobile`);
  report(!/ring-paper-300/.test(pages[path].visible), `#4 ${path} input borders use a 3:1 color`);
  report(/aria-label="Tampilkan password"[^>]*class="[^"]*h-11 w-11|class="[^"]*h-11 w-11[^"]*"[^>]*aria-label="Tampilkan password"/.test(pages[path].visible), `#3 ${path} password toggle is 44px`);
}
report(!has("/register", "Konfirmasi password"), "#17 register has no confirm-password field");
report(has("/forgot-password", "Salin alamat"), "#14 forgot-password offers a copy-address button");

console.log(failed === 0 ? "\nALL PASS" : `\n${failed} FAIL`);
process.exit(failed === 0 ? 0 : 1);

/**
 * Sanitization helpers untuk teks user / AI sebelum di-render atau disimpan.
 *
 * Tidak ada `dangerouslySetInnerHTML` di codebase. Helper di sini dipakai
 * sebagai lapisan ekstra untuk konten yang **mungkin** diteruskan ke
 * komponen yang menerima string mentah (mis. CSV export, copy-to-clipboard,
 * atau backend persistence). Frontend rendering JSX otomatis aman dari XSS
 * karena React meng-escape konten teks.
 *
 * Untuk konten Jepang (ruby/furigana), pakai helper di
 * `lib/japanese-text.ts` (yang sudah men-strip tag berbahaya).
 */

const DANGEROUS_TAG_RE =
  /<\s*(?:script|iframe|object|embed|style|link|meta|svg|math|video|audio|frame|frameset)\b[^>]*>[\s\S]*?<\s*\/\s*(?:script|iframe|object|embed|style|link|meta|svg|math|video|audio|frame|frameset)\s*>/gi;
const DANGEROUS_VOID_TAG_RE =
  /<\s*(?:script|iframe|object|embed|style|link|meta|svg|math|video|audio|frame|frameset|input|button|form|textarea|select)\b[^>]*\/?\s*>/gi;
const ON_HANDLER_RE = /\son\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi;
const JS_URL_RE = /javascript\s*:/gi;
const DATA_HTML_URL_RE = /data\s*:\s*text\/html/gi;
const ALL_TAG_RE = /<\/?[a-zA-Z][^>]*>/g;
const HTML_ENTITIES: Array<[RegExp, string]> = [
  [/&nbsp;/g, " "],
  [/&amp;/g, "&"],
  [/&lt;/g, "<"],
  [/&gt;/g, ">"],
  [/&quot;/g, '"'],
  [/&#39;/g, "'"],
];

/**
 * Hapus tag/atribut/URL berbahaya tapi pertahankan struktur teks asli.
 * Cocok untuk konten yang akan disimpan ke DB lalu di-render plain text
 * via React (yang otomatis akan escape).
 *
 *   "<script>alert(1)</script>halo"  -> "halo"
 *   "<a href='javascript:alert(1)'>x</a>"  -> "<a href=''>x</a>"
 *   "<div onclick='x'>halo</div>"    -> "<div>halo</div>"
 */
export function stripDangerousHtml(input: string | null | undefined): string {
  if (!input) return "";
  let out = String(input);
  out = out.replace(DANGEROUS_TAG_RE, "");
  out = out.replace(DANGEROUS_VOID_TAG_RE, "");
  out = out.replace(ON_HANDLER_RE, "");
  out = out.replace(JS_URL_RE, "");
  out = out.replace(DATA_HTML_URL_RE, "");
  return out;
}

/**
 * Plain text murni — semua tag dihapus, entitas di-decode, whitespace
 * dirapikan. Cocok untuk field yang dijamin tidak butuh markup
 * (mis. nama, label, judul kotoba).
 */
export function sanitizePlainText(input: string | null | undefined): string {
  if (!input) return "";
  let out = stripDangerousHtml(String(input));
  out = out.replace(ALL_TAG_RE, "");
  for (const [re, rep] of HTML_ENTITIES) out = out.replace(re, rep);
  return out.replace(/\s+/g, " ").trim();
}

/**
 * Pembersih khusus untuk output AI: strip dangerous HTML, normalize
 * whitespace, tapi pertahankan teks isi (termasuk karakter Jepang &
 * tanda baca CJK). Tidak men-strip ruby tag — pemrosesan ruby ditangani
 * oleh `lib/japanese-text.ts`.
 */
export function cleanAiText(input: string | null | undefined): string {
  if (!input) return "";
  let out = stripDangerousHtml(String(input));
  for (const [re, rep] of HTML_ENTITIES) out = out.replace(re, rep);
  return out.replace(/\s+/g, " ").trim();
}

/**
 * Recursive helper yang dipakai backend pre-persistence: membersihkan
 * tiap field string di sebuah object/array hasil AI sebelum disimpan ke
 * DB. Tidak akan menyentuh non-string (number/boolean/Date).
 */
export function deepCleanAiPayload<T>(value: T): T {
  if (typeof value === "string") {
    return cleanAiText(value) as unknown as T;
  }
  if (Array.isArray(value)) {
    return value.map((v) => deepCleanAiPayload(v)) as unknown as T;
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = deepCleanAiPayload(v);
    }
    return out as T;
  }
  return value;
}

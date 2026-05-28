/**
 * Global Japanese-text parser utilities.
 *
 * Mendukung tiga format reading yang umum dipakai di ifNote:
 *
 *   1. Native ruby HTML:     "<ruby>昼<rt>ひる</rt></ruby>に..."
 *   2. Full-width parens:    "甘い物（あまいもの）"
 *   3. Half-width parens:    "酔(よ)う / 酔(よ)っぱらう"
 *
 * Output: array `RubySegment[]` yang aman di-render React.
 *
 * Tidak ada `dangerouslySetInnerHTML` di seluruh modul ini.
 */

export interface RubySegment {
  /** Visible base text (kanji atau plain). */
  base: string;
  /** Reading kalau ada. Kalau undefined, base di-render apa adanya. */
  reading?: string;
}

/* ------------------------------------------------------------------ */
/* Regex                                                              */
/* ------------------------------------------------------------------ */

const RUBY_RE = /<ruby>(.*?)<rt>(.*?)<\/rt>(?:<\/ruby>)?/gi;
const HTML_TAG_RE = /<\/?[^>]+>/g;
const ENTITIES_RE: Array<[RegExp, string]> = [
  [/&nbsp;/g, " "],
  [/&amp;/g, "&"],
  [/&lt;/g, "<"],
  [/&gt;/g, ">"],
  [/&quot;/g, '"'],
  [/&#39;/g, "'"],
];

// Block satu kanji+okurigana atau kompon kanji yang segera diikuti `(...)`/`（...）`
// Contoh: "甘い物（あまいもの）", "酔(よ)う", "時々(ときどき)"
//   - base: 1+ kanji opsional kana okurigana setelahnya (kana ditangkap masuk base)
//   - reading: di dalam ( ) atau （ ）, harus mengandung kana (hira/kata)
//
// Range:
//   kanji  : \u4E00-\u9FFF\u3400-\u4DBF
//   hira   : \u3041-\u3096
//   kata   : \u30A1-\u30FA\u30FC
//   small/punct: \u3000-\u303F
const KANJI = "\\u4E00-\\u9FFF\\u3400-\\u4DBF";
const HIRA = "\\u3041-\\u3096";
const KATA = "\\u30A1-\\u30FA\\u30FC";

const PAREN_RE = new RegExp(
  // base: at least one kanji, optionally followed by additional kanji or kana
  "([" + KANJI + "][" + KANJI + HIRA + KATA + "]*)" +
    // reading: full-width or half-width parens, with kana inside
    "(?:[\\(（]([" + HIRA + KATA + "]+)[\\)）])",
  "gu",
);

/* ------------------------------------------------------------------ */
/* Sanitization helpers                                               */
/* ------------------------------------------------------------------ */

export function stripRubyHtml(input: string | null | undefined): string {
  if (!input) return "";
  return String(input).replace(RUBY_RE, (_m, base: string) => base);
}

export function stripHtmlTags(input: string | null | undefined): string {
  if (!input) return "";
  let out = String(input).replace(HTML_TAG_RE, "");
  for (const [re, rep] of ENTITIES_RE) out = out.replace(re, rep);
  return out;
}

/**
 * Strip all HTML except `<ruby>` and `<rt>` tags. Used by AI pipeline
 * which wants to keep ruby for FuriganaText to render.
 */
export function stripNonRubyTags(input: string): string {
  let out = input.replace(/<(?!\/?(?:ruby|rt)\b)[^>]+>/gi, "");
  for (const [re, rep] of ENTITIES_RE) out = out.replace(re, rep);
  return out;
}

/* ------------------------------------------------------------------ */
/* Detection                                                           */
/* ------------------------------------------------------------------ */

export function hasJapaneseReading(input: string | null | undefined): boolean {
  if (!input) return false;
  return RUBY_RE.test(input) || (PAREN_RE.test(input) && (PAREN_RE.lastIndex = 0, true));
}

/* ------------------------------------------------------------------ */
/* Parsers                                                            */
/* ------------------------------------------------------------------ */

export interface CleanOpts {
  /**
   * Pertahankan tag `<ruby>...<rt>...</rt></ruby>` di output. Tag HTML
   * lain (`<p>`, `<div>`, dll) tetap di-strip. Default: false.
   */
  preserveRuby?: boolean;
}

/**
 * Bersihkan output: strip HTML, normalize whitespace.
 * Default mode: ruby di-collapse jadi base saja.
 *
 *   "<ruby>昼<rt>ひる</rt></ruby>にごはんを食べます。"
 *   → "昼にごはんを食べます。"
 *
 *   "<p>Hello&nbsp;world</p>"
 *   → "Hello world"
 *
 * `preserveRuby: true`: ruby tags tetap, untuk dirender oleh
 * `JapaneseText` / `FuriganaText`.
 */
export function cleanJapaneseText(input: string | null | undefined, opts?: CleanOpts): string {
  if (!input) return "";
  if (opts?.preserveRuby) {
    return stripNonRubyTags(String(input)).trim();
  }
  // Strip ruby first, then HTML, then collapse whitespace.
  const noRuby = stripRubyHtml(input);
  return stripHtmlTags(noRuby).replace(/\s+/g, " ").trim();
}

/**
 * Convert teks dengan format parenthetical reading jadi
 * `kanji（kana）`-style display string yang plain (tanpa parens).
 * Contoh:
 *   "甘い物（あまいもの）" → "甘い物"
 *   "酔(よ)う / 酔(よ)っぱらう" → "酔う / 酔っぱらう"
 */
export function stripParentheticalReadings(input: string | null | undefined): string {
  if (!input) return "";
  return String(input).replace(PAREN_RE, (_m, base: string) => base);
}

/**
 * Parse string yang mungkin mengandung tag `<ruby>` jadi segmen-segmen.
 */
export function extractRubyFromHtml(input: string | null | undefined): RubySegment[] {
  if (!input) return [];
  const segments: RubySegment[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  RUBY_RE.lastIndex = 0;
  // eslint-disable-next-line no-cond-assign
  while ((m = RUBY_RE.exec(input)) !== null) {
    if (m.index > last) {
      segments.push({ base: stripHtmlTags(input.slice(last, m.index)) });
    }
    segments.push({ base: stripHtmlTags(m[1]), reading: stripHtmlTags(m[2]) });
    last = m.index + m[0].length;
  }
  if (last < input.length) {
    segments.push({ base: stripHtmlTags(input.slice(last)) });
  }
  return segments.filter((s) => s.base.length > 0 || s.reading);
}

/**
 * Parse string yang mungkin mengandung pola parenthetical reading
 * jadi segmen-segmen.
 *
 *   "甘い物（あまいもの）"
 *     → [{ base: "甘い物", reading: "あまいもの" }]
 *
 *   "時々(ときどき)、テスト"
 *     → [{ base: "時々", reading: "ときどき" }, { base: "、テスト" }]
 *
 *   "酔(よ)う / 酔(よ)っぱらう"
 *     → [
 *         { base: "酔", reading: "よ" }, { base: "う / " },
 *         { base: "酔", reading: "よ" }, { base: "っぱらう" }
 *       ]
 */
export function parseParentheticalReadings(input: string | null | undefined): RubySegment[] {
  if (!input) return [];
  const segments: RubySegment[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  PAREN_RE.lastIndex = 0;
  // eslint-disable-next-line no-cond-assign
  while ((m = PAREN_RE.exec(input)) !== null) {
    if (m.index > last) {
      segments.push({ base: input.slice(last, m.index) });
    }
    segments.push({ base: m[1], reading: m[2] });
    last = m.index + m[0].length;
  }
  if (last < input.length) {
    segments.push({ base: input.slice(last) });
  }
  return segments.filter((s) => s.base.length > 0 || s.reading);
}

/**
 * Parse Japanese text dari segala format ke `RubySegment[]`.
 *
 *   1. Cek apakah punya `<ruby>` tags → pakai `extractRubyFromHtml`
 *   2. Strip semua tag HTML lain
 *   3. Cek apakah punya parenthetical readings → pakai
 *      `parseParentheticalReadings`
 *   4. Kalau tidak ada keduanya, return single plain segment.
 */
export function parseJapaneseText(input: string | null | undefined): RubySegment[] {
  if (!input) return [];

  // Path 1: ruby HTML
  RUBY_RE.lastIndex = 0;
  if (RUBY_RE.test(input)) {
    return extractRubyFromHtml(input);
  }

  // Path 2: strip non-ruby HTML, then check for parens
  const cleaned = stripHtmlTags(input);
  PAREN_RE.lastIndex = 0;
  if (PAREN_RE.test(cleaned)) {
    return parseParentheticalReadings(cleaned);
  }

  // Path 3: plain text
  return [{ base: cleaned }];
}

/* ------------------------------------------------------------------ */
/* Reading-to-text alignment                                          */
/* ------------------------------------------------------------------ */

const KANJI_TEST_RE = /[\u4E00-\u9FFF\u3400-\u4DBF\u3005]/;

function isKanjiChar(c: string): boolean {
  return KANJI_TEST_RE.test(c);
}

/**
 * Align full-sentence reading kana ke teks Jepang sehingga `<rt>` hanya
 * muncul di atas RUN kanji. Kana / katakana / tanda baca dirender plain.
 *
 * Algoritma:
 *   - Jalan paralel di kedua string.
 *   - Untuk run non-kanji di text, coba konsumsi karakter yang sama
 *     dari reading; kalau tidak match (mis. text pakai katakana, reading
 *     pakai katakana yang sama), tetap konsumsi 1:1 di bagian yang match.
 *   - Untuk run kanji di text, ambil reading dari posisi sekarang sampai
 *     anchor (karakter non-kanji berikutnya) di reading.
 *
 * Contoh:
 *   text="私は毎朝、コーヒーを飲みます"
 *   reading="わたしはまいあさ、コーヒーをのみます"
 *   → [
 *       {base:"私", reading:"わたし"}, {base:"は"},
 *       {base:"毎朝", reading:"まいあさ"}, {base:"、コーヒーを"},
 *       {base:"飲", reading:"の"}, {base:"みます"}
 *     ]
 *
 * Kalau alignment gagal (mis. reading kosong, atau anchor tidak ditemukan),
 * fallback degradasi alami: kanji run akan menyerap sisa reading; tidak
 * pernah taruh `<rt>` di atas kana murni.
 */
export function alignReadingToText(
  text: string,
  reading: string,
): RubySegment[] {
  if (!text) return [];
  if (!reading) return [{ base: text }];

  const segs: RubySegment[] = [];
  let ti = 0;
  let ri = 0;

  while (ti < text.length) {
    if (!isKanjiChar(text[ti])) {
      // ---- run karakter non-kanji (kana, punctuation, latin, dll) ----
      let plain = "";
      while (ti < text.length && !isKanjiChar(text[ti])) {
        const ch = text[ti];
        plain += ch;
        // Konsumsi 1:1 di reading kalau karakternya sama. Kalau beda
        // (mis. AI hilangkan tanda baca di reading), biarkan ri menunggu
        // sampai anchor kanji berikutnya.
        if (ri < reading.length && reading[ri] === ch) ri++;
        ti++;
      }
      if (plain) segs.push({ base: plain });
    } else {
      // ---- run kanji ----
      let kanjiRun = "";
      const kanjiStart = ri;
      while (ti < text.length && isKanjiChar(text[ti])) {
        kanjiRun += text[ti];
        ti++;
      }
      // Setiap kanji butuh minimal 1 karakter reading. Anchor search
      // dimulai setelah min-length supaya kanji yang readingnya sama
      // dengan okurigana berikutnya tidak "hilang" (mis. 聞き → きき).
      const minRead = kanjiRun.length;
      let kanjiReading = "";
      if (ti >= text.length) {
        // kanji run di akhir teks → ambil sisa reading
        kanjiReading = reading.slice(kanjiStart);
        ri = reading.length;
      } else {
        const anchor = text[ti];
        const found = reading.indexOf(anchor, kanjiStart + minRead);
        if (found === -1) {
          kanjiReading = reading.slice(kanjiStart);
          ri = reading.length;
        } else {
          kanjiReading = reading.slice(kanjiStart, found);
          ri = found;
        }
      }
      if (kanjiReading) {
        segs.push({ base: kanjiRun, reading: kanjiReading });
      } else {
        segs.push({ base: kanjiRun });
      }
    }
  }

  return segs;
}

/**
 * Recursively clean every string in a response object via cleanJapaneseText.
 * Aman dipanggil di response apapun selama tidak ada `Date` / `Map` / `Set`.
 */
export function cleanJapaneseResponse<T>(value: T, opts?: CleanOpts): T {
  if (typeof value === "string") {
    return cleanJapaneseText(value, opts) as unknown as T;
  }
  if (Array.isArray(value)) {
    return value.map((v) => cleanJapaneseResponse(v, opts)) as unknown as T;
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = cleanJapaneseResponse(v, opts);
    }
    return out as T;
  }
  return value;
}

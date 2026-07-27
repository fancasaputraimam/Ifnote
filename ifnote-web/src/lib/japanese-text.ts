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

/**
 * True kalau string punya minimal satu karakter kanji. Dipakai untuk
 * menentukan apakah perlu menampilkan helper reading line di mode
 * Pemula — kalau teks cuma kana, tidak perlu helper.
 */
const KANJI_DETECT_RE = /[\u4E00-\u9FFF\u3400-\u4DBF\u3005]/;
export function hasKanji(input: string | null | undefined): boolean {
  if (!input) return false;
  return KANJI_DETECT_RE.test(String(input));
}

/**
 * Pure plain string of base text — ruby tags collapsed, parens stripped,
 * HTML tags stripped, whitespace normalized. Aman dipakai untuk
 * comparison (mis. "reading equals text") atau untuk truncate.
 */
export function plainJapaneseText(input: string | null | undefined): string {
  if (!input) return "";
  return stripParentheticalReadings(
    stripHtmlTags(stripRubyHtml(String(input))),
  )
    .replace(/\s+/g, " ")
    .trim();
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

/**
 * @deprecated Pakai `parseJapaneseText`. Alias dipertahankan untuk
 * konsistensi naming dengan PRD PART 5.
 */
export const parseJapaneseReadingText = parseJapaneseText;

/* ------------------------------------------------------------------ */
/* Reading-to-text alignment                                          */
/* ------------------------------------------------------------------ */

const KANJI_TEST_RE = /[\u4E00-\u9FFF\u3400-\u4DBF\u3005]/;

function isKanjiChar(c: string): boolean {
  return KANJI_TEST_RE.test(c);
}

/** Katakana → hiragana untuk perbandingan kana saja (tidak mengubah teks). */
function toHiraganaChar(c: string): string {
  const code = c.charCodeAt(0);
  // Katakana block 0x30A1..0x30F6 → hiragana dengan offset 0x60.
  if (code >= 0x30a1 && code <= 0x30f6) return String.fromCharCode(code - 0x60);
  return c;
}

/** True kalau dua karakter sama secara kana-insensitive (パ === ぱ). */
function kanaCharEq(a: string, b: string): boolean {
  return toHiraganaChar(a) === toHiraganaChar(b);
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
        // Konsumsi 1:1 di reading kalau karakternya sama (kana-insensitive,
        // jadi パン di teks cocok dengan ぱん di reading). Kalau beda
        // (mis. AI hilangkan tanda baca di reading), biarkan ri menunggu
        // sampai anchor kanji berikutnya.
        if (ri < reading.length && kanaCharEq(reading[ri], ch)) ri++;
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
        // Cari anchor secara kana-insensitive supaya katakana di teks
        // (mis. partikel setelah コーヒー) tetap cocok dengan hiragana reading.
        let found = -1;
        for (let k = kanjiStart + minRead; k < reading.length; k++) {
          if (kanaCharEq(reading[k], anchor)) {
            found = k;
            break;
          }
        }
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

/* ------------------------------------------------------------------ */
/* Safe ruby builder for example sentences                            */
/* ------------------------------------------------------------------ */

const SENTENCE_PUNCT_RE = /[\u3002\uFF01\uFF1F\u3001\uFF0E]/; // 。！？、．

/**
 * Heuristic: apakah teks ini terlihat seperti kalimat penuh, bukan satu
 * kata atau frasa pendek.
 *
 * True kalau:
 *   - mengandung tanda baca akhir kalimat Jepang (。 ！ ？) atau koma 、
 *   - panjang teks > 12 karakter setelah strip whitespace
 *
 * False untuk satu kata / frasa singkat:
 *   - "黒い", "慣れる", "形", "食べ物", "甜い物", "〜ながら", "〜ていく"
 *
 * Catatan: contoh kalimat di app biasanya memiliki tanda baca akhir,
 * jadi heuristik ini cukup. Untuk kasus aneh (sentence tanpa tanda baca
 * dan < 13 char), caller harus secara eksplisit pass `sentenceMode: true`
 * — yang memang sudah dilakukan untuk semua example-rendering callsite.
 */
export function isFullSentence(text: string | null | undefined): boolean {
  if (!text) return false;
  const trimmed = String(text).trim();
  if (!trimmed) return false;
  if (SENTENCE_PUNCT_RE.test(trimmed)) return true;
  if (trimmed.length > 12) return true;
  return false;
}

/* ------------------------------------------------------------------ */
/* Reading <-> sentence match safety check                            */
/* ------------------------------------------------------------------ */

const KANA_ONLY_RE =
  /^[\u3041-\u3096\u30A1-\u30FA\u30FC\u3000-\u303F\s\u3001\u3002\uFF01\uFF1F\uFF0E\uFF0C0-9A-Za-z\u30FB]+$/;

/**
 * Pasangan kanji → reading-substring yang umum. Dipakai untuk validasi
 * cepat: kalau kalimat mengandung kanji X tapi reading-nya tidak
 * mengandung kana yang diharapkan, kemungkinan besar reading itu milik
 * kalimat LAIN (bug "reuse reading" yang dilaporkan).
 *
 * Daftar ini sengaja kecil & high-signal — hanya kanji yang sering
 * muncul di contoh kalimat beginner. Tidak perlu sempurna; cukup untuk
 * menangkap mismatch yang jelas-jelas salah.
 */
const KANJI_READING_HINTS: Array<[string, string[]]> = [
  ["\u671d", ["\u3042\u3055"]],
  ["\u98df", ["\u305f", "\u3057\u3087\u304f"]],
  ["\u8a66\u9a13", ["\u3057\u3051\u3093"]],
  ["\u5fa9\u7fd2", ["\u3075\u304f\u3057\u3085\u3046"]],
  ["\u5f62", ["\u304b\u305f\u3061", "\u304c\u305f"]],
  ["\u732b", ["\u306d\u3053"]],
  ["\u9ed2", ["\u304f\u308d"]],
  ["\u4e38", ["\u307e\u308b"]],
  ["\u7bb1", ["\u306f\u3053"]],
  ["\u56db\u89d2", ["\u3057\u304b\u304f"]],
];

/**
 * Validasi ringan apakah `reading` masuk akal sebagai pembacaan dari
 * `sentence`. Tujuan utama: mencegah よみ line yang JELAS salah (reading
 * milik kalimat lain) tampil di UI.
 *
 * Aturan (longgar, by design):
 *   1. reading wajib kana-heavy (hampir seluruhnya kana/tanda baca).
 *   2. untuk tiap pasangan kanji-hint yang muncul di kalimat, reading
 *      harus mengandung salah satu kana yang diharapkan. Kalau kalimat
 *      punya 試験 tapi reading tidak mengandung しけん → mismatch.
 *   3. perbandingan panjang kasar: reading kalimat tidak boleh jauh
 *      lebih pendek dari jumlah karakter non-spasi kalimat.
 *
 * Return true kalau reading kemungkinan cocok (atau tidak ada sinyal
 * mismatch). Return false hanya kalau ada sinyal mismatch yang jelas.
 */
export function isReadingLikelyForSentence(
  sentence: string | null | undefined,
  reading: string | null | undefined,
): boolean {
  const s = String(sentence ?? "").trim();
  const r = String(reading ?? "").trim();
  if (!s || !r) return false;

  // (1) reading harus kana-heavy.
  if (!KANA_ONLY_RE.test(r)) return false;

  // (2) kanji-hint check.
  for (const [kanji, expectedKana] of KANJI_READING_HINTS) {
    if (s.includes(kanji)) {
      const hit = expectedKana.some((k) => r.includes(k));
      if (!hit) return false;
    }
  }

  // (3) rough length sanity.
  const sLen = s.replace(/\s/g, "").length;
  const rLen = r.replace(/\s/g, "").length;
  if (sLen >= 6 && rLen < Math.floor(sLen * 0.5)) return false;

  return true;
}

/**
 * Output dari `buildSafeRubySegments`. `reliable=false` artinya UI harus
 * menampilkan teks plain (tanpa ruby) dan opsional menunjukkan
 * `helperReading` di bawah teks (mis. "よみ: …").
 */
export interface SafeRubyResult {
  segments: RubySegment[];
  reliable: boolean;
  helperReading?: string;
}

export interface BuildSafeRubyOptions {
  /**
   * True kalau teks ini adalah contoh kalimat — dalam mode ini, kita
   * **tidak pernah** memaksa alignment full-sentence reading. Kalau
   * tidak ada cara aman bikin ruby word-level (mis. tag <ruby> eksplisit
   * atau parens), kembalikan plain segments + helperReading.
   */
  sentenceMode?: boolean;
}

/**
 * Bangun ruby segments yang "aman" untuk dirender. Pakai ini untuk
 * konten yang mungkin berupa kalimat penuh (mis. contoh kalimat di
 * Catatan/Hafalan) supaya kita tidak menyiarkan furigana yang berantakan
 * di atas seluruh kalimat.
 *
 * Ringkas algoritma:
 *
 *   1. Ada tag `<ruby><rt>...` di teks  →  segments aman, reliable=true.
 *   2. Ada parenthetical reading        →  segments aman, reliable=true.
 *   3. sentenceMode=false (kata/frasa) +
 *      reading tersedia                 →  align reading → segments,
 *                                          reliable=true.
 *   4. sentenceMode=true + reading      →  plain segments,
 *                                          reliable=false,
 *                                          helperReading=reading.
 *   5. Tidak ada reading                →  plain segments,
 *                                          reliable=true (karena tidak
 *                                          ada upaya alignment yang
 *                                          bisa salah).
 */
/**
 * Validasi apakah hasil `alignReadingToText` benar-benar merekonstruksi
 * `reading` asli. Kalau cocok (kana-insensitive, abaikan tanda baca/spasi),
 * alignment dianggap reliable dan aman dipakai sebagai furigana. Kalau
 * tidak, caller harus fallback ke helper `よみ:` line.
 *
 * Ini mencegah furigana berantakan: kalau satu kanji-run menyerap reading
 * milik kata lain, rekonstruksi tidak akan sama dengan reading asli.
 */
function isAlignmentReliable(
  segments: RubySegment[],
  reading: string,
): boolean {
  if (segments.length === 0) return false;
  // Harus ada minimal satu segmen dengan reading (kalau tidak, tidak ada
  // furigana yang dihasilkan → bukan "reliable furigana").
  if (!segments.some((s) => s.reading)) return false;

  // Rekonstruksi pembacaan penuh: untuk segmen kanji pakai reading-nya,
  // untuk segmen kana pakai base-nya.
  const rebuilt = segments.map((s) => s.reading ?? s.base).join("");

  const norm = (x: string) =>
    Array.from(x)
      .map(toHiraganaChar)
      .join("")
      // buang spasi + tanda baca Jepang/latin yang sering beda antara
      // teks dan reading.
      .replace(/[\s\u3000\u3001\u3002\uFF01\uFF1F\uFF0E\uFF0C.,!?]/g, "");

  return norm(rebuilt) === norm(reading);
}

export function buildSafeRubySegments(
  text: string | null | undefined,
  reading: string | null | undefined,
  options: BuildSafeRubyOptions = {},
): SafeRubyResult {
  const raw = String(text ?? "");
  if (!raw) {
    return { segments: [], reliable: true };
  }

  // Kasus 1: ruby HTML eksplisit. Aman — rt diberikan word-level oleh
  // pemberi data (biasanya AI dengan struktur eksplisit).
  RUBY_RE.lastIndex = 0;
  if (RUBY_RE.test(raw)) {
    return {
      segments: extractRubyFromHtml(raw),
      reliable: true,
    };
  }

  // Kasus 2: parenthetical reading ("黒(くろ)い", "甜い物（あまいもの）").
  // Strip non-ruby HTML first supaya pola di dalam tag tidak ikut.
  const cleaned = stripHtmlTags(raw);
  PAREN_RE.lastIndex = 0;
  if (PAREN_RE.test(cleaned)) {
    return {
      segments: parseParentheticalReadings(cleaned),
      reliable: true,
    };
  }

  const trimmedReading = (reading ?? "").trim();
  const sentence = options.sentenceMode === true || isFullSentence(cleaned);

  // Kasus 3: kata atau frasa pendek + reading → alignment dipercaya.
  if (!sentence && trimmedReading) {
    return {
      segments: alignReadingToText(cleaned, trimmedReading),
      reliable: true,
    };
  }

  // Kasus 4: kalimat penuh + reading. Coba bikin furigana word-level via
  // alignment. Kalau hasilnya merekonstruksi reading dengan tepat (reliable),
  // pakai sebagai furigana (rt hanya di atas kanji-run). Kalau tidak
  // reliable, fallback ke kanji bersih + helper `よみ:` line — tapi hanya
  // kalau reading masuk akal untuk kalimat ini (cegah reading milik kalimat
  // lain karena bug reuse).
  if (sentence && trimmedReading) {
    const likely = isReadingLikelyForSentence(cleaned, trimmedReading);
    if (likely) {
      const aligned = alignReadingToText(cleaned, trimmedReading);
      if (isAlignmentReliable(aligned, trimmedReading)) {
        return { segments: aligned, reliable: true };
      }
    }
    return {
      segments: [{ base: cleaned }],
      reliable: false,
      helperReading: likely ? trimmedReading : undefined,
    };
  }

  // Kasus 5: tidak ada reading sama sekali → plain text aman.
  return {
    segments: [{ base: cleaned }],
    reliable: true,
  };
}


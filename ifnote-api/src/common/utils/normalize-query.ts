/**
 * Query-string normalization helpers untuk lookup database-first.
 *
 * Kontrak:
 *   - trim spasi
 *   - normalize full-width \u2192 half-width untuk angka & latin
 *   - lowercase romaji/latin
 *   - strip tanda baca yang tidak penting (selain "\u301c" untuk bunpou)
 *   - PRESERVE karakter Jepang (hiragana/katakana/kanji)
 *
 * Tujuannya bukan deteksi bahasa, cuma membuat string yang \"konsisten\"
 * untuk indexed-equality match di Postgres (mode: insensitive).
 */

const FULLWIDTH_DIGIT = /[\uFF10-\uFF19]/g;
const FULLWIDTH_LATIN = /[\uFF21-\uFF3A\uFF41-\uFF5A]/g;

/** Karakter Jepang (hiragana, katakana, kanji, half-width katakana, \u30FC, \u301C). */
const JP_CHAR = /[\u3000-\u303F\u3040-\u309F\u30A0-\u30FF\uFF66-\uFF9F\u4E00-\u9FFF]/;

function fullToHalf(s: string): string {
  return s
    .replace(FULLWIDTH_DIGIT, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(FULLWIDTH_LATIN, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0));
}

/** Punctuation yang aman dihapus untuk semua mode. */
function stripCommonPunct(s: string): string {
  // \u3000\u3001\u3002\uFF0E\uFF0C\uFF1F\uFF01\uFF1A\uFF1B \u2014 IDEOGRAPHIC + FW
  return s
    .replace(/[\u3000\u3001\u3002\uFF0E\uFF0C\uFF1F\uFF01\uFF1A\uFF1B]/g, " ")
    .replace(/[.,;:!?]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Normalisasi umum: pakai untuk JP/Indonesian/mixed.
 * Tidak menghapus \u301C karena dipakai bunpou (\"\u301Cながら\").
 */
export function normalizeJapaneseQuery(input: string): string {
  if (!input) return "";
  const half = fullToHalf(input);
  const stripped = stripCommonPunct(half);
  return stripped.toLowerCase();
}

/** Untuk Tambah Kotoba lookup: sama dengan general normalize. */
export function normalizeKotobaQuery(input: string): string {
  return normalizeJapaneseQuery(input);
}

/**
 * Untuk Bunpou: pertahankan \u301C tapi rapikan posisi.
 * Misal \"\u301C ながら\" \u2192 \"\u301Cながら\".
 */
export function normalizeBunpouQuery(input: string): string {
  if (!input) return "";
  const base = normalizeJapaneseQuery(input);
  return base.replace(/\u301c\s+/g, "\u301c").replace(/\s+\u301c/g, "\u301c");
}

/**
 * Untuk Kanji popup: ambil 1 karakter Jepang pertama.
 * Kalau input kosong / tidak ada karakter Jepang valid, return string kosong
 * dan caller harus reject.
 */
export function normalizeKanjiQuery(input: string): string {
  if (!input) return "";
  const trimmed = input.trim();
  for (const ch of trimmed) {
    if (JP_CHAR.test(ch)) return ch;
  }
  return "";
}

/** True kalau string mengandung minimal 1 karakter Jepang. */
export function hasJapanese(input: string): boolean {
  return JP_CHAR.test(input);
}

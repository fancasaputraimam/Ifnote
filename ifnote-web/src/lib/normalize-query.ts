/**
 * Frontend mirror of `ifnote-api/src/common/utils/normalize-query.ts`.
 * Tetap dibuat dua sisi karena beberapa caller (mis. duplicate detection
 * sebelum kirim request) jalan di browser.
 *
 * Kontrak:
 *   - trim spasi
 *   - normalize full-width \u2192 half-width untuk angka & latin
 *   - lowercase romaji/latin
 *   - strip tanda baca yang tidak penting (kecuali \u301C utk bunpou)
 *   - PRESERVE karakter Jepang (hiragana/katakana/kanji)
 */

const FULLWIDTH_DIGIT = /[\uFF10-\uFF19]/g;
const FULLWIDTH_LATIN = /[\uFF21-\uFF3A\uFF41-\uFF5A]/g;
const JP_CHAR =
  /[\u3000-\u303F\u3040-\u309F\u30A0-\u30FF\uFF66-\uFF9F\u4E00-\u9FFF]/;

function fullToHalf(s: string): string {
  return s
    .replace(FULLWIDTH_DIGIT, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(FULLWIDTH_LATIN, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0));
}

function stripCommonPunct(s: string): string {
  return s
    .replace(/[\u3000\u3001\u3002\uFF0E\uFF0C\uFF1F\uFF01\uFF1A\uFF1B]/g, " ")
    .replace(/[.,;:!?]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeJapaneseQuery(input: string): string {
  if (!input) return "";
  return stripCommonPunct(fullToHalf(input)).toLowerCase();
}

export function normalizeKotobaQuery(input: string): string {
  return normalizeJapaneseQuery(input);
}

export function normalizeBunpouQuery(input: string): string {
  if (!input) return "";
  const base = normalizeJapaneseQuery(input);
  return base.replace(/\u301c\s+/g, "\u301c").replace(/\s+\u301c/g, "\u301c");
}

export function normalizeKanjiQuery(input: string): string {
  if (!input) return "";
  for (const ch of input.trim()) {
    if (JP_CHAR.test(ch)) return ch;
  }
  return "";
}

export function hasJapanese(input: string): boolean {
  return JP_CHAR.test(input);
}

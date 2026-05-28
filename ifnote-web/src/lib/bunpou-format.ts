/**
 * Bunpou-specific text parsers. Backend AI bisa balikin formula/kesalahan
 * umum dalam berbagai bentuk:
 *   - JSON terstruktur baru (formulaPatterns[], transformExamples[], …)
 *   - Plain text gabungan ("Kata Kerja … + ながら Contoh: 食べます → 食べながら")
 *   - List bernomor ("1. ... 2. ... 3. ...")
 *
 * Helper di file ini menyatukan semuanya menjadi struktur kanonik yang
 * dipakai oleh komponen detail di Catatan dan Hafalan.
 */

import {
  formatCommonMistakes,
  splitParagraphs,
} from "@/lib/text-format";

export interface TransformExample {
  from: string;
  to: string;
}

export interface BunpouExplanationView {
  /** Pola dasar (tiap baris = 1 pattern). */
  formulaLines: string[];
  /** Contoh perubahan kata kerja/sifat. */
  transformExamples: TransformExample[];
  /** Paragraf "Kapan dipakai". */
  usageParagraphs: string[];
  /** Daftar kesalahan umum. */
  commonMistakes: string[];
}

/** Ambil baris formula dari teks bebas. */
export function splitFormulaLines(text: string | null | undefined): string[] {
  if (!text) return [];
  // Strip "Contoh: ..." inline yang sering AI tempelkan ke akhir formula.
  const withoutInlineExamples = text
    .replace(/Contoh\s*perubahan\s*[:：][\s\S]*$/i, "")
    .replace(/Contoh\s*[:：][\s\S]*?(?=(?:\n|$))/g, "")
    .trim();

  // Prefer explicit newlines.
  if (/\n/.test(withoutInlineExamples)) {
    return withoutInlineExamples
      .split(/\r?\n+/)
      .map((s) => s.replace(/^[•*\-\u3001\s]+/, "").trim())
      .filter(Boolean);
  }

  // Some AI outputs use "Kata Kerja…" twice separated by ". ". Split that.
  // Heuristic: if string contains ". Kata " pattern, treat each "Kata "
  // chunk as its own line.
  if (/\.\s+(?:Kata|Verb|Adjective|Adj\b|Noun)\s+/i.test(withoutInlineExamples)) {
    return withoutInlineExamples
      .split(/\.\s+(?=Kata\s|Verb\s|Adjective\s|Adj\b|Noun\s)/i)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  return [withoutInlineExamples];
}

/** Detect "X → Y" / "X -> Y" transform pairs in any free text. */
export function extractTransformExamples(
  text: string | null | undefined,
): TransformExample[] {
  if (!text) return [];
  const cleaned = text.replace(/[、，]/g, ",");
  const matches = Array.from(
    cleaned.matchAll(/([^\s,;:]+)\s*(?:→|->)\s*([^\s,;:]+)/g),
  );
  return matches.map((m) => ({ from: m[1].trim(), to: m[2].trim() }));
}

/** Wrapper untuk usage — re-export `splitParagraphs`. */
export function splitUsageParagraphs(
  text: string | null | undefined,
): string[] {
  return splitParagraphs(text);
}

/** Wrapper untuk kesalahan umum — re-export `formatCommonMistakes`. */
export function splitCommonMistakes(
  text: string | null | undefined,
): string[] {
  return formatCommonMistakes(text);
}

/**
 * Single entry-point: ambil semua field detail Bunpou yang ada, kembalikan
 * struktur kanonik yang siap di-render. Ini yang dipakai komponen detail.
 */
export function buildBunpouExplanationView(detail: {
  formula?: string | null;
  usage?: string | null;
  commonMistake?: string | null;
}): BunpouExplanationView {
  const formulaText = detail.formula ?? "";

  // Pisah formula vs contoh perubahan dari satu blok.
  const formulaLines = splitFormulaLines(formulaText);
  const transformFromFormula = extractTransformExamples(formulaText);

  return {
    formulaLines,
    transformExamples: transformFromFormula,
    usageParagraphs: splitUsageParagraphs(detail.usage),
    commonMistakes: splitCommonMistakes(detail.commonMistake),
  };
}

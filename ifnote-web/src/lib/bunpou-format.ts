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
  splitNumberedList,
  splitParagraphs,
} from "@/lib/text-format";

export interface TransformExample {
  from: string;
  to: string;
}

/** Parsed example: 1 sentence + optional reading + optional meaning. */
export interface ExampleSentence {
  jp: string;
  reading?: string;
  meaning?: string;
}

export interface BunpouExplanationView {
  /** Pola dasar (tiap baris = 1 pattern). */
  formulaLines: string[];
  /** Contoh perubahan kata kerja/sifat. */
  transformExamples: TransformExample[];
  /** Paragraf "Kapan dipakai". */
  usageParagraphs: string[];
  /** Contoh kalimat lengkap (jp + reading + arti) per baris. */
  exampleSentences: ExampleSentence[];
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
 * Pisah "normalExample" yang berisi banyak kalimat ber-nomor menjadi
 * array {jp, reading, meaning}. Setiap pasangan dipasangkan ber-index.
 *
 * Input contoh:
 *   normalExample   = "1. これから日本語が上手になっていきます。\n2. 弁当を持っていきます。"
 *   exampleReading  = "1. これからにほんごがじょうずになっていきます。\n2. べんとうをもっていきます。"
 *   exampleMeaning  = "1. Mulai sekarang...\n2. Saya akan membawa bekal."
 *
 * Output:
 *   [
 *     { jp: "これから日本語が上手になっていきます。", reading: "これからにほんごがじょうずになっていきます。", meaning: "Mulai sekarang..." },
 *     { jp: "弁当を持っていきます。", reading: "べんとうをもっていきます。", meaning: "Saya akan membawa bekal." },
 *   ]
 *
 * Kalau hanya ada satu kalimat, return [{jp, reading, meaning}] dengan
 * field yang ada saja. Kalau jumlah jp/reading/meaning tidak match
 * jumlahnya, sisanya jadi undefined per index.
 */
export function splitNumberedExamples(
  jpText: string | null | undefined,
  readingText?: string | null,
  meaningText?: string | null,
): ExampleSentence[] {
  const jp = (jpText ?? "").trim();
  if (!jp) return [];

  const jpItems = splitNumberedList(jp);
  // Kalau cuma satu item, splitNumberedList tetap balikin satu string
  // (whole input). Pakai sebagai single example.
  if (jpItems.length <= 1) {
    return [
      {
        jp: jpItems[0] ?? jp,
        reading: (readingText ?? "").trim() || undefined,
        meaning: (meaningText ?? "").trim() || undefined,
      },
    ];
  }

  const readingItems = readingText ? splitNumberedList(readingText) : [];
  const meaningItems = meaningText ? splitNumberedList(meaningText) : [];

  return jpItems.map((s, i) => ({
    jp: s,
    reading: readingItems[i]?.trim() || undefined,
    meaning: meaningItems[i]?.trim() || undefined,
  }));
}

/**
 * Single entry-point: ambil semua field detail Bunpou yang ada, kembalikan
 * struktur kanonik yang siap di-render. Ini yang dipakai komponen detail.
 */
export function buildBunpouExplanationView(detail: {
  formula?: string | null;
  usage?: string | null;
  commonMistake?: string | null;
  /** Bisa berisi 1 kalimat atau numbered list "1. ... 2. ...". */
  normalExample?: string | null;
  beginnerExample?: string | null;
  exampleReading?: string | null;
  exampleMeaning?: string | null;
}): BunpouExplanationView {
  const formulaText = detail.formula ?? "";

  // Pisah formula vs contoh perubahan dari satu blok.
  const formulaLines = splitFormulaLines(formulaText);
  const transformFromFormula = extractTransformExamples(formulaText);

  // Examples: prefer normalExample (more polished); fall back to
  // beginnerExample if normal kosong.
  const baseJp = detail.normalExample ?? detail.beginnerExample ?? "";
  const exampleSentences = splitNumberedExamples(
    baseJp,
    detail.exampleReading,
    detail.exampleMeaning,
  ).filter((e) => e.jp.length > 0);

  return {
    formulaLines,
    transformExamples: transformFromFormula,
    usageParagraphs: splitUsageParagraphs(detail.usage),
    exampleSentences,
    commonMistakes: splitCommonMistakes(detail.commonMistake),
  };
}

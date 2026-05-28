/**
 * Normalize raw AI response objects into the canonical write-payload
 * shapes used by Add Kotoba/Bunpou dialogs.
 *
 * Different AI providers / prompts use different keys for the same
 * concept (reading vs kana vs furigana, normalExample vs example, etc).
 * The normalizers in this file collapse all known aliases into the
 * canonical fields, so the UI never loses furigana/reading.
 */

import type { JlptLevel } from "@/lib/types";

/* -------------- helpers ------------------------------------------- */

function pickStr(...values: unknown[]): string {
  for (const v of values) {
    if (typeof v === "string" && v.trim().length > 0) return v.trim();
  }
  return "";
}

function safeLevel(v: unknown): JlptLevel | undefined {
  const s = String(v ?? "").toUpperCase();
  return s === "N5" || s === "N4" || s === "N3" || s === "N2" || s === "N1"
    ? (s as JlptLevel)
    : undefined;
}

/* -------------- kotoba -------------------------------------------- */

export interface NormalizedKotoba {
  jp: string;
  reading: string;
  romaji: string;
  meaning: string;
  type: string;
  level: JlptLevel | "";
  beginnerExample: string;
  normalExample: string;
  furiganaExample: string;
  exampleReading: string;
  exampleMeaning: string;
  note: string;
  /** Bahasa input yang user ketik, sesuai deteksi AI. */
  inputLanguage?: "japanese" | "indonesian" | "mixed" | "unknown";
  /** Teks asli user; berguna untuk preview "Input: ...". */
  sourceInput?: string;
}

/**
 * Accept any AI response shape and reduce to NormalizedKotoba.
 *
 * Aliases recognized:
 *   jp        ← jp | word | japanese | term | kotoba | topic
 *   reading   ← reading | kana | yomi | furigana | hiragana | kanaReading
 *   example   ← normalExample | beginnerExample | example | exampleJp
 *   exampleR  ← exampleReading | exampleKana | exampleFurigana | readingExample
 */
export function normalizeAiKotobaResult(
  raw: Record<string, unknown> | null | undefined,
): NormalizedKotoba {
  const r = (raw ?? {}) as Record<string, unknown>;
  const example = pickStr(r.normalExample, r.beginnerExample, r.example, r.exampleJp);
  const lang = String(r.inputLanguage ?? "").toLowerCase();
  const inputLanguage =
    lang === "japanese" || lang === "indonesian" || lang === "mixed"
      ? (lang as NormalizedKotoba["inputLanguage"])
      : undefined;
  return {
    jp: pickStr(r.jp, r.word, r.japanese, r.term, r.kotoba, r.topic),
    reading: pickStr(r.reading, r.kana, r.yomi, r.furigana, r.hiragana, r.kanaReading),
    romaji: pickStr(r.romaji, r.romanization),
    meaning: pickStr(r.meaning, r.arti, r.translation),
    type: pickStr(r.type, r.partOfSpeech, r.pos),
    level: safeLevel(r.level) ?? "",
    beginnerExample: pickStr(r.beginnerExample, example),
    normalExample: pickStr(r.normalExample, example),
    furiganaExample: pickStr(r.furiganaExample, r.exampleFurigana),
    exampleReading: pickStr(
      r.exampleReading,
      r.exampleKana,
      r.exampleFurigana,
      r.readingExample,
    ),
    exampleMeaning: pickStr(r.exampleMeaning, r.exampleTranslation, r.translationExample),
    note: pickStr(r.note, r.catatan, r.tip),
    inputLanguage,
    sourceInput: pickStr(r.sourceInput, r.input) || undefined,
  };
}

/* -------------- bunpou -------------------------------------------- */

export interface NormalizedBunpou {
  pattern: string;
  reading: string;
  meaning: string;
  formula: string;
  usage: string;
  level: JlptLevel | "";
  beginnerExample: string;
  normalExample: string;
  furiganaExample: string;
  exampleReading: string;
  exampleMeaning: string;
  note: string;
  commonMistake: string;
  inputLanguage?: "japanese" | "indonesian" | "mixed" | "unknown";
  sourceInput?: string;
  /** True kalau pattern di-detect dari kalimat penuh. */
  detectedFromSentence?: boolean;
}

/**
 * Accept rich JSON (formulaPatterns/transformExamples/usage[]/examples[]/
 * commonMistakes[]) AND legacy flat shape ({formula, usage, example, …}).
 * Always emit canonical strings used by the form fields.
 */
export function normalizeAiBunpouResult(
  raw: Record<string, unknown> | null | undefined,
): NormalizedBunpou {
  const r = (raw ?? {}) as Record<string, unknown>;

  // Compose formula from formulaPatterns + transformExamples (if present).
  let formula = pickStr(r.formula);
  if (!formula && Array.isArray(r.formulaPatterns)) {
    const lines = (r.formulaPatterns as unknown[]).filter(
      (s): s is string => typeof s === "string" && s.length > 0,
    );
    formula = lines.join("\n");
    if (Array.isArray(r.transformExamples)) {
      const transforms = (r.transformExamples as unknown[])
        .map((t) => {
          if (t && typeof t === "object") {
            const o = t as { from?: unknown; to?: unknown };
            const from = typeof o.from === "string" ? o.from : "";
            const to = typeof o.to === "string" ? o.to : "";
            return from && to ? `${from} → ${to}` : "";
          }
          return "";
        })
        .filter(Boolean);
      if (transforms.length) {
        formula = `${formula}\n\nContoh perubahan:\n${transforms.join("\n")}`.trim();
      }
    }
  }

  // Usage can be array or string.
  let usage = "";
  if (Array.isArray(r.usage)) {
    usage = (r.usage as unknown[])
      .filter((s): s is string => typeof s === "string" && s.length > 0)
      .join("\n\n");
  } else {
    usage = pickStr(r.usage, r.kapanDipakai);
  }

  // commonMistakes can be array or string.
  let commonMistake = "";
  if (Array.isArray(r.commonMistakes)) {
    commonMistake = (r.commonMistakes as unknown[])
      .filter((s): s is string => typeof s === "string" && s.length > 0)
      .map((s, i) => `${i + 1}. ${s}`)
      .join("\n");
  } else {
    commonMistake = pickStr(r.commonMistake, r.mistakes);
  }

  // Pull first example for the legacy single-example fields.
  const examplesArr = Array.isArray(r.examples) ? (r.examples as unknown[]) : [];
  const ex0 = examplesArr[0] as
    | { jp?: unknown; reading?: unknown; meaning?: unknown }
    | undefined;
  const exJp =
    pickStr(ex0?.jp) ||
    pickStr(r.normalExample, r.beginnerExample, r.example, r.exampleJp);
  const exReading =
    pickStr(ex0?.reading) ||
    pickStr(
      r.exampleReading,
      r.exampleKana,
      r.exampleFurigana,
      r.readingExample,
    );
  const exMeaning = pickStr(ex0?.meaning) || pickStr(r.exampleMeaning);

  const lang = String(r.inputLanguage ?? "").toLowerCase();
  const inputLanguage =
    lang === "japanese" || lang === "indonesian" || lang === "mixed"
      ? (lang as NormalizedBunpou["inputLanguage"])
      : undefined;

  return {
    pattern: pickStr(r.pattern, r.bunpou, r.grammar),
    reading: pickStr(r.reading, r.kana, r.yomi, r.furigana, r.hiragana),
    meaning: pickStr(r.meaning, r.arti, r.translation),
    formula,
    usage,
    level: safeLevel(r.level) ?? "",
    beginnerExample: pickStr(r.beginnerExample, exJp),
    normalExample: pickStr(r.normalExample, exJp),
    furiganaExample: pickStr(r.furiganaExample, r.exampleFurigana),
    exampleReading: exReading,
    exampleMeaning: exMeaning,
    note: pickStr(r.note, r.catatan, r.tip),
    commonMistake,
    inputLanguage,
    sourceInput: pickStr(r.sourceInput, r.input) || undefined,
    detectedFromSentence: r.detectedFromSentence === true,
  };
}

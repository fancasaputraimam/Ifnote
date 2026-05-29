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
  beginnerExampleReading: string;
  beginnerExampleMeaning: string;
  normalExample: string;
  normalExampleReading: string;
  normalExampleMeaning: string;
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

  const beginnerExample = pickStr(r.beginnerExample, example);
  const normalExample = pickStr(r.normalExample, example);

  // Shared/legacy fields. exampleReading historically = reading dari
  // normalExample, exampleMeaning = arti dari normalExample.
  const sharedReading = pickStr(
    r.exampleReading,
    r.exampleKana,
    r.exampleFurigana,
    r.readingExample,
  );
  const sharedMeaning = pickStr(
    r.exampleMeaning,
    r.exampleTranslation,
    r.translationExample,
    r.artiContoh,
    r.aiExampleMeaning,
    r.meaningExample,
    r.exampleIndonesian,
    r.sentenceMeaning,
    r.sentenceTranslation,
    r.contohArti,
    r.artiKalimatContoh,
    r.kalimatContohMeaning,
  );

  // Per-example reading + meaning. ATURAN KETAT (spec PART 3):
  //   - beginnerExampleReading HANYA dari field beginner-spesifik.
  //     JANGAN fallback ke shared/normal reading (itu bug "reuse").
  //   - normalExampleReading dari field normal-spesifik, fallback ke
  //     shared exampleReading (yang memang reading kalimat normal).
  //   - Pengecualian: kalau beginnerExample === normalExample (kalimat
  //     sama persis), reading shared boleh dipakai untuk keduanya.
  const sameSentence =
    !!beginnerExample && beginnerExample === normalExample;

  const beginnerExampleReading = pickStr(
    r.beginnerExampleReading,
    r.beginnerReading,
    sameSentence ? sharedReading : "",
  );
  const beginnerExampleMeaning = pickStr(
    r.beginnerExampleMeaning,
    sameSentence ? sharedMeaning : "",
  );
  const normalExampleReading = pickStr(
    r.normalExampleReading,
    r.normalReading,
    sharedReading,
  );
  const normalExampleMeaning = pickStr(
    r.normalExampleMeaning,
    sharedMeaning,
  );

  return {
    jp: pickStr(r.jp, r.word, r.japanese, r.term, r.kotoba, r.topic),
    reading: pickStr(r.reading, r.kana, r.yomi, r.furigana, r.hiragana, r.kanaReading),
    romaji: pickStr(r.romaji, r.romanization),
    meaning: pickStr(r.meaning, r.arti, r.translation),
    type: pickStr(r.type, r.partOfSpeech, r.pos),
    level: safeLevel(r.level) ?? "",
    beginnerExample,
    beginnerExampleReading,
    beginnerExampleMeaning,
    normalExample,
    normalExampleReading,
    normalExampleMeaning,
    furiganaExample: pickStr(r.furiganaExample, r.exampleFurigana),
    // exampleReading/exampleMeaning = alias normal* untuk backward compat.
    exampleReading: normalExampleReading,
    exampleMeaning: normalExampleMeaning,
    note: pickStr(r.note, r.catatan, r.tip),
    inputLanguage,
    sourceInput: pickStr(r.sourceInput, r.input) || undefined,
  };
}

/* -------------- example meaning validation ----------------------- */

/**
 * True if the AI returned a normalExample but its exampleMeaning is
 * missing or trivially equal to the kotoba meaning (which means it
 * cannot be a sentence translation). Used by the AI preview UI to
 * surface a "Arti contoh belum lengkap" warning and disable Save.
 *
 * Rules per project spec PART 5/9:
 *   - normalExample exists, exampleMeaning empty   → incomplete
 *   - normalExample exists, exampleMeaning equal to kotoba meaning   → incomplete
 *     (only when normalExample is clearly a full sentence — i.e.
 *      contains 。/、/.,/space, or longer than the kotoba itself)
 */
export function hasIncompleteExampleMeaning(d: {
  meaning: string;
  normalExample: string;
  exampleMeaning: string;
}): boolean {
  const example = (d.normalExample ?? "").trim();
  if (!example) return false;
  const meaning = (d.meaning ?? "").trim().toLowerCase();
  const exMeaning = (d.exampleMeaning ?? "").trim().toLowerCase();

  if (!exMeaning) return true;

  // Only treat as incomplete when the example reads like a full sentence:
  //   - has Japanese sentence terminator 。 or comma 、
  //   - or has whitespace (multi-word)
  //   - or is materially longer than the kotoba meaning
  const looksLikeSentence =
    /[。、.,!?！？]/.test(example) ||
    /\s/.test(example) ||
    example.length > Math.max(8, meaning.length + 4);

  if (!looksLikeSentence) return false;

  // exampleMeaning must not be a verbatim copy of the kotoba meaning.
  return exMeaning === meaning;
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

  // Pull all examples (rich or legacy aliases) into one canonical array.
  // We use this to (a) provide ex0 as the legacy single-example fallback
  // and (b) serialize multiple examples as a numbered string into the
  // flat DB fields so detail views can split them back out cleanly.
  const examplesRich = (
    Array.isArray(r.examples)
      ? (r.examples as unknown[])
      : Array.isArray(r.exampleSentences)
        ? (r.exampleSentences as unknown[])
        : []
  )
    .map((x) => {
      if (!x || typeof x !== "object") return null;
      const o = x as { jp?: unknown; reading?: unknown; meaning?: unknown };
      const jp = typeof o.jp === "string" ? o.jp.trim() : "";
      if (!jp) return null;
      return {
        jp,
        reading: typeof o.reading === "string" ? o.reading.trim() : "",
        meaning: typeof o.meaning === "string" ? o.meaning.trim() : "",
      };
    })
    .filter((x): x is { jp: string; reading: string; meaning: string } => !!x);

  // Pull first example for the legacy single-example fields.
  const ex0 = examplesRich[0];
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
  const exMeaning =
    pickStr(ex0?.meaning) ||
    pickStr(
      r.exampleMeaning,
      r.exampleTranslation,
      r.translationExample,
      r.artiContoh,
      r.aiExampleMeaning,
      r.normalExampleMeaning,
      r.beginnerExampleMeaning,
      r.meaningExample,
      r.exampleIndonesian,
      r.sentenceMeaning,
      r.sentenceTranslation,
      r.contohArti,
      r.artiKalimatContoh,
      r.kalimatContohMeaning,
    );

  // If AI returned multiple examples, serialize them as numbered text
  // into the flat DB fields. The Catatan detail view splits these back
  // out via splitNumberedExamples (lib/bunpou-format.ts) so the user
  // sees one row per example with paired reading/meaning.
  let multiJp = "";
  let multiReading = "";
  let multiMeaning = "";
  if (examplesRich.length > 1) {
    multiJp = examplesRich.map((e, i) => `${i + 1}. ${e.jp}`).join("\n");
    if (examplesRich.some((e) => e.reading)) {
      multiReading = examplesRich
        .map((e, i) => `${i + 1}. ${e.reading || ""}`)
        .join("\n");
    }
    if (examplesRich.some((e) => e.meaning)) {
      multiMeaning = examplesRich
        .map((e, i) => `${i + 1}. ${e.meaning || ""}`)
        .join("\n");
    }
  }

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
    beginnerExample: pickStr(r.beginnerExample, multiJp || exJp),
    normalExample: pickStr(r.normalExample, multiJp || exJp),
    furiganaExample: pickStr(r.furiganaExample, r.exampleFurigana),
    exampleReading: multiReading || exReading,
    exampleMeaning: multiMeaning || exMeaning,
    note: pickStr(r.note, r.catatan, r.tip),
    commonMistake,
    inputLanguage,
    sourceInput: pickStr(r.sourceInput, r.input) || undefined,
    detectedFromSentence: r.detectedFromSentence === true,
  };
}

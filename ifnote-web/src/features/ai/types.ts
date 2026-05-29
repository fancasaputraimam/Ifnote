/**
 * Type-stable response shapes that mirror the backend AI proxy.
 * Backend selalu balikin source="ai". Kalau AI tidak siap, backend
 * lempar 503 — caller tangkap di mutation onError.
 */

import type { JlptLevel } from "@/lib/types";

export type AiMode =
  | "explain-kotoba"
  | "explain-bunpou"
  | "correct-sentence"
  | "make-example"
  | "generate-quiz"
  | "create-hafalan"
  | "bulk-kotoba"
  | "analyze-sentence";

export interface AiEnvelope<T> {
  source: "ai";
  data: T;
}

export interface ExplainKotobaData {
  topic: string;
  meaning: string;
  type: string;
  level: JlptLevel | string;
  romaji: string;
  example: string;
  exampleMeaning: string;
  note: string;
}

export interface ExplainBunpouData {
  pattern: string;
  meaning: string;
  formula: string;
  usage: string;
  example: string;
  exampleMeaning: string;
  commonMistake: string;
}

export interface CorrectSentenceData {
  input: string;
  corrected: string;
  explanation: string;
  issues?: Array<{ text: string; suggestion: string }>;
}

export interface MakeExampleData {
  topic: string;
  examples: Array<{ jp: string; meaning: string }>;
}

export interface GenerateQuizData {
  topic: string;
  questions: Array<{
    prompt: string;
    choices: Array<{ id: string; label: string }>;
    correctChoiceId: string;
    explanation?: string;
  }>;
}

export interface CreateHafalanData {
  title: string;
  summary: string;
  items: Array<{
    itemType: "kotoba" | "bunpou";
    jpOrPattern: string;
    meaning: string;
  }>;
}

export interface BulkKotobaItem {
  jp: string;
  status: "new" | "exists" | "manual";
  sourceInput?: string;
  inputLanguage?: "japanese" | "indonesian" | "mixed" | "unknown";
  meaning?: string;
  reading?: string;
  romaji?: string;
  type?: string;
  level?: string;
  beginnerExample?: string;
  normalExample?: string;
  exampleReading?: string;
  exampleMeaning?: string;
  /** ID kotoba yang sudah tersimpan kalau status === "exists". */
  existingId?: string | null;
}
export interface BulkKotobaData {
  items: BulkKotobaItem[];
}

export interface AnalyzeSentenceData {
  sentence: string;
  meaning: string;
  bunpouFound: Array<{ pattern: string; meaning: string }>;
  kotobaFound: Array<{ jp: string; meaning: string }>;
  particles: Array<{ symbol: string; role: string }>;
  recommendations: string[];
}

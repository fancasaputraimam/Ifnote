/**
 * Lightweight input-language detector dipakai untuk membedakan apakah
 * user mengetik Bahasa Indonesia, Jepang, campuran, atau pola
 * grammar di alur Add Kotoba/Bunpou.
 *
 * Pure functions, tidak ada side-effect, mudah di-unit-test.
 *
 * Pemakaian utama: hint ke UI (placeholder berbeda) dan tebakan awal
 * sebelum AI dipanggil. AI tetap final source of truth untuk konversi
 * Indonesia → Jepang.
 */

const HIRAGANA_RE = /[\u3040-\u309F]/;
const KATAKANA_RE = /[\u30A0-\u30FF]/;
const KANJI_RE = /[\u4E00-\u9FFF\u3400-\u4DBF]/;
const JP_PUNCT_RE = /[\u3000-\u303F]/; // 、。「」『』〜・
const JP_GRAMMAR_MARK_RE = /[\u301C\u3030]/; // 〜 〰

/** Tanda Bahasa Indonesia "kuat" — kalau salah satu muncul tanpa kanji,
 *  kita anggap input ID, walaupun mengandung sedikit huruf kana. */
const ID_HINT_RE =
  /\b(yang|adalah|untuk|dari|dengan|atau|dan|saya|kamu|dia|kami|itu|ini|sambil|setelah|sebelum|karena|kalau|ketika|harus|boleh|ingin|bentuk|pola|kata|kosakata|grammar|bunpou|kotoba|tata bahasa|jepang|jepan|arti|berarti|makna|terjemahan|kalimat|contoh|seperti|seperti)\b/i;

/** Heuristic kuat untuk pola bunpou (Jepang). */
const JP_BUNPOU_HINTS = [
  "ながら",
  "てから",
  "たい",
  "てもいい",
  "なければならない",
  "なくてはいけない",
  "ないでください",
  "たことがある",
  "ことができる",
  "つもり",
  "そう",
  "ようだ",
  "らしい",
  "はず",
  "べき",
  "とき",
  "あいだ",
  "ながら",
];

/** Heuristic untuk Indonesia menyiratkan grammar (bunpou). */
const ID_BUNPOU_HINTS = [
  "pola",
  "grammar",
  "bunpou",
  "tata bahasa",
  "sambil",
  "setelah",
  "sebelum",
  "karena",
  "kalau",
  "ketika",
  "harus",
  "boleh",
  "ingin",
  "bentuk",
  "saat",
  "selama",
  "ketika",
  "supaya",
];

export function isProbablyJapanese(text: string): boolean {
  if (!text) return false;
  return (
    HIRAGANA_RE.test(text) ||
    KATAKANA_RE.test(text) ||
    KANJI_RE.test(text) ||
    JP_GRAMMAR_MARK_RE.test(text) ||
    JP_PUNCT_RE.test(text)
  );
}

export function isProbablyIndonesian(text: string): boolean {
  if (!text) return false;
  // Latin-only + recognisable Indonesian word
  const hasLatin = /[a-zA-Z]/.test(text);
  if (!hasLatin) return false;
  if (isProbablyJapanese(text)) {
    // Mixed → bukan ID murni; tapi kalau ada kata penanda jelas (untuk,
    // sambil, dst) kita masih anggap "indonesian intent".
    return ID_HINT_RE.test(text);
  }
  return true;
}

export type StudyInputLanguage =
  | "japanese"
  | "indonesian"
  | "mixed"
  | "unknown";
export type StudyInputIntent = "kotoba" | "bunpou" | "sentence" | "unknown";

export interface StudyInputDetection {
  language: StudyInputLanguage;
  intent: StudyInputIntent;
}

/**
 * Tebak bahasa + niat user. Hasilnya hanya hint untuk UI; AI tetap
 * dipanggil dengan input mentah dan menjadi sumber kebenaran.
 */
export function detectStudyInputType(text: string): StudyInputDetection {
  const trimmed = text.trim();
  if (!trimmed) return { language: "unknown", intent: "unknown" };

  const jp = isProbablyJapanese(trimmed);
  const id = isProbablyIndonesian(trimmed);

  let language: StudyInputLanguage = "unknown";
  if (jp && id) language = "mixed";
  else if (jp) language = "japanese";
  else if (id) language = "indonesian";

  // Intent detection
  const lower = trimmed.toLowerCase();
  const isLikelyBunpouJp = JP_BUNPOU_HINTS.some((h) => trimmed.includes(h));
  const isLikelyBunpouId = ID_BUNPOU_HINTS.some((h) =>
    new RegExp(`\\b${escapeRegex(h)}\\b`, "i").test(lower),
  );
  const hasJpPunct = /[。、！？!?]/.test(trimmed);
  // Sentence detection: panjang dan ada tanda baca / multiple words
  const wordsLatin = trimmed.split(/\s+/).filter(Boolean);
  const isLongJpSentence = jp && trimmed.length > 12 && hasJpPunct;
  const isLongIdSentence = id && wordsLatin.length >= 5;

  let intent: StudyInputIntent = "unknown";
  if (isLikelyBunpouJp || isLikelyBunpouId) intent = "bunpou";
  else if (isLongJpSentence || isLongIdSentence) intent = "sentence";
  else if (jp && trimmed.length <= 6) intent = "kotoba";
  else if (id && wordsLatin.length <= 4) intent = "kotoba";

  return { language, intent };
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

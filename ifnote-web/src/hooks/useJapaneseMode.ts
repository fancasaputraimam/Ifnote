"use client";

/**
 * Single source of truth for Japanese display mode (Pemula / Normal /
 * Pro). All Japanese rendering should consume this hook indirectly
 * through `<JapaneseText />`. Direct use is allowed for special cases
 * (e.g. KanjiPopup, AppearanceSection preview) but never invent another
 * mode state somewhere else.
 *
 * Mode mapping (spec final):
 *   - "beginner" → Pemula : hiragana/katakana saja sebagai teks utama
 *                           (tanpa kanji, tanpa furigana, tanpa よみ)
 *   - "normal"   → Normal : kanji + furigana (atau よみ helper kalau
 *                           alignment tidak reliable)
 *   - "pro"      → Pro    : kanji bersih, tanpa furigana / よみ
 *
 * Source:
 *   - server settings via `useSettings()`  (TanStack Query key: ["settings"])
 *   - fallback "beginner" (paling aman untuk pemula) kalau belum loaded
 *
 * Live update:
 *   - `useUpdateSettings()` calls `qc.setQueryData(["settings"], data)`
 *     so this hook re-renders subscribers immediately, no manual reload.
 */

import { useSettings } from "@/features/settings/useSettings";
import type { JpMode } from "@/lib/types";

const FALLBACK: JpMode = "beginner";

export interface JapaneseModeState {
  jpMode: JpMode;
  /** True kalau mode Pemula (kana-only sebagai teks utama). */
  isBeginner: boolean;
  /** True kalau mode Normal (kanji + furigana). */
  isNormal: boolean;
  /** True kalau mode Pro (kanji bersih). */
  isPro: boolean;
  /** True kalau JapaneseText harus render `<rt>` di atas kanji. */
  showFurigana: boolean;
  /** True kalau teks utama harus berupa kana (kanji diganti reading). */
  replaceKanjiWithKana: boolean;
}

export function useJapaneseMode(): JapaneseModeState {
  const settingsQ = useSettings();
  const jpMode: JpMode = normalizeJpMode(settingsQ.data?.jpMode);
  const isBeginner = jpMode === "beginner";
  const isNormal = jpMode === "normal";
  const isPro = jpMode === "pro";
  return {
    jpMode,
    isBeginner,
    isNormal,
    isPro,
    showFurigana: isNormal,
    replaceKanjiWithKana: isBeginner,
  };
}

/**
 * Normalisasi semua nilai `jpMode` (canonical baru + legacy) ke nilai
 * canonical: "beginner" | "normal" | "pro".
 *
 * Canonical baru:
 *   "beginner" | "normal" | "pro"  → apa adanya
 *
 * Legacy (skema lama internal kana/furigana/kanji):
 *   "kana"     → "beginner"  (Pemula = kana only)
 *   "furigana" → "normal"    (Normal = kanji + furigana)
 *   "kanji"    → "pro"        (Pro = kanji bersih)
 *
 * Legacy lain yang mungkin nyangkut di backup/cache:
 *   "advanced" / "clean"     → "pro"
 *
 * undefined / tak dikenal    → "beginner" (fallback default Pemula)
 */
export function normalizeJpMode(value: unknown): JpMode {
  if (value === "beginner" || value === "normal" || value === "pro") {
    return value;
  }
  if (value === "kana") return "beginner";
  if (value === "furigana") return "normal";
  if (value === "kanji") return "pro";
  if (value === "advanced" || value === "clean") return "pro";
  return FALLBACK;
}

"use client";

/**
 * Single source of truth for Japanese display mode (Pemula / Normal /
 * Pro). All Japanese rendering should consume this hook indirectly
 * through `<JapaneseText />`. Direct use is allowed for special cases
 * (e.g. KanjiPopup, AppearanceSection preview) but never invent another
 * mode state somewhere else.
 *
 * Mode mapping:
 *   - "kana"     → Pemula  : hiragana/katakana saja (kanji → reading)
 *   - "furigana" → Normal  : kanji + furigana di atasnya
 *   - "kanji"    → Pro     : kanji bersih, tanpa furigana
 *
 * Source:
 *   - server settings via `useSettings()`  (TanStack Query key: ["settings"])
 *   - fallback "kana" (paling aman untuk pemula) kalau belum loaded
 *
 * Live update:
 *   - `useUpdateSettings()` calls `qc.setQueryData(["settings"], data)`
 *     so this hook re-renders subscribers immediately, no manual reload.
 */

import { useSettings } from "@/features/settings/useSettings";
import type { JpMode } from "@/lib/types";

const FALLBACK: JpMode = "kana";

export interface JapaneseModeState {
  jpMode: JpMode;
  /** True kalau mode Pemula (kana-only). */
  isKana: boolean;
  /** True kalau mode Normal (kanji + furigana). */
  isFurigana: boolean;
  /** True kalau mode Pro (kanji bersih). */
  isKanji: boolean;
  /** True kalau JapaneseText harus render `<rt>` di atas kanji. */
  showFurigana: boolean;
  /** True kalau kanji harus diganti dengan reading kana. */
  replaceKanjiWithKana: boolean;
}

export function useJapaneseMode(): JapaneseModeState {
  const settingsQ = useSettings();
  const jpMode: JpMode = normalizeJpMode(settingsQ.data?.jpMode);
  const isKana = jpMode === "kana";
  const isFurigana = jpMode === "furigana";
  const isKanji = jpMode === "kanji";
  return {
    jpMode,
    isKana,
    isFurigana,
    isKanji,
    showFurigana: isFurigana,
    replaceKanjiWithKana: isKana,
  };
}

/**
 * Convert legacy `JpMode` values yang mungkin masih nyangkut di browser
 * cache (TanStack persisted query, atau backup JSON lama) ke nilai
 * canonical baru.
 *
 *   "beginner"  → "furigana"  (lama beginner = furigana + helper line)
 *   "normal"    → "kanji"     (lama normal = kanji bersih)
 *   "furigana"  → "furigana"  (sama)
 *   "kana"      → "kana"
 *   "kanji"     → "kanji"
 *   undefined   → "kana"      (fallback default Pemula)
 */
export function normalizeJpMode(value: unknown): JpMode {
  if (value === "kana" || value === "furigana" || value === "kanji") {
    return value;
  }
  if (value === "beginner") return "furigana";
  if (value === "normal") return "kanji";
  return FALLBACK;
}

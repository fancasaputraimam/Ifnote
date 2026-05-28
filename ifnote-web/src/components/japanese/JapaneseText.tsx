"use client";

import { Fragment, ReactNode, useState } from "react";
import { useSettings } from "@/features/settings/useSettings";
import { KanjiPopup } from "@/features/kanji/KanjiPopup";
import {
  alignReadingToText,
  parseJapaneseText,
  stripParentheticalReadings,
  stripHtmlTags,
  type RubySegment,
} from "@/lib/japanese-text";
import { cn } from "@/lib/utils";
import type { JpMode } from "@/lib/types";

const KANJI_RE = /([\u4E00-\u9FFF\u3400-\u4DBF])/g;

interface Props {
  /**
   * Plain text Japanese. Boleh mengandung tag `<ruby>` atau format
   * parenthetical reading "kanji（kana）" / "kanji(kana)".
   */
  text?: string | null;
  /** Reading tunggal kalau backend menyediakannya secara terpisah. */
  reading?: string | null;
  /** Pre-parsed segments. Override `text` kalau diberikan. */
  ruby?: RubySegment[];
  /**
   * Override JP display mode. Kalau tidak diset, ambil dari user settings.
   *  - "beginner" / "furigana" → tampilkan reading di atas kanji
   *  - "normal" → plain Japanese
   */
  mode?: JpMode;
  /** Suppress klik kanji untuk buka KanjiPopup. */
  inert?: boolean;
  className?: string;
  /** Class untuk `<rt>` element (furigana). */
  rtClassName?: string;
  /** Default true — kalau tidak ada ruby HTML, coba parse parens. */
  fallbackToParsedParentheses?: boolean;
}

/**
 * Komponen tunggal global untuk render teks Jepang dengan dukungan
 * furigana. Pakai komponen ini di mana saja teks Jepang muncul:
 * Catatan, Hafalan, Quiz, Home, Kanji popup.
 *
 * Behavior:
 *  - Mode "beginner" / "furigana": render reading di atas kanji
 *    pakai native `<ruby><rt>`. Reading bisa dari:
 *      a. prop `ruby={[...]}` (pre-parsed)
 *      b. tag `<ruby>` di `text`
 *      c. parenthetical reading di `text` ("甘い物（あまいもの）")
 *      d. prop `reading` (single reading untuk seluruh `text`)
 *  - Mode "normal": render plain Japanese, strip parens dan tag.
 *  - Klik kanji buka KanjiPopup (kecuali `inert`).
 *  - Tidak ada `dangerouslySetInnerHTML` di mana pun.
 */
export function JapaneseText({
  text,
  reading,
  ruby,
  mode,
  inert,
  className,
  rtClassName,
  fallbackToParsedParentheses = true,
}: Props) {
  const settingsQ = useSettings();
  const effectiveMode: JpMode = mode ?? settingsQ.data?.jpMode ?? "beginner";
  const [openKanji, setOpenKanji] = useState<string | null>(null);

  const showFurigana = effectiveMode !== "normal";

  // Resolve segments based on inputs.
  let segments: RubySegment[] = [];
  if (ruby && ruby.length > 0) {
    segments = ruby;
  } else if (text && reading && showFurigana) {
    // Reading lengkap (mis. seluruh hiragana sebuah kalimat) — align ke
    // run kanji saja supaya `<rt>` tidak muncul di atas kana/tanda baca.
    segments = alignReadingToText(stripHtmlTags(text), reading);
  } else if (text) {
    if (showFurigana && fallbackToParsedParentheses) {
      segments = parseJapaneseText(text);
    } else {
      // Normal mode: just clean everything to plain text.
      const plain = stripParentheticalReadings(stripHtmlTags(text));
      segments = [{ base: plain }];
    }
  }

  if (segments.length === 0) return null;

  // Render kanji-by-kanji clickable for the base, ruby <rt> for the reading.
  const renderBase = (s: string, keyPrefix: string): ReactNode[] => {
    const out: ReactNode[] = [];
    let last = 0;
    let m: RegExpExecArray | null;
    KANJI_RE.lastIndex = 0;
    // eslint-disable-next-line no-cond-assign
    while ((m = KANJI_RE.exec(s)) !== null) {
      if (m.index > last) out.push(s.slice(last, m.index));
      const ch = m[0];
      const idx = m.index;
      out.push(
        inert ? (
          <span key={`${keyPrefix}-k-${idx}`}>{ch}</span>
        ) : (
          <span
            key={`${keyPrefix}-k-${idx}`}
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              setOpenKanji(ch);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
                setOpenKanji(ch);
              }
            }}
            className="inline cursor-pointer rounded px-0.5 underline-offset-2 decoration-dotted decoration-accent-300 hover:bg-accent-50 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 dark:hover:bg-accent-700/20"
            aria-label={`Lihat info kanji ${ch}`}
          >
            {ch}
          </span>
        ),
      );
      last = idx + ch.length;
    }
    if (last < s.length) out.push(s.slice(last));
    return out;
  };

  return (
    <span className={cn("font-jp", className)}>
      {segments.map((seg, i) => {
        if (seg.reading && showFurigana) {
          return (
            <ruby key={`r-${i}`}>
              {renderBase(seg.base, `r-${i}`)}
              <rt className={cn("text-ink-400", rtClassName)}>{seg.reading}</rt>
            </ruby>
          );
        }
        return (
          <Fragment key={`p-${i}`}>{renderBase(seg.base, `p-${i}`)}</Fragment>
        );
      })}
      {!inert ? (
        <KanjiPopup
          open={!!openKanji}
          kanji={openKanji}
          onClose={() => setOpenKanji(null)}
        />
      ) : null}
    </span>
  );
}

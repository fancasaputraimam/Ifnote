"use client";

import { Fragment, ReactNode, useState } from "react";
import { KanjiPopup } from "@/features/kanji/KanjiPopup";

const KANJI_RE = /([\u4E00-\u9FFF\u3400-\u4DBF])/g;

interface Props {
  text: string | null | undefined;
  className?: string;
  /** Suppress click-to-open behaviour. Useful inside other interactive cards. */
  inert?: boolean;
}

/**
 * Renders Japanese text and turns each kanji character into a clickable
 * inline button that opens KanjiPopup. Other characters (kana, romaji,
 * punctuation) render as plain text.
 *
 * Real ruby/furigana from the data is rendered as-is via dangerouslySetInnerHTML
 * — but that's only used in the dedicated FuriganaText helper. This component
 * handles plain text.
 */
export function ClickableKanji({ text, className, inert }: Props) {
  const [open, setOpen] = useState<string | null>(null);

  if (!text) return null;

  const parts: ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  // reset state on each render
  KANJI_RE.lastIndex = 0;
  // eslint-disable-next-line no-cond-assign
  while ((match = KANJI_RE.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(text.slice(last, match.index));
    }
    const ch = match[0];
    const idx = match.index;
    parts.push(
      inert ? (
        <span key={`k-${idx}`} className="font-jp">{ch}</span>
      ) : (
        <button
          key={`k-${idx}`}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setOpen(ch);
          }}
          className="font-jp inline rounded px-0.5 underline-offset-2 decoration-dotted decoration-accent-300 hover:bg-accent-50 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 dark:hover:bg-accent-700/20"
          aria-label={`Lihat info kanji ${ch}`}
        >
          {ch}
        </button>
      ),
    );
    last = idx + ch.length;
  }
  if (last < text.length) parts.push(text.slice(last));

  return (
    <span className={className}>
      {parts.map((p, i) => (
        <Fragment key={i}>{p}</Fragment>
      ))}
      {!inert ? (
        <KanjiPopup open={!!open} kanji={open} onClose={() => setOpen(null)} />
      ) : null}
    </span>
  );
}

"use client";

import { Fragment, ReactNode, useState } from "react";
import { useJapaneseMode } from "@/hooks/useJapaneseMode";
import { KanjiPopup } from "@/features/kanji/KanjiPopup";
import {
  alignReadingToText,
  buildSafeRubySegments,
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
   * Override JP display mode. Kalau tidak diset, ambil dari user settings
   * via `useJapaneseMode()`.
   *
   *   - "kana"     : hiragana/katakana saja (kanji diganti reading)
   *   - "furigana" : kanji + furigana di atasnya
   *   - "kanji"    : kanji bersih, tanpa furigana
   */
  mode?: JpMode;
  /** Suppress klik kanji untuk buka KanjiPopup. */
  inert?: boolean;
  className?: string;
  /** Class untuk `<rt>` element (furigana). */
  rtClassName?: string;
  /** Default true — kalau tidak ada ruby HTML, coba parse parens. */
  fallbackToParsedParentheses?: boolean;
  /**
   * True untuk teks contoh kalimat. Cegah furigana berantakan di atas
   * kalimat penuh: kalau alignment tidak reliable, render kalimat
   * bersih + (di mode Pemula) helper line `よみ: …` di bawahnya.
   */
  sentenceMode?: boolean;
  /** Class untuk helper line (よみ: …) di bawah teks saat sentenceMode. */
  helperClassName?: string;
}

/**
 * Komponen tunggal global untuk render teks Jepang. Pakai komponen ini
 * di mana saja teks Jepang muncul: Catatan, Hafalan, Quiz, Home, Kanji
 * popup, AI preview, Bulk preview.
 *
 * Mode behaviour:
 *   - "kana"     (Pemula) : kanji diganti reading kana. Kalau tidak ada
 *                           reading, fallback ke teks asli (mis. kalau
 *                           kata cuma kana, atau backend tidak supply
 *                           reading) — tidak pernah error.
 *   - "furigana" (Normal) : kanji ditampilkan dengan furigana di atasnya
 *                           pakai native `<ruby><rt>`. Reading sumber:
 *                             a. prop `ruby={[...]}` (pre-parsed)
 *                             b. tag `<ruby>...<rt>...</rt></ruby>` di `text`
 *                             c. parens "甘い物（あまいもの）"
 *                             d. prop `reading` (single reading)
 *   - "kanji"    (Pro)    : plain Japanese, tanpa furigana / parens.
 *
 * Klik kanji buka KanjiPopup (kecuali `inert` true). Tidak ada
 * `dangerouslySetInnerHTML` di komponen ini.
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
  sentenceMode = false,
  helperClassName,
}: Props) {
  const { jpMode: globalMode } = useJapaneseMode();
  const effectiveMode: JpMode = mode ?? globalMode;
  const [openKanji, setOpenKanji] = useState<string | null>(null);

  const isKana = effectiveMode === "kana";
  const isFurigana = effectiveMode === "furigana";
  // const isKanji = effectiveMode === "kanji";

  // Resolve segments based on inputs.
  // Rule of thumb:
  //   - kalau ada ruby pre-parsed → pakai
  //   - kalau sentenceMode=true → buildSafeRubySegments (cegah ruby
  //     berantakan di atas kalimat penuh)
  //   - kalau ada `text` + `reading` (frasa pendek) → align ke run kanji
  //   - kalau text punya parens / ruby tags → parse
  //   - kalau tidak → single plain segment
  let segments: RubySegment[] = [];
  let helperReading: string | null = null;
  let reliable = true;
  if (ruby && ruby.length > 0) {
    segments = ruby;
  } else if (sentenceMode) {
    const r = buildSafeRubySegments(text ?? "", reading ?? "", {
      sentenceMode: true,
    });
    segments = r.segments;
    reliable = r.reliable;
    helperReading = r.helperReading ?? null;
  } else if (text && reading) {
    // Align selalu, even di mode Pro/kanji — supaya kana mode bisa pakai
    // segment.reading untuk replace kanji. Mode Pro nanti collapse ke base.
    segments = alignReadingToText(stripHtmlTags(text), reading);
  } else if (text) {
    // Coba parse parens / ruby tags. Kalau tidak ketemu, single segment.
    if (fallbackToParsedParentheses) {
      segments = parseJapaneseText(text);
    } else {
      segments = [
        { base: stripParentheticalReadings(stripHtmlTags(text)) },
      ];
    }
  }

  if (segments.length === 0) return null;

  // Helper line untuk mode Pemula (kana). Spec: tampilkan "よみ: …" di
  // bawah kalimat kalau ruby tidak reliable. Untuk mode Furigana &
  // Kanji, helper tidak ditampilkan supaya UI tetap bersih.
  const helperNode =
    sentenceMode && !reliable && helperReading && isKana ? (
      <span
        className={cn(
          "mt-1 block text-xs text-ink-400",
          helperClassName,
        )}
      >
        よみ: <span className="font-jp">{helperReading}</span>
      </span>
    ) : null;

  // ---- Mode "kana" (Pemula) -----------------------------------------
  // Kanji diganti reading. Kalau segment tidak punya reading dan base-nya
  // mengandung kanji, kita biarkan kanji-nya (better than empty) dan
  // tetap tidak render furigana. Ini terjadi kalau backend tidak supply
  // reading untuk item tersebut.
  if (isKana) {
    const out: ReactNode[] = [];
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      if (seg.reading) {
        out.push(
          <span key={`k-${i}`} className="font-jp">
            {seg.reading}
          </span>,
        );
      } else {
        // Plain kana / latin / punctuation — render apa adanya. Kalau
        // base mengandung kanji (sentence mode + unreliable),
        // pertahankan kanji-nya supaya helper line cocok dan kanji
        // tetap bisa diklik.
        out.push(
          <Fragment key={`k-${i}`}>
            {renderClickableKanji(
              seg.base,
              inert,
              (ch) => setOpenKanji(ch),
              `kp-${i}`,
            )}
          </Fragment>,
        );
      }
    }
    return (
      <span className={cn("font-jp", className)}>
        {out}
        {helperNode}
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

  // ---- Mode "kanji" (Pro) -------------------------------------------
  // Plain Japanese, tanpa furigana. Strip apapun yang berbentuk reading.
  if (!isFurigana) {
    const flattened = segments.map((s) => s.base).join("");
    return (
      <span className={cn("font-jp", className)}>
        {renderClickableKanji(
          flattened,
          inert,
          (ch) => setOpenKanji(ch),
          "p",
        )}
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

  // ---- Mode "furigana" (Normal) -------------------------------------
  // Kalau sentenceMode + unreliable, render plain (tanpa ruby) supaya
  // tidak ada furigana berantakan. Kanji tetap clickable.
  if (sentenceMode && !reliable) {
    const flattened = segments.map((s) => s.base).join("");
    return (
      <span className={cn("font-jp", className)}>
        {renderClickableKanji(
          flattened,
          inert,
          (ch) => setOpenKanji(ch),
          "sp",
        )}
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

  // ---- Mode "furigana" (Normal) -------------------------------------
  return (
    <span className={cn("font-jp", className)}>
      {segments.map((seg, i) => {
        if (seg.reading) {
          return (
            <ruby key={`r-${i}`}>
              {renderClickableKanji(
                seg.base,
                inert,
                (ch) => setOpenKanji(ch),
                `r-${i}`,
              )}
              <rt className={cn("text-ink-400", rtClassName)}>{seg.reading}</rt>
            </ruby>
          );
        }
        return (
          <Fragment key={`p-${i}`}>
            {renderClickableKanji(
              seg.base,
              inert,
              (ch) => setOpenKanji(ch),
              `p-${i}`,
            )}
          </Fragment>
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

/**
 * Render base text dengan setiap karakter kanji jadi tombol clickable
 * (kecuali `inert`). Karakter non-kanji dirender plain.
 */
function renderClickableKanji(
  s: string,
  inert: boolean | undefined,
  onClickKanji: (ch: string) => void,
  keyPrefix: string,
): ReactNode[] {
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
            onClickKanji(ch);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              e.stopPropagation();
              onClickKanji(ch);
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
}

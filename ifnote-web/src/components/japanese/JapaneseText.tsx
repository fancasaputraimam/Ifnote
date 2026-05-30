"use client";

import { Fragment, ReactNode, useState } from "react";
import { useJapaneseMode } from "@/hooks/useJapaneseMode";
import { KanjiPopup } from "@/features/kanji/KanjiPopup";
import {
  alignReadingToText,
  buildSafeRubySegments,
  parseJapaneseText,
  stripParentheticalReadings,
  stripRubyHtml,
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
  /**
   * Teks kana penuh untuk mode Pemula (beginner). Ini yang dipakai sebagai
   * teks UTAMA di mode beginner — hiragana/katakana saja, tanpa kanji.
   * Untuk kata: `kanaText = reading`. Untuk kalimat contoh:
   * `kanaText = beginnerExampleReading` / `normalExampleReading`.
   * Kalau tidak diisi, beginner mode fallback ke `reading` lalu ke `text`.
   */
  kanaText?: string | null;
  /** Pre-parsed segments. Override `text` kalau diberikan. */
  ruby?: RubySegment[];
  /**
   * Override JP display mode. Kalau tidak diset, ambil dari user settings
   * via `useJapaneseMode()`.
   *
   *   - "beginner" : hiragana/katakana saja (kanaText/reading sebagai teks utama)
   *   - "normal"   : kanji + furigana (atau よみ helper bila ruby tak reliable)
   *   - "pro"      : kanji bersih, tanpa furigana / よみ
   */
  mode?: JpMode;
  /** Suppress klik kanji untuk buka KanjiPopup (legacy prop). */
  inert?: boolean;
  /**
   * Aktifkan klik kanji secara eksplisit. Kalau di-set, override `inert`.
   * Default: kanji clickable kecuali `inert` true.
   */
  enableKanjiClick?: boolean;
  /** Callback kustom saat kanji diklik. Kalau diisi, KanjiPopup internal
   *  tidak dibuka — caller yang menangani. */
  onKanjiClick?: (kanji: string) => void;
  className?: string;
  /** Class untuk `<rt>` element (furigana). */
  rtClassName?: string;
  /** Default true — kalau tidak ada ruby HTML, coba parse parens. */
  fallbackToParsedParentheses?: boolean;
  /**
   * True untuk teks contoh kalimat. Cegah furigana berantakan di atas
   * kalimat penuh: di mode Normal, kalau alignment tidak reliable, render
   * kalimat bersih + helper line `よみ: …`.
   */
  sentenceMode?: boolean;
  /** Class untuk helper line (よみ: …) di bawah teks saat sentenceMode. */
  helperClassName?: string;
}

/**
 * Komponen tunggal global untuk render teks Jepang. Pakai komponen ini di
 * mana saja teks Jepang muncul: Catatan, Hafalan, Quiz, Home, KanjiPopup,
 * AI preview, Bulk preview.
 *
 * MODE FINAL (spec):
 *   - "beginner" (Pemula) : tampilkan kana penuh sebagai teks utama
 *                           (`kanaText || reading || fallback`). TIDAK ada
 *                           ruby, TIDAK ada baris よみ, dan kanji tidak
 *                           ditampilkan kalau kana tersedia.
 *   - "normal"   (Normal) : kanji + furigana via `<ruby><rt>` kalau reliable.
 *                           Kalau ruby kalimat penuh tidak reliable tapi ada
 *                           reading, tampilkan kanji + baris `よみ: …`.
 *   - "pro"      (Pro)    : kanji bersih, tanpa furigana, tanpa よみ.
 *
 * Klik kanji buka KanjiPopup (kecuali `inert`/`enableKanjiClick=false`).
 * Tidak ada `dangerouslySetInnerHTML` di komponen ini.
 */
export function JapaneseText({
  text,
  reading,
  kanaText,
  ruby,
  mode,
  inert,
  enableKanjiClick,
  onKanjiClick,
  className,
  rtClassName,
  fallbackToParsedParentheses = true,
  sentenceMode = false,
  helperClassName,
}: Props) {
  const { jpMode: globalMode } = useJapaneseMode();
  const effectiveMode: JpMode = mode ?? globalMode;
  const [openKanji, setOpenKanji] = useState<string | null>(null);

  // Resolusi clickable: enableKanjiClick override `inert`. Default clickable
  // kecuali `inert`. Kalau ada onKanjiClick eksternal, popup internal off.
  const clickable =
    enableKanjiClick !== undefined ? enableKanjiClick : !inert;
  const usesInternalPopup = clickable && !onKanjiClick;
  const handleKanji = (ch: string) => {
    if (onKanjiClick) onKanjiClick(ch);
    else setOpenKanji(ch);
  };

  const wrapperClass = cn("japanese-text font-jp", className);

  const popup = usesInternalPopup ? (
    <KanjiPopup
      open={!!openKanji}
      kanji={openKanji}
      onClose={() => setOpenKanji(null)}
    />
  ) : null;

  // ===================================================================
  // MODE BEGINNER (Pemula) — kana penuh sebagai teks utama.
  // ===================================================================
  if (effectiveMode === "beginner") {
    const kana = (kanaText ?? "").trim() || (reading ?? "").trim();

    if (kana) {
      // Kana tersedia → tampilkan apa adanya. TANPA ruby, TANPA よみ helper,
      // TANPA kanji. Ini inti perbaikan: beginner = kana only.
      return (
        <span className={wrapperClass}>
          {kana}
          {popup}
        </span>
      );
    }

    // Tidak ada kana terpisah. Coba ekstrak reading yang mungkin tertanam
    // di teks (ruby / parens). Kalau ada, pakai itu sebagai kana.
    const segs = text ? parseJapaneseText(text) : [];
    const hasEmbeddedReading = segs.some((s) => s.reading);
    if (hasEmbeddedReading) {
      const kanaJoined = segs.map((s) => s.reading || s.base).join("");
      return (
        <span className={wrapperClass}>
          {kanaJoined}
          {popup}
        </span>
      );
    }

    // Benar-benar tidak ada reading → fallback ke teks asli (mungkin sudah
    // kana, mungkin kanji). Kanji tetap bisa diklik supaya tidak buntu.
    const fallback = stripParentheticalReadings(
      stripHtmlTags(stripRubyHtml(text ?? "")),
    );
    if (!fallback) return null;
    return (
      <span className={wrapperClass}>
        {clickable
          ? renderClickableKanji(fallback, handleKanji, "b")
          : fallback}
        {popup}
      </span>
    );
  }

  // ===================================================================
  // MODE PRO — kanji bersih, tanpa furigana / よみ.
  // ===================================================================
  if (effectiveMode === "pro") {
    let flat: string;
    if (ruby && ruby.length > 0) {
      flat = ruby.map((s) => s.base).join("");
    } else {
      flat = stripParentheticalReadings(
        stripHtmlTags(stripRubyHtml(text ?? "")),
      );
    }
    if (!flat) return null;
    return (
      <span className={wrapperClass}>
        {clickable ? renderClickableKanji(flat, handleKanji, "p") : flat}
        {popup}
      </span>
    );
  }

  // ===================================================================
  // MODE NORMAL — kanji + furigana, atau kanji + よみ helper.
  // ===================================================================
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
    segments = alignReadingToText(stripHtmlTags(text), reading);
  } else if (text) {
    segments = fallbackToParsedParentheses
      ? parseJapaneseText(text)
      : [{ base: stripParentheticalReadings(stripHtmlTags(text)) }];
  }

  if (segments.length === 0) return null;

  // Helper line "よみ: …" hanya di mode Normal saat ruby kalimat penuh tidak
  // reliable tapi reading-nya masuk akal (buildSafeRubySegments sudah
  // menyaring reading yang mismatch jadi undefined).
  const helperNode =
    sentenceMode && !reliable && helperReading ? (
      <span
        className={cn(
          "japanese-reading-helper mt-1 block text-xs text-ink-400",
          helperClassName,
        )}
      >
        よみ: <span className="font-jp">{helperReading}</span>
      </span>
    ) : null;

  // Kalimat penuh + ruby tidak reliable → render kanji bersih + よみ helper.
  if (sentenceMode && !reliable) {
    const flattened = segments.map((s) => s.base).join("");
    return (
      <span className={wrapperClass}>
        {clickable
          ? renderClickableKanji(flattened, handleKanji, "nsp")
          : flattened}
        {helperNode}
        {popup}
      </span>
    );
  }

  // Ruby reliable → render furigana di atas kanji.
  return (
    <span className={wrapperClass}>
      {segments.map((seg, i) => {
        if (seg.reading) {
          return (
            <ruby key={`r-${i}`}>
              {clickable
                ? renderClickableKanji(seg.base, handleKanji, `r-${i}`)
                : seg.base}
              <rt className={cn("text-ink-400", rtClassName)}>{seg.reading}</rt>
            </ruby>
          );
        }
        return (
          <Fragment key={`p-${i}`}>
            {clickable
              ? renderClickableKanji(seg.base, handleKanji, `p-${i}`)
              : seg.base}
          </Fragment>
        );
      })}
      {popup}
    </span>
  );
}

/**
 * Render base text dengan setiap karakter kanji jadi tombol clickable.
 * Karakter non-kanji dirender plain.
 */
function renderClickableKanji(
  s: string,
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
      </span>,
    );
    last = idx + ch.length;
  }
  if (last < s.length) out.push(s.slice(last));
  return out;
}

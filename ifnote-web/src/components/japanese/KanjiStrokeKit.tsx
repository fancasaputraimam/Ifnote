"use client";

/**
 * KanjiStrokeKit — utilitas bersama animasi urutan goresan kanji.
 * Data dari proyek KanjiVG (CC BY-SA). Dipakai KanjiPopup (dialog klik
 * kanji) dan hero kaligrafi di landing page.
 *
 * Mesin animasinya manual (getTotalLength + transisi CSS pada
 * stroke-dashoffset) supaya selalu bermain — tidak terpengaruh
 * prefers-reduced-motion OS, karena animasi ini konten utamanya.
 */

import { useLayoutEffect, useRef, useState } from "react";

export const STROKE_VIEWBOX = "0 0 109 109"; // standar KanjiVG

/**
 * Versi KanjiVG yang dikunci. Jangan pakai `@latest`: isinya bisa berubah
 * tanpa pemberitahuan dan cache CDN untuk `@latest` lebih pendek.
 */
const KANJIVG_VERSION = "r20260714";

/** Hex 5 digit nama file KanjiVG, mis. 日 -> "065e5". */
export function kanjiVgCode(ch: string): string {
  const cp = ch.codePointAt(0)?.toString(16).padStart(5, "0");
  if (!cp) throw new Error("bukan karakter valid");
  return cp;
}

/**
 * Ambil daftar path goresan (urut) untuk satu karakter.
 * `local: true` membaca salinan di /public/kanjivg (dipakai hero landing,
 * supaya tidak bergantung pada CDN pihak ketiga); selain itu dari jsDelivr.
 */
export async function fetchKanjiVgPaths(
  ch: string,
  opts: { local?: boolean } = {},
): Promise<string[]> {
  const cp = kanjiVgCode(ch);
  const url = opts.local
    ? `/kanjivg/${cp}.svg`
    : `https://cdn.jsdelivr.net/gh/KanjiVG/kanjivg@${KANJIVG_VERSION}/kanji/${cp}.svg`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`kanjivg ${res.status}`);
  const text = await res.text();
  const doc = new DOMParser().parseFromString(text, "image/svg+xml");
  const ds = Array.from(doc.querySelectorAll("path"))
    .map((p) => p.getAttribute("d") ?? "")
    .filter(Boolean);
  if (ds.length === 0) throw new Error("no strokes");
  return ds;
}

/**
 * Satu goresan kuas. Ukur panjang path, sembunyikan lewat
 * stroke-dashoffset = panjang, lalu saat `active` transisikan → 0
 * sehingga goresan "tergambar" dari pangkal ke ujung.
 */
export function BrushStroke({
  d,
  active,
  durationSec = 0.55,
  strokeWidth = 5,
  className = "stroke-ink-800 dark:stroke-paper-50",
}: {
  d: string;
  active: boolean;
  durationSec?: number;
  strokeWidth?: number;
  className?: string;
}) {
  const ref = useRef<SVGPathElement>(null);
  const [len, setLen] = useState(0);

  useLayoutEffect(() => {
    setLen(ref.current?.getTotalLength() ?? 0);
  }, [d]);

  return (
    <path
      ref={ref}
      d={d}
      strokeWidth={strokeWidth}
      className={className}
      style={
        len > 0
          ? {
              strokeDasharray: len,
              strokeDashoffset: active ? 0 : len,
              transition: `stroke-dashoffset ${durationSec}s cubic-bezier(0.4, 0, 0.2, 1)`,
            }
          : // Belum terukur → sembunyikan dulu supaya tidak flash bentuk utuh.
            { visibility: "hidden" }
      }
    />
  );
}

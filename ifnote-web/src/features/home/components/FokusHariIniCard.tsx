"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LinkButton } from "@/components/ui/LinkButton";
import { JapaneseText } from "@/components/japanese/JapaneseText";
import { KanjiPopup } from "@/features/kanji/KanjiPopup";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { CatatanItem } from "@/lib/types";

interface Props {
  /** Single CJK character untuk slot kanji. */
  kanji: string | null;
  /** Item Kotoba paling perlu di-review. */
  kotoba: CatatanItem | null;
  /** Item Bunpou paling perlu di-review. */
  bunpou: CatatanItem | null;
}

/**
 * Fokus Hari Ini (Sumi & Washi) — 1 Kanji, 1 Kotoba, 1 Bunpou yang paling
 * perlu di-review, disajikan seperti tiga kartu di atas meja belajar.
 * Kanji tampil besar dengan cincin ensō; kotoba/bunpou dengan reading +
 * penanda mastery.
 */
export function FokusHariIniCard({ kanji, kotoba, bunpou }: Props) {
  const [kanjiOpen, setKanjiOpen] = useState(false);

  return (
    <section className="relative overflow-hidden rounded-notebook bg-white p-5 shadow-notebook ring-1 ring-paper-200/90 dark:bg-ink-800 dark:ring-ink-700 sm:p-6">
      <span
        aria-hidden
        className="pointer-events-none absolute -right-4 -top-5 select-none font-jp text-[90px] leading-none text-ink-800/[0.03] dark:text-paper-50/[0.03]"
      >
        今
      </span>

      <header className="relative mb-4">
        <div className="flex items-center gap-2">
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-accent-500" />
          <span className="font-jp text-xs tracking-[0.28em] text-accent-600 dark:text-accent-400">
            きょうのふくしゅう
          </span>
        </div>
        <h2 className="mt-1.5 font-serif text-lg font-semibold tracking-tight text-ink-800 dark:text-paper-50 sm:text-xl">
          Fokus hari ini
        </h2>
        <p className="mt-0.5 text-sm text-ink-400">Materi yang paling perlu kamu ulangi.</p>
      </header>

      <div className="relative grid grid-cols-1 gap-3 sm:grid-cols-3">
        {/* Kanji */}
        <FocusTile label="Kanji" jp="漢字" tone="leaf" empty={!kanji} emptyHint="Belum ada kanji.">
          {kanji ? (
            <div className="flex h-full flex-col">
              <div className="relative grid flex-1 place-items-center py-2">
                <svg
                  aria-hidden
                  className="pointer-events-none absolute h-24 w-24 text-leaf-500/15"
                  viewBox="0 0 200 200"
                  fill="none"
                >
                  <circle
                    cx="100"
                    cy="100"
                    r="84"
                    stroke="currentColor"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray="492 36"
                    transform="rotate(-96 100 100)"
                  />
                </svg>
                <span className="relative font-jp text-5xl leading-none text-leaf-600 dark:text-leaf-500">
                  {kanji}
                </span>
              </div>
              <Button size="sm" className="mt-2 w-full" onClick={() => setKanjiOpen(true)}>
                Lihat detail
              </Button>
            </div>
          ) : null}
        </FocusTile>

        {/* Kotoba */}
        <FocusTile label="Kotoba" jp="言葉" tone="accent" empty={!kotoba} emptyHint="Belum ada kotoba.">
          {kotoba ? (
            <div className="flex h-full flex-col">
              <div className="flex-1">
                <KotobaBunpouSnippet item={kotoba} />
              </div>
              <LinkButton
                size="sm"
                variant="secondary"
                className="mt-2 w-full"
                href={`${ROUTES.app.catatan}?q=${encodeURIComponent(kotoba.jpOrPattern)}`}
              >
                Buka item ini →
              </LinkButton>
            </div>
          ) : null}
        </FocusTile>

        {/* Bunpou */}
        <FocusTile label="Bunpou" jp="文法" tone="lilac" empty={!bunpou} emptyHint="Belum ada bunpou.">
          {bunpou ? (
            <div className="flex h-full flex-col">
              <div className="flex-1">
                <KotobaBunpouSnippet item={bunpou} />
              </div>
              <LinkButton
                size="sm"
                variant="secondary"
                className="mt-2 w-full"
                href={`${ROUTES.app.catatan}?q=${encodeURIComponent(bunpou.jpOrPattern)}`}
              >
                Buka item ini →
              </LinkButton>
            </div>
          ) : null}
        </FocusTile>
      </div>

      <KanjiPopup open={kanjiOpen} kanji={kanji} onClose={() => setKanjiOpen(false)} />
    </section>
  );
}

/* ------------------------------------------------------------------ */

type Tone = "leaf" | "accent" | "lilac";

const TONE_BADGE: Record<Tone, "leaf" | "accent" | "lilac"> = {
  leaf: "leaf",
  accent: "accent",
  lilac: "lilac",
};

const TONE_TILE: Record<Tone, string> = {
  leaf: "ring-leaf-200/60 dark:ring-leaf-400/20",
  accent: "ring-accent-200/60 dark:ring-accent-400/20",
  lilac: "ring-lilac-200/60 dark:ring-lilac-400/20",
};

function FocusTile({
  label,
  jp,
  tone,
  empty,
  emptyHint,
  children,
}: {
  label: string;
  jp: string;
  tone: Tone;
  empty?: boolean;
  emptyHint?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col rounded-xl bg-paper-50/70 p-3.5 ring-1 ring-inset transition-shadow hover:shadow-notebook dark:bg-ink-900/30",
        TONE_TILE[tone],
      )}
    >
      <div className="mb-2.5 flex items-center justify-between">
        <Badge tone={TONE_BADGE[tone]} size="sm">
          {label}
        </Badge>
        <span aria-hidden className="font-jp text-[10px] tracking-[0.2em] text-ink-400/60">
          {jp}
        </span>
      </div>

      {empty ? (
        <p className="text-xs italic text-ink-400">{emptyHint ?? "Belum ada data."}</p>
      ) : (
        <div className="flex-1">{children}</div>
      )}
    </div>
  );
}

function KotobaBunpouSnippet({ item }: { item: CatatanItem }) {
  const reading = (item.detail as { reading?: string | null })?.reading || undefined;
  return (
    <div>
      <div className="text-base font-medium text-ink-800 dark:text-paper-50">
        <JapaneseText text={item.jpOrPattern} reading={reading} kanaText={reading} />
      </div>
      <p className="mt-0.5 line-clamp-2 text-xs text-ink-400">{item.meaning}</p>
      {item.mastery === "weak" ? (
        <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rose-600 ring-1 ring-inset ring-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-400/30">
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current" />
          weak · perlu diulang
        </span>
      ) : item.mastery === "mid" ? (
        <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-600 ring-1 ring-inset ring-amber-200 dark:bg-amber-500/15 dark:text-amber-200 dark:ring-amber-400/30">
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current" />
          mid · perlu review
        </span>
      ) : null}
    </div>
  );
}

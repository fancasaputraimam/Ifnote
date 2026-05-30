"use client";

import Link from "next/link";
import { useState } from "react";
import { PanelCard } from "@/components/ui/PanelCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LinkButton } from "@/components/ui/LinkButton";
import { JapaneseText } from "@/components/japanese/JapaneseText";
import { KanjiPopup } from "@/features/kanji/KanjiPopup";
import { ROUTES } from "@/lib/constants";
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
 * Fokus Hari Ini — gabung 1 Kanji, 1 Kotoba, 1 Bunpou yang paling perlu
 * di-review. Menggantikan Kanji Hari Ini lama (task spec PART 1).
 *
 * Layout:
 *   - Mobile : 3 baris vertikal compact
 *   - Tablet+: 3 kolom dalam satu card
 */
export function FokusHariIniCard({ kanji, kotoba, bunpou }: Props) {
  const [kanjiOpen, setKanjiOpen] = useState(false);

  return (
    <PanelCard
      tone="slate"
      eyebrow="🍵 Fokus hari ini"
      title="Materi yang perlu kamu ulangi hari ini"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <FocusTile
          label="Kanji"
          tone="leaf"
          empty={!kanji}
          emptyHint="Belum ada kanji."
          action={
            kanji ? (
              <Button size="sm" onClick={() => setKanjiOpen(true)}>
                Lihat detail
              </Button>
            ) : null
          }
        >
          {kanji ? (
            <div className="flex items-center gap-3">
              <span className="font-jp text-4xl leading-none text-leaf-600 dark:text-leaf-500">
                {kanji}
              </span>
              <span className="text-xs text-ink-400">
                Tap “Lihat detail” untuk arti, onyomi, kunyomi.
              </span>
            </div>
          ) : null}
        </FocusTile>

        <FocusTile
          label="Kotoba"
          tone="accent"
          empty={!kotoba}
          emptyHint="Belum ada kotoba."
          action={
            kotoba ? (
              <LinkButton size="sm" variant="secondary" href={ROUTES.app.catatan}>
                Buka Catatan
              </LinkButton>
            ) : null
          }
        >
          {kotoba ? (
            <KotobaBunpouSnippet item={kotoba} />
          ) : null}
        </FocusTile>

        <FocusTile
          label="Bunpou"
          tone="lilac"
          empty={!bunpou}
          emptyHint="Belum ada bunpou."
          action={
            bunpou ? (
              <LinkButton size="sm" variant="secondary" href={ROUTES.app.catatan}>
                Buka Catatan
              </LinkButton>
            ) : null
          }
        >
          {bunpou ? (
            <KotobaBunpouSnippet item={bunpou} />
          ) : null}
        </FocusTile>
      </div>

      <KanjiPopup
        open={kanjiOpen}
        kanji={kanji}
        onClose={() => setKanjiOpen(false)}
      />
    </PanelCard>
  );
}

/* ------------------------------------------------------------------ */

type Tone = "leaf" | "accent" | "lilac";

const TONE_BADGE: Record<Tone, "leaf" | "accent" | "lilac"> = {
  leaf: "leaf",
  accent: "accent",
  lilac: "lilac",
};

function FocusTile({
  label,
  tone,
  empty,
  emptyHint,
  children,
  action,
}: {
  label: string;
  tone: Tone;
  empty?: boolean;
  emptyHint?: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-paper-200 bg-paper-50/60 p-3 dark:border-ink-700 dark:bg-ink-900/30">
      <div className="mb-2 flex items-center justify-between">
        <Badge tone={TONE_BADGE[tone]} size="sm">
          {label}
        </Badge>
      </div>

      {empty ? (
        <p className="text-xs italic text-ink-400">
          {emptyHint ?? "Belum ada data."}
        </p>
      ) : (
        <div className="space-y-2">
          <div className="min-h-[2.25rem]">{children}</div>
          {action ? <div>{action}</div> : null}
        </div>
      )}
    </div>
  );
}

function KotobaBunpouSnippet({ item }: { item: CatatanItem }) {
  const reading =
    (item.detail as { reading?: string | null })?.reading || undefined;
  return (
    <div>
      <div className="text-base font-medium text-ink-800 dark:text-paper-50">
        <JapaneseText text={item.jpOrPattern} reading={reading} kanaText={reading} />
      </div>
      <p className="mt-0.5 line-clamp-2 text-xs text-ink-400">{item.meaning}</p>
      {item.mastery === "weak" ? (
        <span className="mt-1 inline-block text-[10px] uppercase tracking-wide text-rose-600 dark:text-rose-400">
          ⚠ weak — perlu diulang
        </span>
      ) : item.mastery === "mid" ? (
        <span className="mt-1 inline-block text-[10px] uppercase tracking-wide text-amber-600 dark:text-amber-400">
          mid — perlu review
        </span>
      ) : null}
    </div>
  );
}

// keep Link import suppressed when unused in some branches
void Link;

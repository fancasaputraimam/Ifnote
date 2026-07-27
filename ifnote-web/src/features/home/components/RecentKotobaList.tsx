"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/feedback/EmptyState";
import { JapaneseText } from "@/components/japanese/JapaneseText";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { CatatanItem, Mastery } from "@/lib/types";

interface Props {
  items: CatatanItem[];
}

const MASTERY_PILL: Record<Mastery, string> = {
  good: "text-leaf-600 dark:text-leaf-500",
  mid: "text-amber-600 dark:text-amber-400",
  weak: "text-rose-600 dark:text-rose-400",
};

/**
 * Kotoba terbaru (Sumi & Washi): kartu dengan stempel kana 言, baris
 * bergaris halus ala notebook, dan penanda mastery berupa titik warna.
 */
export function RecentKotobaList({ items }: Props) {
  return (
    <section className="relative overflow-hidden rounded-notebook bg-white p-5 shadow-notebook ring-1 ring-paper-200/90 dark:bg-ink-800 dark:ring-ink-700">
      <header className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden
            className="grid h-9 w-9 -rotate-3 place-items-center rounded-[9px] bg-accent-50 font-serif text-base text-accent-600 ring-1 ring-inset ring-accent-200/70 dark:bg-accent-500/15 dark:text-accent-200 dark:ring-accent-400/25"
          >
            言
          </span>
          <div>
            <h2 className="font-serif text-base font-semibold tracking-tight text-ink-800 dark:text-paper-50">
              Kotoba Terbaru
            </h2>
            <p className="font-jp text-[10px] tracking-[0.2em] text-ink-400/70">ことば</p>
          </div>
        </div>
        <Link
          href={ROUTES.app.catatan}
          className="shrink-0 text-xs text-accent-600 underline-offset-4 hover:underline dark:text-accent-300"
        >
          Lihat semua →
        </Link>
      </header>

      {items.length === 0 ? (
        <EmptyState
          icon="🍵"
          title="Belum ada kotoba"
          description="Tambah kosakata pertamamu dari Catatan."
        />
      ) : (
        <ul className="divide-y divide-paper-200 dark:divide-ink-700">
          {items.map((it) => {
            const reading =
              (it.detail as { reading?: string | null })?.reading || undefined;
            return (
              <li key={it.id}>
                <Link
                  href={`${ROUTES.app.catatan}?q=${encodeURIComponent(it.jpOrPattern)}`}
                  className="-mx-2 flex items-center justify-between gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-paper-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 dark:hover:bg-ink-900/40"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base text-ink-800 dark:text-paper-50">
                      <JapaneseText text={it.jpOrPattern} reading={reading} kanaText={reading} inert />
                    </p>
                    <p className="truncate text-xs text-ink-400">{it.meaning}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {it.level ? <Badge tone="accent">{it.level}</Badge> : null}
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide",
                        MASTERY_PILL[it.mastery],
                      )}
                    >
                      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current" />
                      {it.mastery}
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

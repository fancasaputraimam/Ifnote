"use client";

import Link from "next/link";
import { PanelCard } from "@/components/ui/PanelCard";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/feedback/EmptyState";
import { JapaneseText } from "@/components/japanese/JapaneseText";
import { ROUTES } from "@/lib/constants";
import type { CatatanItem, Mastery } from "@/lib/types";

interface Props {
  items: CatatanItem[];
}

const masteryTone: Record<Mastery, "leaf" | "warn" | "danger"> = {
  good: "leaf",
  mid: "warn",
  weak: "danger",
};

export function RecentKotobaList({ items }: Props) {
  return (
    <PanelCard
      eyebrow="📖 Kotoba"
      title="Kotoba Terbaru"
      tone="accent"
      headerAction={
        <Link
          href={ROUTES.app.catatan}
          className="text-xs text-accent-600 hover:underline dark:text-accent-300"
        >
          Lihat semua →
        </Link>
      }
    >
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
              <li
                key={it.id}
                className="flex items-center justify-between gap-3 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base text-ink-800 dark:text-paper-50">
                    <JapaneseText
                      text={it.jpOrPattern}
                      reading={reading}
                      kanaText={reading}
                      inert
                    />
                  </p>
                  <p className="truncate text-xs text-ink-400">{it.meaning}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  {it.level ? <Badge tone="accent">{it.level}</Badge> : null}
                  <Badge tone={masteryTone[it.mastery]}>{it.mastery}</Badge>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </PanelCard>
  );
}

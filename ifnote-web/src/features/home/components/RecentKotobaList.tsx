"use client";

import Link from "next/link";
import { NotebookCard } from "@/components/ui/NotebookCard";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/feedback/EmptyState";
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
    <NotebookCard className="p-5">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-base font-semibold text-ink-800 dark:text-paper-50">
          Kotoba Terbaru
        </h2>
        <Link
          href={ROUTES.app.catatan}
          className="text-xs text-accent-600 hover:underline dark:text-accent-300"
        >
          Lihat semua →
        </Link>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon="🍵"
          title="Belum ada kotoba"
          description="Tambah kosakata pertamamu dari Catatan."
        />
      ) : (
        <ul className="mt-3 divide-y divide-paper-200 dark:divide-ink-700">
          {items.map((it) => (
            <li key={it.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate font-jp text-base text-ink-800 dark:text-paper-50">
                  {it.jpOrPattern}
                </p>
                <p className="truncate text-xs text-ink-400">{it.meaning}</p>
              </div>
              <div className="flex items-center gap-1.5">
                {it.level ? <Badge tone="accent">{it.level}</Badge> : null}
                <Badge tone={masteryTone[it.mastery]}>{it.mastery}</Badge>
              </div>
            </li>
          ))}
        </ul>
      )}
    </NotebookCard>
  );
}

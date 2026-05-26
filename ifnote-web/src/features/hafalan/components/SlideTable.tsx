"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ApiError } from "@/lib/api-client";
import { toast } from "@/components/feedback/Toast";
import { ClickableKanji } from "@/features/kanji/ClickableKanji";
import { useHafalanMastery } from "@/features/hafalan/useHafalan";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { HafalanSlide, Mastery } from "@/lib/types";
import Link from "next/link";

type Item = HafalanSlide["items"][number];

interface Props {
  items: Item[];
  hideMeaning: boolean;
}

const masteryTone: Record<Mastery, "leaf" | "warn" | "danger"> = {
  good: "leaf",
  mid: "warn",
  weak: "danger",
};

export function SlideTable({ items, hideMeaning }: Props) {
  return (
    <div className="overflow-hidden rounded-notebook border border-paper-200 dark:border-ink-700">
      {/* Header */}
      <div className="hidden grid-cols-[3rem_minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-3 bg-paper-100 px-4 py-2 text-[11px] uppercase tracking-wide text-ink-400 sm:grid dark:bg-ink-700">
        <div className="text-center">#</div>
        <div>Japanese</div>
        <div>Arti</div>
        <div className="pr-2 text-right">Tag</div>
      </div>

      <ul className="divide-y divide-paper-200 dark:divide-ink-700">
        {items.map((it) => (
          <SlideRow
            key={it.orderRefId}
            item={it}
            hideMeaning={hideMeaning}
          />
        ))}
      </ul>
    </div>
  );
}

interface RowProps {
  item: Item;
  hideMeaning: boolean;
}

function SlideRow({ item, hideMeaning }: RowProps) {
  const [open, setOpen] = useState(false);
  const masteryMut = useHafalanMastery();

  const onMastery = async (mastery: Mastery) => {
    try {
      await masteryMut.mutateAsync({
        itemType: item.itemType,
        itemId: item.itemId,
        mastery,
      });
      toast(
        mastery === "good" ? "Ditandai hafal" : mastery === "weak" ? "Ditandai lemah" : "Mastery diperbarui",
        "success",
      );
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Gagal memperbarui mastery";
      toast(msg, "error");
    }
  };

  return (
    <li className="bg-white dark:bg-ink-800">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="grid w-full grid-cols-[3rem_minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-paper-50 dark:hover:bg-ink-700"
      >
        <div className="text-center text-xs tabular-nums text-ink-400">
          {item.orderIndex}
        </div>

        <div className="min-w-0">
          <p className="truncate font-jp text-base text-ink-800 dark:text-paper-50">
            {item.jpOrPattern}
          </p>
        </div>

        <div className="min-w-0">
          {hideMeaning ? (
            <span className="select-none tracking-widest text-ink-400">••••••••</span>
          ) : (
            <p className="truncate text-sm text-ink-700 dark:text-paper-50">
              {item.meaning}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1.5 pr-1">
          <Badge tone={item.itemType === "kotoba" ? "accent" : "lilac"} size="sm">
            {item.itemType}
          </Badge>
          {item.level ? <Badge tone="neutral" size="sm">{item.level}</Badge> : null}
          <Badge tone={masteryTone[item.mastery]} size="sm">{item.mastery}</Badge>
          <span aria-hidden className={cn("ml-1 text-ink-400 transition-transform", open && "rotate-180")}>▾</span>
        </div>
      </button>

      {open ? (
        <div className="border-t border-paper-200 px-4 py-3 dark:border-ink-700">
          {item.example ? (
            <p className="rounded-xl bg-paper-50/60 px-3 py-2 font-jp text-sm text-ink-700 dark:bg-ink-900/30 dark:text-paper-50">
              <ClickableKanji text={item.example} />
            </p>
          ) : (
            <p className="text-sm italic text-ink-400">Belum ada contoh kalimat untuk item ini.</p>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() => onMastery("good")}
              loading={masteryMut.isPending}
            >
              Tandai Hafal
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onMastery("weak")}
            >
              Tandai Lemah
            </Button>
            <Link
              href={`${ROUTES.app.quiz}?type=${item.itemType}`}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-paper-200 px-3 py-1.5 text-sm font-medium text-ink-800 hover:bg-paper-200/70 dark:bg-ink-700 dark:text-paper-50 dark:hover:bg-ink-600"
            >
              Buat Quiz
            </Link>
            <Link
              href={`${ROUTES.app.ai}?mode=${item.itemType === "kotoba" ? "explain-kotoba" : "explain-bunpou"}&q=${encodeURIComponent(item.jpOrPattern)}`}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-paper-200 px-3 py-1.5 text-sm font-medium text-ink-800 hover:bg-paper-200/70 dark:bg-ink-700 dark:text-paper-50 dark:hover:bg-ink-600"
            >
              AI Jelaskan
            </Link>
          </div>
        </div>
      ) : null}
    </li>
  );
}

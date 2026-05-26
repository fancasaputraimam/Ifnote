"use client";

import { Badge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/LinkButton";
import { NotebookCard } from "@/components/ui/NotebookCard";
import { ClickableKanji } from "@/features/kanji/ClickableKanji";
import { ROUTES } from "@/lib/constants";
import type { CreateHafalanData } from "../types";

interface Props {
  data: CreateHafalanData;
  source: "ai" | "mock";
}

export function HafalanPlanCard({ data, source }: Props) {
  const items = data.items ?? [];
  return (
    <NotebookCard stripe="leaf" ruled className="p-5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-ink-800 dark:text-paper-50">
          {data.title || "Rencana hafalan"}
        </h3>
        <Badge tone={source === "mock" ? "warn" : "leaf"}>{source === "mock" ? "Mock" : "AI"}</Badge>
      </div>
      {data.summary ? (
        <p className="mt-1 text-sm text-ink-400">{data.summary}</p>
      ) : null}

      {items.length > 0 ? (
        <ul className="mt-3 divide-y divide-paper-200 dark:divide-ink-700">
          {items.map((it, i) => (
            <li key={i} className="flex items-baseline gap-3 py-2">
              <Badge tone={it.itemType === "kotoba" ? "accent" : "lilac"} size="sm">
                {it.itemType}
              </Badge>
              <p className="font-jp text-ink-800 dark:text-paper-50">
                <ClickableKanji text={it.jpOrPattern} />
              </p>
              <p className="ml-auto text-xs text-ink-400">{it.meaning}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-ink-400">
          AI belum mengembalikan daftar item. Tambah konteks lebih spesifik dan coba lagi.
        </p>
      )}

      <p className="mt-3 text-xs text-ink-400">
        Daftar di atas hanya saran AI. Tambahkan ke Catatan terlebih dahulu (lewat
        Catatan atau mode lain di AI Tutor) untuk masuk ke Hafalan.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <LinkButton size="sm" href={ROUTES.app.catatan}>Buka Catatan</LinkButton>
        <LinkButton size="sm" variant="secondary" href={ROUTES.app.hafalan}>Buka Hafalan</LinkButton>
      </div>
    </NotebookCard>
  );
}

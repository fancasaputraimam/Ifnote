"use client";

import { DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Props {
  type: "kotoba" | "bunpou";
  mode: "add" | "edit";
}

const COPY = {
  kotoba: {
    kana: "言",
    stamp:
      "bg-accent-50 text-accent-600 ring-accent-200/70 dark:bg-accent-500/15 dark:text-accent-200 dark:ring-accent-400/25",
    add: {
      overline: "ことば・ついか",
      title: "Tambah Kotoba",
      desc: "Tulis daftarnya — biar AI yang melengkapi reading, arti, dan contoh.",
    },
    edit: {
      overline: "ことば・へんしゅう",
      title: "Edit Kotoba",
      desc: "Perbarui detail kosakata ini.",
    },
  },
  bunpou: {
    kana: "文",
    stamp:
      "bg-lilac-50 text-lilac-600 ring-lilac-200/70 dark:bg-lilac-500/15 dark:text-lilac-300 dark:ring-lilac-400/25",
    add: {
      overline: "ぶんぽう・ついか",
      title: "Tambah Bunpou",
      desc: "Tulis polanya — biar AI yang menjelaskan formula dan contohnya.",
    },
    edit: {
      overline: "ぶんぽう・へんしゅう",
      title: "Edit Bunpou",
      desc: "Perbarui detail pola tata bahasa ini.",
    },
  },
} as const;

/**
 * Header dialog Catatan (Sumi & Washi): stempel kana miring + overline
 * kana beraksen + judul serif. Dipakai KotobaDialog & BunpouDialog agar
 * kedua dialog satu bahasa visual.
 */
export function CatatanDialogHeader({ type, mode }: Props) {
  const t = COPY[type];
  const m = t[mode];
  return (
    <DialogHeader className="mb-5">
      <div className="flex items-center gap-3 text-left">
        <span
          aria-hidden
          className={`grid h-11 w-11 shrink-0 -rotate-3 place-items-center rounded-[11px] font-serif text-lg ring-1 ring-inset ${t.stamp}`}
        >
          {t.kana}
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-accent-500" />
            <span className="font-jp text-[11px] tracking-[0.28em] text-accent-600 dark:text-accent-400">
              {m.overline}
            </span>
          </div>
          <DialogTitle className="mt-0.5 font-serif text-xl">{m.title}</DialogTitle>
          <p className="mt-0.5 text-xs text-ink-400">{m.desc}</p>
        </div>
      </div>
    </DialogHeader>
  );
}

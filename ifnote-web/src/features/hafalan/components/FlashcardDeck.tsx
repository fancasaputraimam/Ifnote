"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { JapaneseText } from "@/components/japanese/JapaneseText";
import { useHafalanMastery } from "@/features/hafalan/useHafalan";
import { notify } from "@/lib/toast";
import { mapApiErrorToUserMessage } from "@/lib/error-mapper";
import { cn } from "@/lib/utils";
import type { HafalanSlide, Mastery } from "@/lib/types";

type Item = HafalanSlide["items"][number];

interface Props {
  items: Item[];
  /** Lompat ke slide berikutnya saat deck selesai (kalau masih ada). */
  onNextSlide?: () => void;
  hasNextSlide: boolean;
}

const MARK_STYLE: Record<Mastery, string> = {
  weak: "bg-rose-50 text-rose-600 ring-rose-200 hover:bg-rose-100 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-400/30 dark:hover:bg-rose-500/25",
  mid: "bg-amber-50 text-amber-600 ring-amber-200 hover:bg-amber-100 dark:bg-amber-500/15 dark:text-amber-200 dark:ring-amber-400/30 dark:hover:bg-amber-500/25",
  good: "bg-leaf-50 text-leaf-600 ring-leaf-200 hover:bg-leaf-100 dark:bg-leaf-500/15 dark:text-leaf-300 dark:ring-leaf-400/30 dark:hover:bg-leaf-500/25",
};

/**
 * Mode kartu (flashcard) — satu item per kartu, flip 3D untuk melihat
 * jawaban, tandai mastery langsung dari kartu lalu otomatis lanjut.
 * Keyboard: Spasi/Enter flip, ←/→ pindah kartu.
 */
export function FlashcardDeck({ items, onNextSlide, hasNextSlide }: Props) {
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const masteryMut = useHafalanMastery();

  // Reset saat isi slide berubah (ganti slide / mode / acak).
  useEffect(() => {
    setIdx(0);
    setFlipped(false);
  }, [items]);

  const done = idx >= items.length;
  const item = done ? null : items[idx];

  const goto = (n: number) => {
    setIdx(Math.max(0, Math.min(items.length, n)));
    setFlipped(false);
  };

  const onMark = (m: Mastery) => {
    if (!item) return;
    // Fire-and-forget: kartu langsung lanjut, error tetap diberi tahu.
    masteryMut.mutate(
      { itemType: item.itemType, itemId: item.itemId, mastery: m },
      {
        onError: (e) => {
          const msg = mapApiErrorToUserMessage(e, {
            title: "Gagal memperbarui status",
            message: "Coba lagi sebentar.",
          });
          notify[msg.variant](msg.title, msg.message);
        },
      },
    );
    goto(idx + 1);
  };

  // Keyboard: Spasi/Enter flip, ←/→ pindah kartu.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName) || t.isContentEditable)) {
        return;
      }
      if (e.key === " " || e.key === "Enter") {
        if (!done) {
          e.preventDefault();
          setFlipped((v) => !v);
        }
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goto(idx + 1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goto(idx - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, done, items.length]);

  // ------------------------------------------------------------- selesai
  if (done) {
    return (
      <div className="relative overflow-hidden rounded-notebook bg-white p-10 text-center shadow-notebook ring-1 ring-paper-200/90 dark:bg-ink-800 dark:ring-ink-700">
        <svg
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 text-leaf-500/10"
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
        <p className="relative font-jp text-xs tracking-[0.3em] text-accent-500">
          おつかれさま
        </p>
        <h3 className="relative mt-2 font-serif text-2xl font-semibold text-ink-800 dark:text-paper-50">
          Slide selesai!
        </h3>
        <p className="relative mt-1 text-sm text-ink-400">
          {items.length} kartu sudah kamu lewati.
        </p>
        <div className="relative mt-6 flex flex-wrap justify-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => goto(0)} className="gap-1.5">
            <RotateCcw className="h-4 w-4" aria-hidden /> Ulangi slide ini
          </Button>
          {hasNextSlide && onNextSlide ? (
            <Button size="sm" onClick={onNextSlide} className="gap-1.5">
              Slide berikutnya <ChevronRight className="h-4 w-4" aria-hidden />
            </Button>
          ) : null}
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------- kartu
  return (
    <div className="space-y-3">
      {/* progres kartu */}
      <div className="flex items-center justify-between text-xs text-ink-400">
        <span>
          Kartu{" "}
          <span className="font-semibold text-ink-700 dark:text-paper-100">
            {idx + 1}
          </span>{" "}
          / {items.length}
        </span>
        <span className="hidden sm:block">
          Spasi = balik kartu · ←/→ = pindah kartu
        </span>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-paper-100 dark:bg-ink-900/60">
        <motion.div
          className="h-full rounded-full bg-accent-gradient"
          initial={false}
          animate={{ width: `${((idx + 1) / items.length) * 100}%` }}
          transition={{ type: "spring", stiffness: 260, damping: 30 }}
        />
      </div>

      {/* kartu flip 3D */}
      <div className="mx-auto w-full max-w-xl [perspective:1400px]">
        <motion.div
          role="button"
          tabIndex={0}
          aria-label={flipped ? "Kembali ke sisi depan" : "Balik kartu untuk lihat arti"}
          onClick={() => setFlipped((v) => !v)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setFlipped((v) => !v);
            }
          }}
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.5, ease: [0.22, 0.61, 0.36, 1] }}
          className="relative h-[300px] cursor-pointer [transform-style:preserve-3d] focus-visible:outline-none sm:h-[340px]"
        >
          {/* depan — soal */}
          <div className="notebook-rule absolute inset-0 flex flex-col rounded-notebook bg-white p-5 shadow-notebook-md ring-1 ring-paper-200/90 [backface-visibility:hidden] dark:bg-ink-800 dark:ring-ink-700">
            <div className="flex items-center justify-between">
              <span
                aria-hidden
                className={cn(
                  "grid h-8 w-8 -rotate-3 place-items-center rounded-[9px] font-serif text-sm ring-1 ring-inset",
                  item!.itemType === "kotoba"
                    ? "bg-accent-50 text-accent-600 ring-accent-200/70 dark:bg-accent-500/15 dark:text-accent-200 dark:ring-accent-400/25"
                    : "bg-lilac-50 text-lilac-600 ring-lilac-200/70 dark:bg-lilac-500/15 dark:text-lilac-300 dark:ring-lilac-400/25",
                )}
              >
                {item!.itemType === "kotoba" ? "言" : "文"}
              </span>
              {item!.level ? <Badge tone="neutral" size="sm">{item!.level}</Badge> : null}
            </div>
            <div className="grid flex-1 place-items-center px-2 text-center">
              <div className="font-jp text-3xl leading-relaxed text-ink-800 dark:text-paper-50 sm:text-4xl">
                <JapaneseText
                  text={item!.jpOrPattern}
                  reading={item!.reading || undefined}
                  readingRuby={item!.readingRuby || undefined}
                  kanaText={item!.reading || undefined}
                  inert
                />
              </div>
            </div>
            <p className="text-center font-jp text-[10px] tracking-[0.3em] text-ink-400/60">
              タップしてこたえ
            </p>
          </div>

          {/* belakang — jawaban */}
          <div className="absolute inset-0 flex flex-col rounded-notebook bg-paper-50 p-5 shadow-notebook-md ring-1 ring-paper-200/90 [backface-visibility:hidden] [transform:rotateY(180deg)] dark:bg-ink-900/80 dark:ring-ink-700">
            <div className="flex items-center gap-2">
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-accent-500" />
              <span className="font-jp text-[10px] tracking-[0.28em] text-accent-600 dark:text-accent-400">
                こたえ
              </span>
            </div>
            <div className="grid flex-1 place-items-center overflow-y-auto px-2 py-3 text-center">
              <div>
                <p className="text-xl font-semibold leading-snug text-ink-800 dark:text-paper-50 sm:text-2xl">
                  {item!.meaning}
                </p>
                {item!.example ? (
                  <div className="mt-4 border-t border-paper-200 pt-3 dark:border-ink-700">
                    <p className="font-jp text-sm text-ink-700 dark:text-paper-100">
                      <JapaneseText
                        text={item!.example}
                        reading={item!.exampleReading || undefined}
                        kanaText={item!.exampleReading || undefined}
                        sentenceMode
                        inert
                      />
                    </p>
                    {item!.exampleMeaning ? (
                      <p className="mt-1 text-xs text-ink-400">{item!.exampleMeaning}</p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
            <p className="text-center font-jp text-[10px] tracking-[0.3em] text-ink-400/60">
              どうだった？
            </p>
          </div>
        </motion.div>
      </div>

      {/* kontrol */}
      <div className="mx-auto flex w-full max-w-xl items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => goto(idx - 1)}
          disabled={idx <= 0}
          aria-label="Kartu sebelumnya"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-ink-500 ring-1 ring-inset ring-paper-300 transition hover:bg-paper-100 disabled:opacity-40 dark:bg-ink-800 dark:text-paper-50 dark:ring-ink-700 dark:hover:bg-ink-700"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden />
        </button>

        <div className="flex flex-wrap justify-center gap-1.5">
          {(
            [
              { m: "weak", label: "Lemah" },
              { m: "mid", label: "Sedang" },
              { m: "good", label: "Hafal" },
            ] as const
          ).map(({ m, label }) => (
            <button
              key={m}
              type="button"
              onClick={() => onMark(m)}
              className={cn(
                "rounded-full px-4 py-2 text-xs font-semibold ring-1 ring-inset transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400",
                MARK_STYLE[m],
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => goto(idx + 1)}
          aria-label="Kartu berikutnya"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-ink-500 ring-1 ring-inset ring-paper-300 transition hover:bg-paper-100 dark:bg-ink-800 dark:text-paper-50 dark:ring-ink-700 dark:hover:bg-ink-700"
        >
          <ChevronRight className="h-5 w-5" aria-hidden />
        </button>
      </div>
    </div>
  );
}

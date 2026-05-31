"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import LoaderGrid from "@/components/ui/loader-grid";
import { notify } from "@/lib/toast";
import { mapApiErrorToUserMessage } from "@/lib/error-mapper";
import { JapaneseText } from "@/components/japanese/JapaneseText";
import { useHafalanMastery } from "@/features/hafalan/useHafalan";
import {
  useAiExplainBunpou,
  useAiExplainKotoba,
} from "@/features/catatan/useCatatan";
import { splitNumberedExamples } from "@/lib/bunpou-format";
import { AnimatePresence, motion } from "framer-motion";
import type { HafalanSlide, Mastery } from "@/lib/types";

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
        {items.map((it, i) => (
          <SlideRow key={it.orderRefId} item={it} hideMeaning={hideMeaning} index={i} />
        ))}
      </ul>
    </div>
  );
}

interface RowProps {
  item: Item;
  hideMeaning: boolean;
  index: number;
}

function SlideRow({ item, hideMeaning, index }: RowProps) {
  const [open, setOpen] = useState(false);
  const masteryMut = useHafalanMastery();
  const aiKotoba = useAiExplainKotoba();
  const aiBunpou = useAiExplainBunpou();

  // Hafalan list cuma punya `example` — pakai itu sebagai proxy untuk
  // "sudah ada penjelasan". Setelah AI explain sukses, backend akan
  // mengisi beginnerExample/normalExample, dan list akan refetch karena
  // mutation hook kita meng-invalidate ["hafalan"].
  const explained = !!item.example;
  const aiPending =
    item.itemType === "kotoba" ? aiKotoba.isPending : aiBunpou.isPending;

  const onMastery = async (mastery: Mastery) => {
    try {
      await masteryMut.mutateAsync({
        itemType: item.itemType,
        itemId: item.itemId,
        mastery,
      });
      const message =
        mastery === "good"
          ? "Item ini ditandai sudah hafal."
          : mastery === "weak"
            ? "Item ini ditandai masih lemah."
            : "Mastery ditandai sedang.";
      notify.success("Status hafalan diperbarui", message, { icon: "🧠" });
    } catch (e) {
      const m = mapApiErrorToUserMessage(e, {
        title: "Gagal memperbarui status",
        message: "Coba lagi sebentar.",
      });
      notify[m.variant](m.title, m.message);
    }
  };

  const onExplain = async () => {
    // Loader inline (panel LoaderGrid, digerakkan `aiPending`) sudah jadi
    // indikator proses. Jangan pakai notify.promise — itu memunculkan toast
    // loading kedua yang berputar bersamaan (loading dobel). Cukup toast hasil.
    try {
      if (item.itemType === "kotoba") {
        await aiKotoba.mutateAsync(item.itemId);
      } else {
        await aiBunpou.mutateAsync(item.itemId);
      }
      notify.success(
        "Penjelasan disimpan",
        "Kamu bisa membukanya lagi tanpa analisa ulang.",
        { icon: "🌸" },
      );
    } catch (e) {
      const m = mapApiErrorToUserMessage(e, {
        title: "Penjelasan gagal dibuat",
        message: "Coba lagi sebentar.",
      });
      notify[m.variant](m.title, m.message);
    }
  };

  return (
    <motion.li
      className="bg-white dark:bg-ink-800"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.25,
        ease: "easeOut",
        delay: Math.min(index * 0.03, 0.3),
      }}
    >
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
          <p className="truncate text-base text-ink-800 dark:text-paper-50">
            <JapaneseText
              text={item.jpOrPattern}
              reading={item.reading || undefined}
              readingRuby={item.readingRuby || undefined}
              kanaText={item.reading || undefined}
              inert
            />
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
          {item.level ? <Badge tone="neutral" size="sm">{item.level}</Badge> : null}
          <Badge tone={masteryTone[item.mastery]} size="sm">{item.mastery}</Badge>
          <motion.span
            aria-hidden
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="ml-1 text-ink-400"
          >
            ▾
          </motion.span>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key="detail"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 0.61, 0.36, 1] }}
            className="overflow-hidden"
          >
            <motion.div
              initial={{ y: 6, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.22, ease: "easeOut", delay: 0.06 }}
              className="space-y-3 border-t border-paper-200 px-4 py-3 dark:border-ink-700"
            >
          {/* Arti penuh kotoba/bunpou — tidak di-truncate, jadi arti dengan
              beberapa makna (mis. "X, Y, Z") kelihatan semua. */}
          {!hideMeaning && item.meaning ? (
            <div className="rounded-xl border border-paper-200/70 bg-paper-50/40 px-3 py-2.5 dark:border-ink-700/70 dark:bg-ink-900/20">
              <div className="mb-1.5 flex items-center gap-1.5">
                <span aria-hidden className="h-3 w-1 rounded-full bg-accent-400/70" />
                <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
                  Arti
                </span>
              </div>
              <p className="text-sm leading-relaxed text-ink-700 dark:text-paper-50">
                {item.meaning}
              </p>
            </div>
          ) : null}

          {explained ? (
            <div className="rounded-xl border border-paper-200/70 bg-paper-50/40 px-3 py-2.5 dark:border-ink-700/70 dark:bg-ink-900/20">
              <div className="mb-1.5 flex items-center gap-1.5">
                <span aria-hidden className="h-3 w-1 rounded-full bg-accent-400/70" />
                <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
                  Contoh kalimat
                </span>
              </div>
              {(() => {
                // Contoh bisa berupa numbered list ("1. …\n2. …") terutama
                // untuk bunpou. Pecah jadi per-kalimat supaya furigana
                // (alignment) bekerja dan penomoran rapi — sama seperti
                // detail Bunpou di Catatan.
                const examples = splitNumberedExamples(
                  item.example ?? "",
                  item.exampleReading,
                  item.exampleMeaning,
                );
                if (examples.length <= 1) {
                  const ex = examples[0];
                  return (
                    <>
                      <p className="text-sm text-ink-700 dark:text-paper-50">
                        <JapaneseText
                          text={ex?.jp ?? item.example ?? ""}
                          reading={ex?.reading || item.exampleReading || undefined}
                          kanaText={ex?.reading || item.exampleReading || undefined}
                          sentenceMode
                          enableKanjiClick
                        />
                      </p>
                      {!hideMeaning && (ex?.meaning || item.exampleMeaning) ? (
                        <p className="mt-1 text-sm leading-relaxed text-ink-500 dark:text-paper-50/70">
                          {ex?.meaning || item.exampleMeaning}
                        </p>
                      ) : null}
                    </>
                  );
                }
                return (
                  <ol className="space-y-2">
                    {examples.map((ex, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="mt-0.5 shrink-0 text-xs font-semibold tabular-nums text-ink-400">
                          {i + 1}.
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-ink-700 dark:text-paper-50">
                            <JapaneseText
                              text={ex.jp}
                              reading={ex.reading || undefined}
                              kanaText={ex.reading || undefined}
                              sentenceMode
                              enableKanjiClick
                            />
                          </p>
                          {!hideMeaning && ex.meaning ? (
                            <p className="mt-0.5 text-sm leading-relaxed text-ink-500 dark:text-paper-50/70">
                              {ex.meaning}
                            </p>
                          ) : null}
                        </div>
                      </li>
                    ))}
                  </ol>
                );
              })()}
            </div>
          ) : aiPending ? (
            <div className="rounded-xl border border-paper-200 bg-paper-50/60 px-3 py-2 text-sm text-ink-700 dark:border-ink-700 dark:bg-ink-900/30 dark:text-paper-50">
              <div className="flex items-center gap-3">
                <LoaderGrid
                  label="AI sedang membuat penjelasan"
                  className="shrink-0 text-[0.4rem]"
                />
                <span>AI sedang membuat penjelasan…</span>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-paper-200 bg-paper-50/60 px-3 py-2 text-sm dark:border-ink-700 dark:bg-ink-900/30">
              <div className="font-medium text-ink-800 dark:text-paper-50">
                Penjelasan belum ada
              </div>
              <p className="mt-1 text-xs text-ink-400">
                AI bisa membuat penjelasan sekali, lalu disimpan untuk pemakaian
                berikutnya.
              </p>
            </div>
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
            {!explained ? (
              <Button
                size="sm"
                variant="secondary"
                loading={aiPending}
                onClick={onExplain}
              >
                ✨ AI Jelaskan
              </Button>
            ) : null}
          </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.li>
  );
}

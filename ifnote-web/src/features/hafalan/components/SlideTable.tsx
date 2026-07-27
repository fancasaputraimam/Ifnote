"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ChevronDown } from "lucide-react";
import { AiLoading } from "@/components/ui/ai-loading";
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
import { cn } from "@/lib/utils";
import type { HafalanSlide, Mastery } from "@/lib/types";

type Item = HafalanSlide["items"][number];

interface Props {
  items: Item[];
  hideMeaning: boolean;
}

const MASTERY_PILL: Record<Mastery, string> = {
  good: "text-leaf-600 dark:text-leaf-500",
  mid: "text-amber-600 dark:text-amber-400",
  weak: "text-rose-600 dark:text-rose-400",
};

/** Gaya pill quick-mastery saat aktif (per nilai) — sama dengan Catatan. */
const QUICK_MASTERY_ACTIVE: Record<Mastery, string> = {
  weak: "bg-rose-50 text-rose-600 ring-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-400/30",
  mid: "bg-amber-50 text-amber-600 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-200 dark:ring-amber-400/30",
  good: "bg-leaf-50 text-leaf-600 ring-leaf-200 dark:bg-leaf-500/15 dark:text-leaf-300 dark:ring-leaf-400/30",
};

/** Variants item detail — stagger saat baris dibuka (sama dengan Catatan). */
const detailItem = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: [0.22, 0.61, 0.36, 1] as const },
  },
};

/** Warna strip status di tepi kiri baris — scan cepat mana yang lemah. */
const MASTERY_BAR: Record<Mastery, string> = {
  weak: "bg-rose-400 dark:bg-rose-500",
  mid: "bg-amber-400 dark:bg-amber-500",
  good: "bg-leaf-500 dark:bg-leaf-600",
};

export function SlideTable({ items, hideMeaning }: Props) {
  return (
    <div className="overflow-hidden rounded-notebook bg-white shadow-notebook ring-1 ring-inset ring-paper-200/90 dark:bg-ink-800 dark:ring-ink-700">
      {/* Header washi ringkas + legenda status */}
      <div className="relative flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-paper-200 bg-paper-100/80 px-4 py-2.5 dark:border-ink-700 dark:bg-ink-900/50">
        <span aria-hidden className="absolute inset-y-1.5 left-2 w-px bg-accent-500/25" />
        <span className="pl-2 text-[11px] font-semibold uppercase tracking-wide text-ink-400">
          Daftar hafalan{" "}
          <span className="ml-1 font-jp normal-case tracking-[0.18em] text-ink-400/60">
            あんきリスト
          </span>
        </span>
        <span aria-hidden className="ml-auto flex items-center gap-3 text-[10px] text-ink-400/80">
          {(
            [
              { m: "weak", label: "lemah" },
              { m: "mid", label: "sedang" },
              { m: "good", label: "hafal" },
            ] as const
          ).map(({ m, label }) => (
            <span key={m} className="inline-flex items-center gap-1">
              <span className={cn("h-1.5 w-1.5 rounded-full", MASTERY_BAR[m])} />
              {label}
            </span>
          ))}
        </span>
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
  // Intip arti per item di layar sentuh (tap), selain hover di desktop.
  const [peek, setPeek] = useState(false);
  const masteryMut = useHafalanMastery();

  useEffect(() => setPeek(false), [hideMeaning]);
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
    // Loader inline (AiLoading, digerakkan `aiPending`) sudah jadi indikator
    // proses. Jangan pakai notify.promise — itu memunculkan toast loading
    // kedua yang berputar bersamaan (loading dobel). Cukup toast hasil.
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
        className="flex w-full items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-paper-50 dark:hover:bg-ink-700 sm:px-4"
      >
        {/* nomor urut */}
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[9px] bg-paper-100 font-serif text-xs tabular-nums text-ink-400 dark:bg-ink-900/50">
          {item.orderIndex}
        </span>

        {/* Jepang + arti bertumpuk — furigana punya ruang, tidak terpotong */}
        <div className="min-w-0 flex-1">
          <div className="text-base leading-relaxed text-ink-800 dark:text-paper-50">
            <JapaneseText
              text={item.jpOrPattern}
              reading={item.reading || undefined}
              readingRuby={item.readingRuby || undefined}
              kanaText={item.reading || undefined}
              inert
            />
          </div>
          {hideMeaning ? (
            // Intip arti: blur yang menajam saat hover (desktop) atau
            // di-tap (layar sentuh) — latihan mengingat dulu, baru cek.
            <p
              onClick={(e) => {
                e.stopPropagation();
                setPeek((v) => !v);
              }}
              className={cn(
                "mt-0.5 line-clamp-1 cursor-pointer text-sm text-ink-500 transition-[filter] duration-200 dark:text-paper-50/70",
                peek ? "blur-0" : "blur-[6px] hover:blur-0",
              )}
              title="Arahkan kursor atau tap untuk mengintip arti"
            >
              {item.meaning}
            </p>
          ) : (
            <p className="mt-0.5 line-clamp-1 text-sm text-ink-500 dark:text-paper-50/70">
              {item.meaning}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {item.level ? <Badge tone="neutral" size="sm">{item.level}</Badge> : null}
          <span
            className={cn(
              "inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide",
              MASTERY_PILL[item.mastery],
            )}
          >
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current" />
            <span className="hidden sm:inline">{item.mastery}</span>
          </span>
          <motion.span
            aria-hidden
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-ink-400"
          >
            <ChevronDown className="h-4 w-4" />
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
            transition={{ duration: 0.32, ease: [0.22, 0.61, 0.36, 1] }}
            className="overflow-hidden"
          >
            <motion.div
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.06, delayChildren: 0.08 } },
              }}
              initial="hidden"
              animate="visible"
              className="relative space-y-3 border-t border-paper-200 bg-paper-50/40 px-4 py-4 dark:border-ink-700 dark:bg-ink-900/20 sm:px-5"
            >
              {/* garis margin merah — motif buku latihan */}
              <span aria-hidden className="absolute inset-y-3 left-2 w-px bg-accent-500/20" />

              {/* Arti penuh — tidak di-truncate, jadi arti dengan beberapa
                  makna (mis. "X, Y, Z") kelihatan semua. */}
              {!hideMeaning && item.meaning ? (
                <DetailSection label="Arti">
                  <p className="text-sm leading-relaxed text-ink-700 dark:text-paper-50">
                    {item.meaning}
                  </p>
                </DetailSection>
              ) : null}

              {explained ? (
                <DetailSection label="Contoh kalimat">
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
                </DetailSection>
              ) : aiPending ? (
                <motion.div variants={detailItem}>
                  <AiLoading
                    compact
                    title="AI sedang membuat penjelasan…"
                    description="Hasilnya disimpan otomatis untuk pemakaian berikutnya."
                  />
                </motion.div>
              ) : (
                <motion.div
                  variants={detailItem}
                  className="rounded-xl border border-paper-200 bg-white/80 p-3 text-sm dark:border-ink-700 dark:bg-ink-800/70"
                >
                  <div className="font-medium text-ink-800 dark:text-paper-50">
                    Penjelasan belum ada
                  </div>
                  <p className="mt-1 text-xs text-ink-400">
                    AI bisa membuat penjelasan sekali, lalu disimpan untuk
                    pemakaian berikutnya.
                  </p>
                </motion.div>
              )}

              {/* Quick mastery — pill satu klik, seirama Catatan. */}
              <motion.div
                variants={detailItem}
                className="flex flex-wrap items-center gap-1.5"
              >
                <span className="mr-1 text-[11px] font-semibold uppercase tracking-wide text-ink-400">
                  Mastery
                </span>
                {(["weak", "mid", "good"] as Mastery[]).map((m) => {
                  const active = item.mastery === m;
                  return (
                    <button
                      key={m}
                      type="button"
                      aria-pressed={active}
                      disabled={active || masteryMut.isPending}
                      onClick={() => onMastery(m)}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset transition-colors",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400",
                        active
                          ? QUICK_MASTERY_ACTIVE[m]
                          : "bg-white text-ink-400 ring-paper-200 hover:text-ink-700 disabled:opacity-60 dark:bg-ink-800 dark:ring-ink-700 dark:hover:text-paper-50",
                      )}
                    >
                      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current" />
                      {m === "good" ? "good · hafal" : m === "weak" ? "weak · lemah" : "mid"}
                    </button>
                  );
                })}
                {!explained ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    loading={aiPending}
                    onClick={onExplain}
                    className="ml-auto gap-1"
                  >
                    <span aria-hidden>✨</span> AI Jelaskan
                  </Button>
                ) : null}
              </motion.div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.li>
  );
}

/** Kartu seksi detail — putih terangkat di atas washi, label bertitik merah. */
function DetailSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      variants={detailItem}
      className="rounded-xl bg-white/80 px-3.5 py-3 ring-1 ring-inset ring-paper-200/70 dark:bg-ink-800/70 dark:ring-ink-700/70"
    >
      <div className="mb-1.5 flex items-center gap-1.5">
        <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-accent-500/80" />
        <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
          {label}
        </span>
      </div>
      <div>{children}</div>
    </motion.div>
  );
}

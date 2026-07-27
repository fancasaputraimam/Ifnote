"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { JapaneseText } from "@/components/japanese/JapaneseText";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { AiLoading } from "@/components/ui/ai-loading";
import { ConfirmDialog } from "@/components/feedback/ConfirmDialog";
import { notify } from "@/lib/toast";
import { mapApiErrorToUserMessage } from "@/lib/error-mapper";
import type { Bunpou, CatatanItem, JpMode, Kotoba, Mastery } from "@/lib/types";
import {
  useAiExplainBunpou,
  useAiExplainKotoba,
  useDeleteBunpou,
  useDeleteKotoba,
  useSetMastery,
} from "@/features/catatan/useCatatan";
import { catatanItemHasExplanation } from "@/lib/explanation";
import {
  buildBunpouExplanationView,
  type BunpouExplanationView,
} from "@/lib/bunpou-format";
import { cn } from "@/lib/utils";

interface Props {
  item: CatatanItem;
  onEdit: (item: CatatanItem) => void;
  /** Klik tag → filter list (search per-tag di server). */
  onTagClick?: (tag: string) => void;
}

/** Variants item detail — dipakai stagger saat accordion terbuka. */
const detailItem = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: [0.22, 0.61, 0.36, 1] as const },
  },
};

const MASTERY_PILL: Record<Mastery, string> = {
  good: "text-leaf-600 dark:text-leaf-500",
  mid: "text-amber-600 dark:text-amber-400",
  weak: "text-rose-600 dark:text-rose-400",
};

/** Gaya pill quick-mastery saat aktif (per nilai). */
const QUICK_MASTERY_ACTIVE: Record<Mastery, string> = {
  weak: "bg-rose-50 text-rose-600 ring-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-400/30",
  mid: "bg-amber-50 text-amber-600 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-200 dark:ring-amber-400/30",
  good: "bg-leaf-50 text-leaf-600 ring-leaf-200 dark:bg-leaf-500/15 dark:text-leaf-300 dark:ring-leaf-400/30",
};

const TYPE_STAMP = {
  kotoba:
    "bg-accent-50 text-accent-600 ring-accent-200/70 dark:bg-accent-500/15 dark:text-accent-200 dark:ring-accent-400/25",
  bunpou:
    "bg-lilac-50 text-lilac-600 ring-lilac-200/70 dark:bg-lilac-500/15 dark:text-lilac-300 dark:ring-lilac-400/25",
} as const;

export function CatatanRow({ item, onEdit, onTagClick }: Props) {
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const deleteKotoba = useDeleteKotoba();
  const deleteBunpou = useDeleteBunpou();
  const aiKotoba = useAiExplainKotoba();
  const aiBunpou = useAiExplainBunpou();
  const setMastery = useSetMastery();

  const isKotoba = item.noteType === "kotoba";
  const detail = item.detail as Record<string, unknown>;

  const explained = catatanItemHasExplanation(item);
  const aiPending = isKotoba ? aiKotoba.isPending : aiBunpou.isPending;

  const onExplain = async () => {
    // Loader inline (ExplainLoading, digerakkan `aiPending`) sudah jadi
    // indikator proses. Jangan pakai notify.promise di sini — itu memunculkan
    // toast loading kedua yang berputar bersamaan (loading dobel). Cukup
    // toast hasil: sukses / error.
    try {
      if (isKotoba) {
        await aiKotoba.mutateAsync(item.id);
      } else {
        await aiBunpou.mutateAsync(item.id);
      }
      notify.success(
        "Penjelasan disimpan",
        "Kamu bisa membukanya lagi tanpa analisa ulang.",
        { icon: "🌸" },
      );
      // Invalidasi sudah di-handle oleh hook bila `generated: true`.
    } catch (e) {
      const m = mapApiErrorToUserMessage(e, {
        title: "Penjelasan gagal dibuat",
        message: "Coba lagi sebentar.",
      });
      notify[m.variant](m.title, m.message);
    }
  };

  const onDelete = async () => {
    try {
      if (isKotoba) {
        await deleteKotoba.mutateAsync(item.id);
      } else {
        await deleteBunpou.mutateAsync(item.id);
      }
      notify.success(
        isKotoba ? "Kotoba dihapus" : "Bunpou dihapus",
        isKotoba
          ? "Catatan sudah dihapus dari daftar kamu."
          : "Catatan bunpou sudah dihapus.",
        { icon: "🗑️" },
      );
    } catch (e) {
      const m = mapApiErrorToUserMessage(e, {
        title: "Gagal menghapus",
        message: "Coba lagi sebentar.",
      });
      notify[m.variant](m.title, m.message);
    } finally {
      setConfirmDelete(false);
    }
  };

  return (
    <div
      className={cn(
        "rounded-notebook bg-white ring-1 ring-inset ring-paper-200/90 transition-shadow hover:shadow-notebook dark:bg-ink-800 dark:ring-ink-700",
        open && "shadow-notebook-md",
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-3 py-3 text-left sm:px-4"
      >
        {/* stempel tipe — 言 kotoba / 文 bunpou */}
        <span
          aria-hidden
          className={cn(
            "grid h-10 w-10 shrink-0 -rotate-3 place-items-center rounded-[10px] font-serif text-base ring-1 ring-inset transition-transform duration-200",
            open && "rotate-0",
            TYPE_STAMP[item.noteType],
          )}
        >
          {isKotoba ? "言" : "文"}
        </span>

        <div className="min-w-0 flex-1">
          <div className="text-base font-medium text-ink-800 dark:text-paper-50">
            <JapaneseText
              text={item.jpOrPattern}
              reading={
                // Tampilkan reading di atas kanji judul kalau backend
                // menyimpan field `reading` (Kotoba/Bunpou). detail blob
                // dari endpoint catatan list sudah melalui field ini.
                ((item.detail as { reading?: string | null })?.reading) || undefined
              }
              readingRuby={
                // Furigana per-kanji eksplisit dari AI ("勉(べん)強(きょう)"),
                // kalau tersedia. Jadi sumber utama; kalau null fallback ke
                // pemecah kamus dari `reading`.
                ((item.detail as { readingRuby?: string | null })?.readingRuby) || undefined
              }
              kanaText={
                ((item.detail as { reading?: string | null })?.reading) || undefined
              }
              enableKanjiClick
            />
          </div>
          <p className="mt-0.5 truncate text-xs text-ink-400">{item.meaning}</p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {item.level ? (
            <Badge tone={isKotoba ? "accent" : "lilac"}>{item.level}</Badge>
          ) : null}
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
              className="relative border-t border-paper-200 bg-paper-50/40 px-4 py-4 text-sm dark:border-ink-700 dark:bg-ink-900/20 sm:px-5"
            >
              {/* garis margin merah — motif buku latihan */}
              <span aria-hidden className="absolute inset-y-3 left-2 w-px bg-accent-500/20" />
              {/* Cached vs missing explanation states */}
              {!explained && aiPending ? (
                <ExplainLoading />
              ) : !explained ? (
                <ExplainPrompt onExplain={onExplain} pending={aiPending} />
              ) : isKotoba ? (
                <KotobaDetail detail={detail} />
              ) : (
                <BunpouDetail detail={detail} meaning={item.meaning} />
              )}

              {/* Quick mastery — satu klik tanpa buka dialog Edit. */}
              <motion.div
                variants={detailItem}
                className="mt-4 flex flex-wrap items-center gap-1.5"
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
                      disabled={active || setMastery.isPending}
                      onClick={() =>
                        setMastery.mutate({
                          itemType: item.noteType,
                          itemId: item.id,
                          mastery: m,
                        })
                      }
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset transition-colors",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400",
                        active
                          ? QUICK_MASTERY_ACTIVE[m]
                          : "bg-white text-ink-400 ring-paper-200 hover:text-ink-700 disabled:opacity-60 dark:bg-ink-800 dark:ring-ink-700 dark:hover:text-paper-50",
                      )}
                    >
                      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current" />
                      {m}
                    </button>
                  );
                })}
              </motion.div>

              {item.tags?.length ? (
                <motion.div variants={detailItem} className="mt-3 flex flex-wrap gap-1.5">
                  {item.tags.map((t) =>
                    onTagClick ? (
                      <button
                        key={t}
                        type="button"
                        onClick={() => onTagClick(t)}
                        aria-label={`Filter berdasarkan tag ${t}`}
                        className="rounded-full bg-paper-100 px-2.5 py-0.5 text-[11px] font-medium text-ink-500 ring-1 ring-inset ring-paper-200 transition-colors hover:bg-accent-50 hover:text-accent-700 hover:ring-accent-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 dark:bg-ink-700 dark:text-paper-50/70 dark:ring-ink-600 dark:hover:bg-accent-500/15 dark:hover:text-accent-200"
                      >
                        #{t}
                      </button>
                    ) : (
                      <Badge key={t} tone="neutral">#{t}</Badge>
                    ),
                  )}
                </motion.div>
              ) : null}

              <motion.div variants={detailItem} className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" onClick={() => onEdit(item)}>
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="ml-auto text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-700/10"
                  onClick={() => setConfirmDelete(true)}
                >
                  Hapus
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <ConfirmDialog
        open={confirmDelete}
        title="Hapus catatan?"
        description={`"${item.jpOrPattern}" akan dihapus dari catatan dan Hafalan order. Aksi ini tidak bisa di-undo.`}
        confirmLabel="Hapus"
        destructive
        onConfirm={onDelete}
        onClose={() => setConfirmDelete(false)}
      />
    </div>
  );
}

// ---------- explanation states -------------------------------------

function ExplainPrompt({
  onExplain,
  pending,
}: {
  onExplain: () => void;
  pending: boolean;
}) {
  return (
    <motion.div
      variants={detailItem}
      className="rounded-xl border border-paper-200 bg-white/80 p-3 text-sm dark:border-ink-700 dark:bg-ink-800/70"
    >
      <div className="font-medium text-ink-800 dark:text-paper-50">
        Penjelasan belum ada
      </div>
      <p className="mt-1 text-xs text-ink-400">
        AI bisa membuat penjelasan dan menyimpannya agar tidak memakai token
        lagi.
      </p>
      <div className="mt-3">
        <Button size="sm" loading={pending} onClick={onExplain}>
          ✨ AI Jelaskan
        </Button>
      </div>
    </motion.div>
  );
}

function ExplainLoading() {
  return (
    <motion.div variants={detailItem}>
      <AiLoading
        compact
        title="AI sedang membuat penjelasan…"
        description="Hasilnya disimpan otomatis supaya tidak memakai token ulang."
      />
    </motion.div>
  );
}

// ---------- detail blocks ------------------------------------------

function KotobaDetail({ detail }: { detail: Record<string, unknown> }) {
  const beginnerExample = stringOrNull(detail.beginnerExample);
  const beginnerExampleReading = stringOrNull(detail.beginnerExampleReading);
  const beginnerExampleMeaning = stringOrNull(detail.beginnerExampleMeaning);
  const normalExample = stringOrNull(detail.normalExample);
  const normalExampleReading = stringOrNull(detail.normalExampleReading);
  const normalExampleMeaning = stringOrNull(detail.normalExampleMeaning);
  const furiganaExample = stringOrNull(detail.furiganaExample);
  const exampleReading = stringOrNull(detail.exampleReading);
  const exampleMeaning = stringOrNull(detail.exampleMeaning);
  const reading = stringOrNull(detail.reading);
  const romaji = stringOrNull(detail.romaji);
  const type = stringOrNull(detail.type);

  // Per-example reading mapping (spec PART 7):
  //   beginner -> beginnerExampleReading ONLY (no fallback to normal/shared)
  //   normal   -> normalExampleReading, fallback ke exampleReading (shared)
  //               karena exampleReading secara historis = reading kalimat normal
  //   arti     -> per-example meaning, fallback ke shared exampleMeaning
  //               hanya untuk normal (bukan beginner)
  const beginnerReading = beginnerExampleReading; // jangan fallback!
  const normalReading = normalExampleReading || exampleReading;
  const beginnerMeaning = beginnerExampleMeaning; // jangan fallback ke shared
  const normalMeaning = normalExampleMeaning || exampleMeaning;

  // Satu contoh kalimat saja. Memisah "beginner" vs "normal" tidak masuk
  // akal karena JapaneseText sudah merender sesuai Mode Jepang
  // (kana / furigana / kanji). Prioritas: normal (paling kaya, ada kanji)
  // → beginner → furigana. Reading & arti diambil berpasangan dengan
  // contoh yang dipilih.
  const exampleJp = normalExample || beginnerExample || furiganaExample;
  const exampleJpReading = normalExample
    ? normalReading
    : beginnerExample
      ? beginnerReading
      : null;
  const exampleJpMeaning =
    (normalExample
      ? normalMeaning
      : beginnerExample
        ? beginnerMeaning
        : null) || exampleMeaning;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {reading ? (
          <Section label="Pembacaan">
            <span className="font-jp text-ink-700 dark:text-paper-50">{reading}</span>
          </Section>
        ) : null}
        {romaji ? (
          <Section label="Romaji">
            <span className="text-ink-700 dark:text-paper-50">{romaji}</span>
          </Section>
        ) : null}
        {type ? (
          <Section label="Jenis">
            <span className="text-ink-700 dark:text-paper-50">{type}</span>
          </Section>
        ) : null}
      </div>

      {exampleJp ? (
        <Section label="Contoh kalimat">
          <ExampleLine jp={exampleJp} reading={exampleJpReading} />
          {exampleJpMeaning ? (
            <p className="mt-1 text-sm leading-relaxed text-ink-700 dark:text-paper-50">
              {exampleJpMeaning}
            </p>
          ) : (
            <p className="mt-1 text-xs italic text-ink-400">
              Arti contoh belum tersedia.
            </p>
          )}
        </Section>
      ) : null}
    </div>
  );
}

function BunpouDetail({
  detail,
  meaning,
}: {
  detail: Record<string, unknown>;
  meaning?: string;
}) {
  const formula = stringOrNull(detail.formula);
  const usage = stringOrNull(detail.usage);
  const beginnerExample = stringOrNull(detail.beginnerExample);
  const normalExample = stringOrNull(detail.normalExample);
  const exampleReading = stringOrNull(detail.exampleReading);
  const exampleMeaning = stringOrNull(detail.exampleMeaning);
  const note = stringOrNull(detail.note);
  const commonMistake = stringOrNull(detail.commonMistake);

  const view: BunpouExplanationView = buildBunpouExplanationView({
    formula,
    usage,
    commonMistake,
    normalExample,
    beginnerExample,
    exampleReading,
    exampleMeaning,
  });

  const arti = meaning && meaning.trim().length > 0 ? meaning.trim() : null;

  return (
    <div className="space-y-3">
      {arti ? (
        <Section label="Arti">
          <p className="leading-relaxed text-ink-700 dark:text-paper-50">{arti}</p>
        </Section>
      ) : null}

      {view.formulaLines.length ? (
        <Section label="Formula">
          <ul className="space-y-1.5">
            {view.formulaLines.map((line, i) => (
              <li
                key={i}
                className="rounded-lg bg-paper-100 px-3 py-2 font-mono text-sm text-ink-800 dark:bg-ink-700 dark:text-paper-50"
              >
                <JapaneseText text={line} />
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {view.transformExamples.length ? (
        <Section label="Contoh Perubahan">
          <ul className="space-y-1.5">
            {view.transformExamples.map((t, i) => (
              <li
                key={i}
                className="flex flex-wrap items-center gap-2 rounded-lg bg-accent-50/60 px-3 py-2 text-sm dark:bg-accent-700/15"
              >
                <span className="font-jp text-ink-800 dark:text-paper-50">
                  <JapaneseText text={t.from} />
                </span>
                <span aria-hidden className="text-accent-600 dark:text-accent-300">
                  →
                </span>
                <span className="font-jp text-ink-800 dark:text-paper-50">
                  <JapaneseText text={t.to} />
                </span>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {view.usageParagraphs.length ? (
        <Section label="Kapan dipakai">
          <ul className="space-y-1.5">
            {view.usageParagraphs.map((p, i) => (
              <li
                key={i}
                className="rounded-lg bg-paper-50/60 px-3 py-2 text-sm leading-relaxed text-ink-700 dark:bg-ink-900/30 dark:text-paper-50"
              >
                {p}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {view.exampleSentences.length ? (
        <Section label="Contoh kalimat">
          <ol className="space-y-2">
            {view.exampleSentences.map((ex, i) => (
              <li
                key={i}
                className="rounded-xl border border-paper-200 bg-white px-3 py-2 dark:border-ink-700 dark:bg-ink-800"
              >
                <div className="flex items-start gap-2 text-base">
                  <span className="mt-0.5 shrink-0 text-xs font-semibold tabular-nums text-ink-400">
                    {i + 1}.
                  </span>
                  <div className="min-w-0 flex-1">
                    <ExampleLine jp={ex.jp} reading={ex.reading} />
                    {ex.meaning ? (
                      <p className="mt-1 text-sm leading-relaxed text-ink-700 dark:text-paper-50">
                        {ex.meaning}
                      </p>
                    ) : (
                      <p className="mt-1 text-xs italic text-ink-400">
                        Arti contoh belum tersedia.
                      </p>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </Section>
      ) : null}

      {view.commonMistakes.length ? (
        <Section label="Kesalahan umum">
          <ol className="space-y-2">
            {view.commonMistakes.map((m, i) => (
              <li
                key={i}
                className="flex gap-2 rounded-xl border border-amber-200/70 bg-amber-50/60 px-3 py-2 text-sm text-amber-900 dark:border-amber-700/40 dark:bg-amber-700/10 dark:text-amber-100"
              >
                <span className="font-semibold tabular-nums">{i + 1}.</span>
                <span className="leading-relaxed">{m}</span>
              </li>
            ))}
          </ol>
        </Section>
      ) : null}

      {note ? (
        <Section label="Catatan">
          <p className="leading-relaxed text-ink-700 dark:text-paper-50">
            {note}
          </p>
        </Section>
      ) : null}
    </div>
  );
}

function Section({
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

function ExampleLine({
  jp,
  mode,
  reading,
}: {
  jp: string;
  mode?: JpMode;
  reading?: string | null;
}) {
  return (
    <div className="text-base">
      {/* sentenceMode mencegah ruby dipaksakan di atas kalimat penuh —
          pakai helper `よみ: …` di mode Normal kalau alignment tidak
          reliable. Di mode Pemula, `kanaText` (reading) jadi teks utama.
          enableKanjiClick: kanji di contoh kalimat tetap bisa diklik untuk
          buka KanjiPopup. KanjiPopup pakai portal jadi aman walau komponen
          ini ada di dalam accordion `<button>`. */}
      <JapaneseText
        text={jp}
        mode={mode}
        reading={reading || undefined}
        kanaText={reading || undefined}
        sentenceMode
        enableKanjiClick
      />
    </div>
  );
}

function stringOrNull(v: unknown): string | null {
  return typeof v === "string" && v.length > 0 ? v : null;
}

// Note: kept as Kotoba/Bunpou type imports above to ease future field usage.
export type { Kotoba, Bunpou };

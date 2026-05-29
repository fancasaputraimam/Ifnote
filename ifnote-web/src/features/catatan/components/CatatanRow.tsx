"use client";

import { useState } from "react";
import { JapaneseText } from "@/components/japanese/JapaneseText";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import LoaderGrid from "@/components/ui/loader-grid";
import { ConfirmDialog } from "@/components/feedback/ConfirmDialog";
import { notify } from "@/lib/toast";
import { mapApiErrorToUserMessage } from "@/lib/error-mapper";
import type { Bunpou, CatatanItem, Kotoba, Mastery } from "@/lib/types";
import {
  useAiExplainBunpou,
  useAiExplainKotoba,
  useDeleteBunpou,
  useDeleteKotoba,
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
}

const masteryTone: Record<Mastery, "leaf" | "warn" | "danger"> = {
  good: "leaf",
  mid: "warn",
  weak: "danger",
};

export function CatatanRow({ item, onEdit }: Props) {
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const deleteKotoba = useDeleteKotoba();
  const deleteBunpou = useDeleteBunpou();
  const aiKotoba = useAiExplainKotoba();
  const aiBunpou = useAiExplainBunpou();

  const isKotoba = item.noteType === "kotoba";
  const detail = item.detail as Record<string, unknown>;

  const explained = catatanItemHasExplanation(item);
  const aiPending = isKotoba ? aiKotoba.isPending : aiBunpou.isPending;

  const onExplain = async () => {
    try {
      await notify.promise(
        async () => {
          if (isKotoba) {
            await aiKotoba.mutateAsync(item.id);
          } else {
            await aiBunpou.mutateAsync(item.id);
          }
        },
        {
          loading: {
            title: "AI sedang membuat penjelasan…",
            message: "Tunggu sebentar ya.",
            icon: "✨",
          },
          success: {
            title: "Penjelasan disimpan",
            message: "Kamu bisa membukanya lagi tanpa analisa ulang.",
            icon: "🌸",
          },
          error: (err) => {
            const m = mapApiErrorToUserMessage(err, {
              title: "Penjelasan gagal dibuat",
              message: "Coba lagi sebentar.",
            });
            return { title: m.title, message: m.message, icon: "⚠️" };
          },
        },
      );
      // Invalidasi sudah di-handle oleh hook bila `generated: true`.
    } catch {
      // notify.promise sudah menampilkan toast error — swallow.
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
        "rounded-notebook border border-paper-200 bg-white transition-colors dark:border-ink-700 dark:bg-ink-800",
        open && "shadow-notebook",
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 px-3 py-3 text-left sm:px-4"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="text-base font-medium text-ink-800 dark:text-paper-50">
              <JapaneseText
                text={item.jpOrPattern}
                reading={
                  // Tampilkan reading di atas kanji judul kalau backend
                  // menyimpan field `reading` (Kotoba/Bunpou). detail blob
                  // dari endpoint catatan list sudah melalui field ini.
                  ((item.detail as { reading?: string | null })?.reading) || undefined
                }
              />
            </span>
            <span className="truncate text-xs text-ink-400">
              {item.meaning}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Badge tone={isKotoba ? "accent" : "lilac"}>
            {isKotoba ? "Kotoba" : "Bunpou"}
          </Badge>
          {item.level ? (
            <Badge tone={isKotoba ? "accent" : "lilac"}>{item.level}</Badge>
          ) : null}
          <Badge tone={masteryTone[item.mastery]}>{item.mastery}</Badge>
          <span aria-hidden className={cn("text-ink-400 transition-transform", open && "rotate-180")}>▾</span>
        </div>
      </button>

      {open ? (
        <div className="border-t border-paper-200 px-3 py-4 text-sm dark:border-ink-700 sm:px-4">
          {/* Cached vs missing explanation states */}
          {!explained && aiPending ? (
            <ExplainLoading />
          ) : !explained ? (
            <ExplainPrompt onExplain={onExplain} pending={aiPending} />
          ) : isKotoba ? (
            <KotobaDetail detail={detail} />
          ) : (
            <BunpouDetail detail={detail} />
          )}

          {item.tags?.length ? (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {item.tags.map((t) => (
                <Badge key={t} tone="neutral">#{t}</Badge>
              ))}
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-2">
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
          </div>
        </div>
      ) : null}

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
    <div className="rounded-xl border border-paper-200 bg-paper-50/60 p-3 text-sm dark:border-ink-700 dark:bg-ink-900/30">
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
    </div>
  );
}

function ExplainLoading() {
  return (
    <div className="rounded-xl border border-paper-200 bg-paper-50/60 p-3 text-sm dark:border-ink-700 dark:bg-ink-900/30">
      <div className="flex items-center gap-3 text-ink-700 dark:text-paper-50">
        <LoaderGrid
          label="AI sedang membuat penjelasan"
          className="shrink-0 text-[0.4rem]"
        />
        <span>AI sedang membuat penjelasan…</span>
      </div>
      <p className="mt-1 text-xs text-ink-400">
        Hasilnya akan disimpan otomatis supaya tidak memakai token ulang.
      </p>
    </div>
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

      {beginnerExample ? (
        <Section label="Contoh (beginner)">
          <ExampleLine jp={beginnerExample} reading={beginnerReading} />
          {beginnerMeaning ? (
            <p className="mt-1 text-sm leading-relaxed text-ink-700 dark:text-paper-50">
              {beginnerMeaning}
            </p>
          ) : null}
        </Section>
      ) : null}
      {normalExample && normalExample !== beginnerExample ? (
        <Section label="Contoh (normal)">
          <ExampleLine jp={normalExample} reading={normalReading} />
          {normalMeaning ? (
            <p className="mt-1 text-sm leading-relaxed text-ink-700 dark:text-paper-50">
              {normalMeaning}
            </p>
          ) : null}
        </Section>
      ) : null}
      {furiganaExample ? (
        <Section label="Contoh (furigana)">
          <ExampleLine jp={furiganaExample} mode="furigana" />
        </Section>
      ) : null}
      {/* Legacy single "Arti contoh" — hanya tampil kalau tidak ada
          per-example meaning di atas (supaya tidak dobel). */}
      {!beginnerMeaning && !normalMeaning && exampleMeaning ? (
        <Section label="Arti contoh">
          <p className="leading-relaxed text-ink-700 dark:text-paper-50">
            {exampleMeaning}
          </p>
        </Section>
      ) : !beginnerMeaning &&
        !normalMeaning &&
        !exampleMeaning &&
        (beginnerExample || normalExample || furiganaExample) ? (
        <Section label="Arti contoh">
          <p className="text-xs italic text-ink-400">
            Arti contoh belum tersedia.
          </p>
        </Section>
      ) : null}
    </div>
  );
}

function BunpouDetail({ detail }: { detail: Record<string, unknown> }) {
  const formula = stringOrNull(detail.formula);
  const usage = stringOrNull(detail.usage);
  const beginnerExample = stringOrNull(detail.beginnerExample);
  const normalExample = stringOrNull(detail.normalExample);
  const furiganaExample = stringOrNull(detail.furiganaExample);
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

  return (
    <div className="space-y-3">
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

      {furiganaExample ? (
        <Section label="Contoh (furigana)">
          <ExampleLine jp={furiganaExample} mode="furigana" />
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
    <div>
      <div className="mb-1 text-[11px] font-medium uppercase tracking-wide text-ink-400">
        {label}
      </div>
      <div>{children}</div>
    </div>
  );
}

function ExampleLine({
  jp,
  mode,
  reading,
}: {
  jp: string;
  mode?: "furigana";
  reading?: string | null;
}) {
  return (
    <div className="text-base">
      {/* sentenceMode mencegah ruby dipaksakan di atas kalimat penuh —
          pakai helper `よみ: …` di mode Pemula kalau alignment tidak
          reliable. Tidak `inert`: kanji di contoh kalimat tetap bisa
          diklik untuk buka KanjiPopup. KanjiPopup pakai portal jadi
          aman walau komponen ini ada di dalam accordion `<button>`. */}
      <JapaneseText
        text={jp}
        mode={mode}
        reading={reading || undefined}
        sentenceMode
      />
    </div>
  );
}

function stringOrNull(v: unknown): string | null {
  return typeof v === "string" && v.length > 0 ? v : null;
}

// Note: kept as Kotoba/Bunpou type imports above to ease future field usage.
export type { Kotoba, Bunpou };

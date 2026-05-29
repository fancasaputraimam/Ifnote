"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LinkButton } from "@/components/ui/LinkButton";
import { LoadingState } from "@/components/feedback/LoadingState";
import { AiLoading } from "@/components/ui/ai-loading";
import { EmptyState } from "@/components/feedback/EmptyState";
import { PanelCard } from "@/components/ui/PanelCard";
import { JapaneseText } from "@/components/japanese/JapaneseText";
import { notify } from "@/lib/toast";
import { mapApiErrorToUserMessage } from "@/lib/error-mapper";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  useGenerateSakubun,
  type SakubunData,
  type SakubunUsedBunpou,
} from "@/features/quiz/useQuiz";
import { useCatatanList } from "@/features/catatan/useCatatan";
import type { CatatanItem } from "@/lib/types";

const MAX_SELECT = 10;

export function SakubunPanel() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [result, setResult] = useState<SakubunData | null>(null);
  const [requested, setRequested] = useState<
    Array<{ id: string; pattern: string }> | null
  >(null);

  // Pull bunpou from Catatan (existing endpoint, no new API).
  const listQ = useCatatanList({
    type: "bunpou",
    limit: 100,
  });
  const items = useMemo<CatatanItem[]>(
    () => (listQ.data?.items ?? []).filter((it) => it.noteType === "bunpou"),
    [listQ.data],
  );

  const gen = useGenerateSakubun();

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        return next;
      }
      if (next.size >= MAX_SELECT) {
        notify.warning(
          "Pilihan terlalu banyak",
          `Maksimal ${MAX_SELECT} bunpou untuk sekali generate sakubun.`,
          { icon: "🍂" },
        );
        return prev;
      }
      next.add(id);
      return next;
    });
  };

  const onReset = () => {
    setSelected(new Set());
    setResult(null);
  };

  const onGenerate = async () => {
    const ids = Array.from(selected);
    if (ids.length === 0) {
      notify.warning(
        "Belum ada bunpou dipilih",
        "Centang minimal satu bunpou dulu.",
      );
      return;
    }
    if (ids.length > MAX_SELECT) {
      notify.warning(
        "Pilihan terlalu banyak",
        `Maksimal ${MAX_SELECT} bunpou untuk sekali generate sakubun.`,
        { icon: "🍂" },
      );
      return;
    }
    try {
      const r = await notify.promise(
        gen.mutateAsync({ bunpouIds: ids, level: "beginner" }),
        {
          loading: {
            title: "AI sedang membuat sakubun…",
            message: "Menggunakan bunpou yang kamu pilih.",
            icon: "✨",
          },
          success: {
            title: "Sakubun selesai",
            message: "Periksa hasilnya dan pelajari bunpou yang dipakai.",
            icon: "🌸",
          },
          error: (err) => {
            const m = mapApiErrorToUserMessage(err, {
              title: "Sakubun gagal dibuat",
              message: "Coba lagi sebentar.",
            });
            return { title: m.title, message: m.message, icon: "⚠️" };
          },
        },
      );
      setResult(r.data ?? null);
      setRequested(
        (r.requested ?? []).map((x) => ({ id: x.id, pattern: x.pattern })),
      );
    } catch {
      // notify.promise sudah menampilkan toast error — swallow.
    }
  };

  const onCopy = async () => {
    if (!result) return;
    const lines: string[] = [];
    if (result.title) lines.push(result.title);
    if (result.sakubun) lines.push("", result.sakubun);
    if (result.meaning) lines.push("", result.meaning);
    if (result.usedBunpou && result.usedBunpou.length > 0) {
      lines.push("", "Bunpou yang dipakai:");
      for (const b of result.usedBunpou) {
        lines.push(`- ${b.pattern}: ${b.sentence} — ${b.meaning}`);
      }
    }
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      notify.success("Disalin", "Teks berhasil disalin.", { icon: "📋" });
    } catch {
      notify.error("Gagal menyalin", "Browser menolak akses clipboard.");
    }
  };

  // ---------- empty state: tidak punya bunpou di Catatan ----------
  if (!listQ.isLoading && items.length === 0) {
    return (
      <PanelCard padding="default">
        <EmptyState
          icon="✍️"
          title="Belum ada bunpou"
          description="Tambahkan bunpou dulu di Catatan agar AI bisa membuat sakubun."
          action={
            <LinkButton size="sm" href={ROUTES.app.catatan}>
              Buka Catatan
            </LinkButton>
          }
        />
      </PanelCard>
    );
  }

  return (
    <div className="space-y-4">
      {/* ---------------- Selection panel ---------------- */}
      <PanelCard
        eyebrow="✍️ Sakubun"
        title="Pilih Bunpou untuk Sakubun"
        description={`Pilih maksimal ${MAX_SELECT} bunpou dari Catatan. AI akan membuat sakubun memakai bunpou yang kamu pilih.`}
        headerAction={
          <span
            className={cn(
              "text-xs font-medium tabular-nums",
              selected.size > MAX_SELECT
                ? "text-rose-600 dark:text-rose-400"
                : "text-ink-400",
            )}
          >
            {selected.size} / {MAX_SELECT} bunpou dipilih
          </span>
        }
      >
        {listQ.isLoading ? (
          <div>
            <LoadingState label="Memuat daftar bunpou…" />
          </div>
        ) : (
          <ul className="max-h-[40vh] space-y-1.5 overflow-y-auto pr-1">
            {items.map((it) => {
              const isSelected = selected.has(it.id);
              return (
                <li key={it.id}>
                  <label
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2 transition-colors",
                      isSelected
                        ? "border-accent-300 bg-accent-50/60 dark:border-accent-500/60 dark:bg-accent-700/15"
                        : "border-paper-200 bg-white hover:border-accent-200 hover:bg-paper-50/60 dark:border-ink-700 dark:bg-ink-800 dark:hover:bg-ink-700/60",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggle(it.id)}
                      className="mt-1 h-4 w-4 accent-accent-500"
                      aria-label={`Pilih ${it.jpOrPattern}`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-ink-800 dark:text-paper-50">
                        <JapaneseText
                          text={it.jpOrPattern}
                          reading={
                            (it.detail as { reading?: string | null })
                              ?.reading || undefined
                          }
                        />
                      </div>
                      {it.meaning ? (
                        <p className="text-xs text-ink-500 dark:text-paper-50/70">
                          {it.meaning}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-1">
                      {it.level ? <Badge tone="lilac">{it.level}</Badge> : null}
                      <Badge tone={masteryTone(it.mastery)}>{it.mastery}</Badge>
                    </div>
                  </label>
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button
            type="button"
            loading={gen.isPending}
            disabled={selected.size === 0}
            onClick={onGenerate}
          >
            ✍️ Generate Sakubun
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={onReset}
            disabled={gen.isPending}
          >
            Reset Pilihan
          </Button>
          <span className="ml-auto text-xs text-ink-400">
            {selected.size > 0
              ? `Pilih ${selected.size} bunpou siap dipakai.`
              : "Centang bunpou di atas untuk mulai."}
          </span>
        </div>
      </PanelCard>

      {/* ---------------- Loading ---------------- */}
      {gen.isPending ? (
        <AiLoading
          title="AI sedang membuat sakubun…"
          description="Menggunakan bunpou yang kamu pilih."
        />
      ) : null}

      {/* ---------------- Result ---------------- */}
      {result ? (
        <PanelCard tone="accent" stripe>
          <SakubunResult
            data={result}
            requested={requested ?? []}
            onCopy={onCopy}
            onRegenerate={onGenerate}
          />
        </PanelCard>
      ) : null}

      {/* ---------------- Backup link ke Catatan ---------------- */}
      <p className="text-xs text-ink-400">
        Mau menambah bunpou baru?{" "}
        <Link
          href={ROUTES.app.catatan}
          className="font-medium text-accent-600 underline underline-offset-2 hover:text-accent-700 dark:text-accent-300"
        >
          Buka Catatan
        </Link>
        .
      </p>
    </div>
  );
}

// ----------------------------------------------------------------------

function SakubunResult({
  data,
  requested,
  onCopy,
  onRegenerate,
}: {
  data: SakubunData;
  requested: Array<{ id: string; pattern: string }>;
  onCopy: () => void;
  onRegenerate: () => void;
}) {
  const used = data.usedBunpou ?? [];
  // Fallback: kalau AI tidak isi usedBunpou, kita sintesis dari `requested`.
  const usedRows: SakubunUsedBunpou[] = used.length
    ? used
    : requested.map((r) => ({
        id: r.id,
        pattern: r.pattern,
        sentence: "",
        meaning: "",
      }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-amber-700 dark:text-amber-300">
            Sakubun Hasil AI
          </p>
          {data.title ? (
            <h3 className="mt-0.5 text-lg font-semibold text-ink-800 dark:text-paper-50">
              <JapaneseText text={data.title} />
            </h3>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={onCopy}>
            Salin
          </Button>
          <Button size="sm" variant="ghost" onClick={onRegenerate}>
            Buat Ulang
          </Button>
        </div>
      </div>

      <Section label="Sakubun">
        <div className="rounded-xl bg-paper-50/60 px-3 py-3 text-base leading-relaxed dark:bg-ink-900/30">
          <JapaneseText
            text={data.sakubun}
            reading={data.reading || undefined}
          />
        </div>
      </Section>

      {data.meaning ? (
        <Section label="Arti">
          <p className="leading-relaxed text-ink-700 dark:text-paper-50">
            {data.meaning}
          </p>
        </Section>
      ) : null}

      {usedRows.length > 0 ? (
        <Section label="Bunpou yang Dipakai">
          <ul className="space-y-2">
            {usedRows.map((b, i) => (
              <li
                key={`${b.id ?? b.pattern}-${i}`}
                className="rounded-xl border border-paper-200 bg-white px-3 py-2 dark:border-ink-700 dark:bg-ink-800"
              >
                <div className="text-sm font-medium text-ink-800 dark:text-paper-50">
                  <JapaneseText text={b.pattern} />
                </div>
                {b.sentence ? (
                  <div className="mt-1 text-sm text-ink-700 dark:text-paper-50">
                    <JapaneseText text={b.sentence} />
                  </div>
                ) : null}
                {b.meaning ? (
                  <p className="mt-0.5 text-xs text-ink-500 dark:text-paper-50/70">
                    {b.meaning}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {data.notes && data.notes.length > 0 ? (
        <Section label="Catatan AI">
          <ul className="space-y-1.5">
            {data.notes.map((n, i) => (
              <li
                key={i}
                className="rounded-lg bg-paper-50/60 px-3 py-2 text-sm text-ink-700 dark:bg-ink-900/30 dark:text-paper-50"
              >
                {n}
              </li>
            ))}
          </ul>
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

function masteryTone(m: CatatanItem["mastery"]): "leaf" | "warn" | "danger" {
  if (m === "good") return "leaf";
  if (m === "mid") return "warn";
  return "danger";
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, Shuffle } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LinkButton } from "@/components/ui/LinkButton";
import { LoadingState } from "@/components/feedback/LoadingState";
import { EmptyState } from "@/components/feedback/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";

import { ModeCards } from "./components/ModeCards";
import { SlideNav } from "./components/SlideNav";
import { SlideTable } from "./components/SlideTable";
import { FlashcardDeck } from "./components/FlashcardDeck";

import { useHafalanSlide, useHafalanSlides, useShufflePreview } from "./useHafalan";
import { ROUTES } from "@/lib/constants";
import { cn, safeStorage } from "@/lib/utils";
import type { HafalanMode, HafalanSlide, Mastery } from "@/lib/types";
import { PanelCard } from "@/components/ui/PanelCard";
import { notify } from "@/lib/toast";

/** Hanya dua mode kartu yang user-facing; "weak" via toggle terpisah. */
type UiHafalanMode = "kotoba" | "bunpou";
type ViewMode = "list" | "card";

function coerceMode(m: HafalanMode | undefined): UiHafalanMode {
  return m === "bunpou" ? "bunpou" : "kotoba";
}

const LS = {
  mode: "hafalan.mode",
  weakOnly: "hafalan.weakOnly",
  hideMeaning: "hafalan.hideMeaning",
  view: "hafalan.view",
  slide: (m: HafalanMode) => `hafalan.slide.${m}`,
};

export function HafalanScreen() {
  const [mode, setMode] = useState<UiHafalanMode>("kotoba");
  const [weakOnly, setWeakOnly] = useState(false);
  const [slide, setSlide] = useState<number>(1);
  const [hideMeaning, setHideMeaning] = useState(false);
  const [view, setView] = useState<ViewMode>("list");
  /** Hasil acak sementara (shuffle-preview) — null = urutan asli. */
  const [shuffled, setShuffled] = useState<HafalanSlide | null>(null);
  const shuffleMut = useShufflePreview();

  // Mode efektif yang dikirim ke backend ("weak" mencakup kedua tipe).
  const effectiveMode: HafalanMode = weakOnly ? "weak" : mode;

  // ---- persistence (localStorage, dipulihkan setelah mount) ----------
  useEffect(() => {
    const m = safeStorage.get(LS.mode);
    if (m === "kotoba" || m === "bunpou") setMode(m);
    if (safeStorage.get(LS.weakOnly) === "1") setWeakOnly(true);
    if (safeStorage.get(LS.hideMeaning) === "1") setHideMeaning(true);
    const v = safeStorage.get(LS.view);
    if (v === "card") setView("card");
  }, []);
  useEffect(() => safeStorage.set(LS.mode, mode), [mode]);
  useEffect(() => safeStorage.set(LS.weakOnly, weakOnly ? "1" : "0"), [weakOnly]);
  useEffect(() => safeStorage.set(LS.hideMeaning, hideMeaning ? "1" : "0"), [hideMeaning]);
  useEffect(() => safeStorage.set(LS.view, view), [view]);
  useEffect(() => safeStorage.set(LS.slide(effectiveMode), String(slide)), [effectiveMode, slide]);

  // Ganti mode → pulihkan slide tersimpan mode itu (bukan selalu 1),
  // dan buang hasil acak.
  useEffect(() => {
    const stored = Number(safeStorage.get(LS.slide(effectiveMode)));
    setSlide(stored > 0 ? stored : 1);
    setShuffled(null);
  }, [effectiveMode]);

  // Ganti slide → hasil acak tidak berlaku lagi.
  useEffect(() => setShuffled(null), [slide]);

  // ---- data -----------------------------------------------------------
  const slidesQ = useHafalanSlides(effectiveMode);
  const slideQ = useHafalanSlide(effectiveMode, slide);

  // Counts untuk badge mode card. Backend cheap (cuma menghitung order rows).
  const kotobaSlidesQ = useHafalanSlides("kotoba");
  const bunpouSlidesQ = useHafalanSlides("bunpou");
  const weakSlidesQ = useHafalanSlides("weak");

  // Clamp slide if backend says total < current (e.g. items removed elsewhere)
  useEffect(() => {
    if (slidesQ.data && slide > slidesQ.data.totalSlides) {
      setSlide(Math.max(1, slidesQ.data.totalSlides));
    }
  }, [slidesQ.data, slide]);

  const totalSlides = slidesQ.data?.totalSlides ?? 0;
  const totalItems = slidesQ.data?.totalItems ?? 0;

  const view_ = useMemo<HafalanSlide | null>(
    () => shuffled ?? slideQ.data ?? null,
    [shuffled, slideQ.data],
  );

  const isInitialLoading = slidesQ.isLoading || slideQ.isLoading;
  const isError = slidesQ.isError || slideQ.isError;
  const hasItems = !!view_ && view_.items.length > 0;

  // Statistik mastery slide aktif — sinyal kualitas, bukan cuma posisi.
  const stats = useMemo(() => {
    const s: Record<Mastery, number> = { good: 0, mid: 0, weak: 0 };
    for (const it of view_?.items ?? []) s[it.mastery] += 1;
    return s;
  }, [view_]);

  const onShuffle = async () => {
    try {
      const r = await shuffleMut.mutateAsync({ mode: effectiveMode, slide });
      setShuffled(r);
      notify.success("Urutan diacak", "Sementara saja — urutan asli tidak berubah.", {
        icon: "🔀",
      });
    } catch {
      notify.warning("Gagal mengacak", "Coba lagi sebentar.");
    }
  };

  // ---- keyboard: ←/→ pindah slide (mode list), M toggle arti ----------
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName) || t.isContentEditable)) {
        return;
      }
      // Mode kartu punya navigasi panah sendiri (antar kartu).
      if (view === "card") return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setSlide((s) => Math.max(1, s - 1));
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setSlide((s) => Math.min(Math.max(1, totalSlides), s + 1));
      } else if (e.key === "m" || e.key === "M") {
        setHideMeaning((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [view, totalSlides]);

  const weakCount = weakSlidesQ.data?.totalItems ?? 0;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={
          <span className="inline-flex items-center gap-2 normal-case">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-accent-500" />
            <span className="font-jp tracking-[0.28em]">あんき・きおく</span>
          </span>
        }
        title="Hafalan"
        subtitle="Hafalkan kotoba dan bunpou dengan slide tetap."
      />

      <div className={cn(weakOnly && "opacity-60")}>
        <ModeCards
          mode={mode}
          onChange={(m) => {
            setMode(coerceMode(m));
            setWeakOnly(false);
          }}
          kotobaCount={kotobaSlidesQ.data?.totalItems}
          bunpouCount={bunpouSlidesQ.data?.totalItems}
        />
      </div>

      {/* Toggle "yang lemah saja" — backend mode=weak, lintas kotoba+bunpou */}
      <button
        type="button"
        aria-pressed={weakOnly}
        onClick={() => setWeakOnly((v) => !v)}
        className={cn(
          "inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold ring-1 ring-inset transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400",
          weakOnly
            ? "bg-rose-50 text-rose-600 ring-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-400/30"
            : "bg-white text-ink-400 ring-paper-300 hover:text-ink-700 dark:bg-ink-800 dark:ring-ink-700 dark:hover:text-paper-50",
        )}
      >
        <span aria-hidden className="font-serif">弱</span>
        Latih yang lemah saja
        {weakCount > 0 ? (
          <span
            className={cn(
              "rounded-full px-1.5 py-0.5 text-[10px] tabular-nums",
              weakOnly
                ? "bg-white/70 dark:bg-ink-900/40"
                : "bg-paper-100 dark:bg-ink-900/50",
            )}
          >
            {weakCount}
          </span>
        ) : null}
      </button>

      {/* Toolbar slide — kertas washi dengan garis margin merah + progress. */}
      {hasItems ? (
        <div className="relative overflow-hidden rounded-notebook bg-white p-4 shadow-notebook ring-1 ring-paper-200/90 dark:bg-ink-800 dark:ring-ink-700">
          <span aria-hidden className="absolute inset-y-3.5 left-3 w-px bg-accent-500/25" />
          <span
            aria-hidden
            className="pointer-events-none absolute -right-3 -top-4 select-none font-jp text-6xl leading-none text-ink-800/[0.04] dark:text-paper-50/[0.04]"
          >
            記
          </span>
          <div className="relative flex flex-wrap items-center gap-3 pl-3">
            <div className="min-w-0">
              <div className="flex items-baseline gap-1.5">
                <span className="font-serif text-2xl font-semibold leading-none tabular-nums text-ink-800 dark:text-paper-50">
                  {slide}
                </span>
                <span className="text-sm text-ink-400">/ {totalSlides} slide</span>
                {shuffled ? (
                  <button
                    type="button"
                    onClick={() => setShuffled(null)}
                    className="ml-1 text-[11px] font-medium text-accent-600 underline-offset-2 hover:underline dark:text-accent-300"
                  >
                    acak · kembalikan urutan
                  </button>
                ) : null}
              </div>
              {/* statistik mastery slide aktif */}
              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-ink-400">
                <span className="inline-flex items-center gap-1">
                  <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-leaf-500" />
                  {stats.good} hafal
                </span>
                <span className="inline-flex items-center gap-1">
                  <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                  {stats.mid} sedang
                </span>
                <span className="inline-flex items-center gap-1">
                  <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                  {stats.weak} lemah
                </span>
                <span className="hidden text-ink-400/70 md:inline">
                  · {view_?.items.length ?? 0} dari {totalItems} item
                </span>
              </div>
            </div>

            <div className="ml-auto flex flex-wrap items-center gap-2">
              {/* switch List | Kartu */}
              <div
                role="tablist"
                aria-label="Tampilan hafalan"
                className="grid grid-cols-2 gap-1 rounded-full bg-paper-100 p-1 dark:bg-ink-900/50"
              >
                {(
                  [
                    { key: "list", label: "List" },
                    { key: "card", label: "Kartu" },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    role="tab"
                    aria-selected={view === t.key}
                    onClick={() => setView(t.key)}
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400",
                      view === t.key
                        ? "bg-white text-ink-800 shadow-notebook dark:bg-ink-700 dark:text-paper-50"
                        : "text-ink-400 hover:text-ink-700 dark:hover:text-paper-50",
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <Button
                size="sm"
                variant="secondary"
                onClick={onShuffle}
                loading={shuffleMut.isPending}
                className="gap-1.5"
              >
                <Shuffle className="h-4 w-4" aria-hidden /> Acak
              </Button>

              {view === "list" ? (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setHideMeaning((v) => !v)}
                  className="gap-1.5"
                  aria-pressed={hideMeaning}
                >
                  {hideMeaning ? (
                    <>
                      <Eye className="h-4 w-4" aria-hidden /> Tampilkan Arti
                    </>
                  ) : (
                    <>
                      <EyeOff className="h-4 w-4" aria-hidden /> Sembunyikan Arti
                    </>
                  )}
                </Button>
              ) : null}
            </div>
          </div>
          <div className="relative mt-3 h-1.5 overflow-hidden rounded-full bg-paper-100 dark:bg-ink-900/60">
            <motion.div
              className="h-full rounded-full bg-accent-gradient"
              initial={false}
              animate={{
                width: `${totalSlides > 0 ? (slide / totalSlides) * 100 : 0}%`,
              }}
              transition={{ type: "spring", stiffness: 260, damping: 30 }}
            />
          </div>
          {view === "list" ? (
            <p className="relative mt-2 hidden pl-3 text-[11px] text-ink-400/70 md:block">
              Keyboard: <kbd className="rounded bg-paper-100 px-1 dark:bg-ink-700">←</kbd>{" "}
              <kbd className="rounded bg-paper-100 px-1 dark:bg-ink-700">→</kbd> pindah slide ·{" "}
              <kbd className="rounded bg-paper-100 px-1 dark:bg-ink-700">M</kbd> sembunyikan arti
            </p>
          ) : null}
        </div>
      ) : null}

      {isInitialLoading ? (
        <LoadingState label="Memuat slide…" />
      ) : isError ? (
        <PanelCard padding="compact">
          <div className="flex items-center gap-2">
            <Badge tone="neutral">Mode offline</Badge>
            <p className="text-sm text-ink-700 dark:text-paper-50">
              Tidak bisa memuat data Hafalan. Pastikan kamu sudah login dan
              backend menyala.
            </p>
          </div>
        </PanelCard>
      ) : !hasItems ? (
        weakOnly ? (
          <EmptyState
            icon="🌱"
            title="Tidak ada item lemah"
            description="Semua item sudah di atas level lemah — kerja bagus! Matikan toggle untuk kembali ke daftar penuh."
            action={
              <Button size="sm" variant="secondary" onClick={() => setWeakOnly(false)}>
                Kembali ke semua item
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon="🗂"
            title="Belum ada item di Hafalan"
            description="Tambah kotoba/bunpou di Catatan, otomatis masuk antrian Hafalan."
            action={
              <div className="flex flex-wrap gap-2">
                <LinkButton size="sm" href={ROUTES.app.catatan}>
                  Buka Catatan
                </LinkButton>
                <LinkButton
                  size="sm"
                  variant="secondary"
                  href={`${ROUTES.app.catatan}?openAdd=ai-kotoba`}
                >
                  ✨ Tambah dengan AI
                </LinkButton>
              </div>
            }
          />
        )
      ) : view === "card" ? (
        <>
          <FlashcardDeck
            items={view_!.items}
            hasNextSlide={slide < totalSlides}
            onNextSlide={() => setSlide((s) => Math.min(totalSlides, s + 1))}
          />
          <SlideNav
            current={slide}
            total={totalSlides}
            onPrev={() => setSlide((s) => Math.max(1, s - 1))}
            onNext={() => setSlide((s) => Math.min(totalSlides, s + 1))}
            onJump={(n) => setSlide(n)}
          />
        </>
      ) : (
        <>
          <SlideNav
            current={slide}
            total={totalSlides}
            onPrev={() => setSlide((s) => Math.max(1, s - 1))}
            onNext={() => setSlide((s) => Math.min(totalSlides, s + 1))}
            onJump={(n) => setSlide(n)}
          />

          <SlideTable items={view_!.items} hideMeaning={hideMeaning} />

          <SlideNav
            current={slide}
            total={totalSlides}
            onPrev={() => setSlide((s) => Math.max(1, s - 1))}
            onNext={() => setSlide((s) => Math.min(totalSlides, s + 1))}
            onJump={(n) => setSlide(n)}
          />
        </>
      )}
    </div>
  );
}

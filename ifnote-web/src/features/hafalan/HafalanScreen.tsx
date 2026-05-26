"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/LinkButton";
import { LoadingState } from "@/components/feedback/LoadingState";
import { EmptyState } from "@/components/feedback/EmptyState";
import { NotebookCard } from "@/components/ui/NotebookCard";

import { ModeCards } from "./components/ModeCards";
import { SessionCard } from "./components/SessionCard";
import { SlideNav } from "./components/SlideNav";
import { SlideTable } from "./components/SlideTable";

import { useHafalanSlide, useHafalanSlides, useShufflePreview } from "./useHafalan";
import { ApiError } from "@/lib/api-client";
import { toast } from "@/components/feedback/Toast";
import { ROUTES } from "@/lib/constants";
import type { HafalanMode, HafalanSlide } from "@/lib/types";

export function HafalanScreen() {
  const [mode, setMode] = useState<HafalanMode>("mixed");
  const [slide, setSlide] = useState<number>(1);
  const [hideMeaning, setHideMeaning] = useState(false);

  /**
   * shuffleOverride holds a UI-only reshuffled view of the current slide.
   * Cleared on mode/slide change OR when the user explicitly resets.
   */
  const [shuffleOverride, setShuffleOverride] = useState<HafalanSlide | null>(null);

  // Reset to slide 1 + clear shuffle whenever mode changes
  useEffect(() => {
    setSlide(1);
    setShuffleOverride(null);
  }, [mode]);

  // Clear shuffle on slide change
  useEffect(() => {
    setShuffleOverride(null);
  }, [slide]);

  const slidesQ = useHafalanSlides(mode);
  const slideQ = useHafalanSlide(mode, slide);
  const shuffleMut = useShufflePreview();

  // Clamp slide if backend says total < current (e.g. items removed elsewhere)
  useEffect(() => {
    if (slidesQ.data && slide > slidesQ.data.totalSlides) {
      setSlide(Math.max(1, slidesQ.data.totalSlides));
    }
  }, [slidesQ.data, slide]);

  const totalSlides = slidesQ.data?.totalSlides ?? 0;
  const totalItems = slidesQ.data?.totalItems ?? 0;

  const view = useMemo<HafalanSlide | null>(() => {
    if (shuffleOverride) return shuffleOverride;
    return slideQ.data ?? null;
  }, [shuffleOverride, slideQ.data]);

  const onShuffle = async () => {
    try {
      const result = await shuffleMut.mutateAsync({ mode, slide });
      setShuffleOverride(result);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Gagal mengacak";
      toast(msg, "error");
    }
  };

  const onResetShuffle = () => setShuffleOverride(null);

  const isInitialLoading = slidesQ.isLoading || slideQ.isLoading;
  const isError = slidesQ.isError || slideQ.isError;

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <div className="text-xs font-medium uppercase tracking-wide text-leaf-600 dark:text-leaf-500">
          🧠 Memory Deck
        </div>
        <h1 className="text-2xl font-semibold text-ink-800 dark:text-paper-50 sm:text-3xl">
          Hafalan
        </h1>
        <p className="text-sm text-ink-400">
          Hafalkan kotoba dan bunpou dengan slide tetap.
        </p>
      </header>

      <ModeCards mode={mode} onChange={setMode} />

      <SessionCard
        totalSlides={totalSlides}
        totalItems={totalItems}
        currentSlide={slide}
        currentCount={view?.items.length ?? 0}
        hideMeaning={hideMeaning}
        shuffled={!!shuffleOverride}
        shuffling={shuffleMut.isPending}
        onToggleMeaning={() => setHideMeaning((v) => !v)}
        onShuffle={onShuffle}
        onResetShuffle={onResetShuffle}
      />

      {isInitialLoading ? (
        <LoadingState label="Memuat slide…" />
      ) : isError ? (
        <NotebookCard className="p-5">
          <div className="flex items-center gap-2">
            <Badge tone="warn">Mode offline</Badge>
            <p className="text-sm text-ink-700 dark:text-paper-50">
              Tidak bisa memuat data Hafalan. Pastikan kamu sudah login dan
              backend menyala.
            </p>
          </div>
        </NotebookCard>
      ) : !view || view.items.length === 0 ? (
        <EmptyState
          icon="🗂"
          title={mode === "weak" ? "Tidak ada item lemah" : "Belum ada item di Hafalan"}
          description={
            mode === "weak"
              ? "Selamat — semua item di mode ini sudah di-mark hafal atau mid."
              : "Tambah kotoba/bunpou di Catatan, otomatis masuk antrian Hafalan."
          }
          action={
            <div className="flex gap-2">
              <LinkButton size="sm" href={ROUTES.app.catatan}>Buka Catatan</LinkButton>
              <LinkButton size="sm" variant="secondary" href={ROUTES.app.ai}>
                Tanya AI Tutor
              </LinkButton>
            </div>
          }
        />
      ) : (
        <>
          <SlideNav
            current={slide}
            total={totalSlides}
            onPrev={() => setSlide((s) => Math.max(1, s - 1))}
            onNext={() => setSlide((s) => Math.min(totalSlides, s + 1))}
            onJump={(n) => setSlide(n)}
          />

          <SlideTable items={view.items} hideMeaning={hideMeaning} />

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

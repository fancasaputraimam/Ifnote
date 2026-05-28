"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LinkButton } from "@/components/ui/LinkButton";
import { LoadingState } from "@/components/feedback/LoadingState";
import { EmptyState } from "@/components/feedback/EmptyState";
import { NotebookCard } from "@/components/ui/NotebookCard";
import { PageHeader } from "@/components/ui/PageHeader";

import { ModeCards } from "./components/ModeCards";
import { SlideNav } from "./components/SlideNav";
import { SlideTable } from "./components/SlideTable";

import { useHafalanSlide, useHafalanSlides } from "./useHafalan";
import { ROUTES } from "@/lib/constants";
import type { HafalanMode, HafalanSlide } from "@/lib/types";

/** Hanya dua mode yang user-facing di UI. */
type UiHafalanMode = "kotoba" | "bunpou";

function coerceMode(m: HafalanMode | undefined): UiHafalanMode {
  return m === "bunpou" ? "bunpou" : "kotoba";
}

export function HafalanScreen() {
  // Old state may still hold "mixed"/"weak" — coerce ke "kotoba".
  const [mode, setMode] = useState<UiHafalanMode>("kotoba");
  const [slide, setSlide] = useState<number>(1);
  const [hideMeaning, setHideMeaning] = useState(false);

  // Reset to slide 1 whenever mode changes
  useEffect(() => {
    setSlide(1);
  }, [mode]);

  // Active slide data
  const slidesQ = useHafalanSlides(mode);
  const slideQ = useHafalanSlide(mode, slide);

  // Counts untuk badge mode card. Backend cheap (cuma menghitung order rows).
  const kotobaSlidesQ = useHafalanSlides("kotoba");
  const bunpouSlidesQ = useHafalanSlides("bunpou");

  // Clamp slide if backend says total < current (e.g. items removed elsewhere)
  useEffect(() => {
    if (slidesQ.data && slide > slidesQ.data.totalSlides) {
      setSlide(Math.max(1, slidesQ.data.totalSlides));
    }
  }, [slidesQ.data, slide]);

  const totalSlides = slidesQ.data?.totalSlides ?? 0;
  const totalItems = slidesQ.data?.totalItems ?? 0;

  const view = useMemo<HafalanSlide | null>(() => slideQ.data ?? null, [slideQ.data]);

  const isInitialLoading = slidesQ.isLoading || slideQ.isLoading;
  const isError = slidesQ.isError || slideQ.isError;

  const hasItems = !!view && view.items.length > 0;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="🧠 Memory Deck"
        title="Hafalan"
        subtitle="Hafalkan kotoba dan bunpou dengan slide tetap."
      />

      <ModeCards
        mode={mode}
        onChange={(m) => setMode(coerceMode(m))}
        kotobaCount={kotobaSlidesQ.data?.totalItems}
        bunpouCount={bunpouSlidesQ.data?.totalItems}
      />

      {/* Compact toolbar — replaces old "Hafalan Hari Ini" SessionCard. */}
      {hasItems ? (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-paper-200 bg-white px-3 py-2 text-sm dark:border-ink-700 dark:bg-ink-800">
          <span className="font-medium text-ink-800 dark:text-paper-50">
            Slide {slide}
            <span className="text-ink-400"> / {totalSlides}</span>
          </span>
          <span className="text-xs text-ink-400">
            · {view?.items.length ?? 0} dari {totalItems} item
          </span>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setHideMeaning((v) => !v)}
            >
              {hideMeaning ? "Tampilkan Arti" : "Sembunyikan Arti"}
            </Button>
          </div>
        </div>
      ) : null}

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
      ) : !hasItems ? (
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
      ) : (
        <>
          <SlideNav
            current={slide}
            total={totalSlides}
            onPrev={() => setSlide((s) => Math.max(1, s - 1))}
            onNext={() => setSlide((s) => Math.min(totalSlides, s + 1))}
            onJump={(n) => setSlide(n)}
          />

          <SlideTable items={view!.items} hideMeaning={hideMeaning} />

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

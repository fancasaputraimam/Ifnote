"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { HafalanMode, HafalanSlide, Mastery } from "@/lib/types";

const HAFALAN_KEY = "hafalan";

export interface HafalanSlidesIndex {
  mode: HafalanMode;
  slideSize: number;
  totalSlides: number;
  totalItems: number;
  slides: Array<{ slide: number; from: number; to: number; count: number }>;
}

/** Slide content (one slide of <=20 items). Server is source of truth. */
export function useHafalanSlide(mode: HafalanMode, slide: number) {
  return useQuery<HafalanSlide>({
    queryKey: [HAFALAN_KEY, mode, "slide", slide],
    queryFn: () =>
      api.get<HafalanSlide>("/api/hafalan", { query: { mode, slide } }),
    retry: 0,
    staleTime: 15_000,
  });
}

/** Slide index — used to render the prev/next nav and "x / y" indicator. */
export function useHafalanSlides(mode: HafalanMode) {
  return useQuery<HafalanSlidesIndex>({
    queryKey: [HAFALAN_KEY, mode, "slides"],
    queryFn: () =>
      api.get<HafalanSlidesIndex>("/api/hafalan/slides", { query: { mode } }),
    retry: 0,
    staleTime: 15_000,
  });
}

/** Update mastery on a single item (kotoba/bunpou). */
export function useHafalanMastery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      itemType: "kotoba" | "bunpou";
      itemId: string;
      mastery: Mastery;
    }) => api.put<unknown>("/api/hafalan/mastery", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [HAFALAN_KEY] });
      qc.invalidateQueries({ queryKey: ["catatan"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

/**
 * Server-side temporary shuffle — returns the same slide reshuffled, never
 * persists to hafalan_order. We *don't* cache this; each call regenerates.
 */
export function useShufflePreview() {
  return useMutation({
    mutationFn: (body: { mode: HafalanMode; slide: number }) =>
      api.post<HafalanSlide>("/api/hafalan/shuffle-preview", body),
  });
}

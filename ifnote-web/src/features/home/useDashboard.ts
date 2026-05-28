"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { isTransientError, mapApiErrorToMessage } from "@/lib/error-mapper";
import type {
  CatatanList,
  CatatanItem,
  Mastery,
} from "@/lib/types";

interface QuizProgress {
  id: string;
  userId: string;
  quizType: string;
  correctCount: number;
  wrongCount: number;
  totalAnswered: number;
  lastScore: number | null;
  updatedAt: string;
  createdAt: string;
}

interface DashboardSnapshot {
  isLoading: boolean;
  isError: boolean;
  errorMessage: string | null;
  /** True when not authenticated / network failed and we're showing graceful zeros. */
  isFallback: boolean;
  totals: {
    kotoba: number;
    bunpou: number;
    review: number;       // items dengan mastery mid+weak
    streakDays: number;   // hard rule: belum dilacak; selalu 0
  };
  recentKotoba: CatatanItem[];
  recentBunpou: CatatanItem[];
  /** Single Kanji char untuk Fokus Hari Ini — prefer kanji yang ada di item
   *  Kotoba/Bunpou dengan mastery weak/mid; fallback ke item terbaru. */
  dailyKanjiChar: string | null;
  /** Kotoba untuk Fokus Hari Ini: prefer mastery=weak → mid → latest. */
  focusKotoba: CatatanItem | null;
  /** Bunpou untuk Fokus Hari Ini: prefer mastery=weak → mid → latest. */
  focusBunpou: CatatanItem | null;
  /** Quiz progress aggregat untuk welcome card / mission. */
  quizProgress: QuizProgress[];
  /** Total review yang sudah dijawab user (semua quizType). Indikator kasar progress. */
  totalQuizAnswered: number;
  /** Average lastScore di semua quizType, 0–100. Null kalau belum ada quiz. */
  avgScore: number | null;
}

const KANJI_RANGE = /[\u4E00-\u9FFF\u3400-\u4DBF]/;

/**
 * Single dashboard hook — combines /api/catatan + /api/quiz/progress.
 *
 * Backend endpoints already implemented (Phase 2). No mock data: if the
 * call fails (network error, anonymous, or backend down) we return zeros
 * and `isFallback=true` so the UI can render empty states honestly.
 *
 * TODO: when backend adds /api/stats aggregator, swap to that single call.
 */
export function useDashboard(): DashboardSnapshot {
  const catatanQ = useQuery({
    queryKey: ["dashboard", "catatan"],
    queryFn: () =>
      // Backend caps limit at 100; dashboard only needs recent items + counts.
      api.get<CatatanList>("/api/catatan", {
        query: { type: "all", page: 1, limit: 100 },
      }),
    retry: 0,
  });

  const progressQ = useQuery({
    queryKey: ["dashboard", "quiz-progress"],
    queryFn: () => api.get<QuizProgress[]>("/api/quiz/progress"),
    retry: 0,
  });

  const items = catatanQ.data?.items ?? [];
  const progress = progressQ.data ?? [];

  // Order from API is updatedAt desc — slice keeps that ordering.
  const recentKotoba = items.filter((i) => i.noteType === "kotoba").slice(0, 5);
  const recentBunpou = items.filter((i) => i.noteType === "bunpou").slice(0, 5);

  const allKotoba = items.filter((i) => i.noteType === "kotoba");
  const allBunpou = items.filter((i) => i.noteType === "bunpou");

  const focusKotoba = pickFocus(allKotoba);
  const focusBunpou = pickFocus(allBunpou);

  const totals = {
    kotoba: items.filter((i) => i.noteType === "kotoba").length,
    bunpou: items.filter((i) => i.noteType === "bunpou").length,
    review: items.filter((i: CatatanItem) =>
      (["mid", "weak"] as Mastery[]).includes(i.mastery),
    ).length,
    // Streak belum ada di backend. Jangan tebak — selalu 0.
    streakDays: 0,
  };

  const dailyKanjiChar = (() => {
    // Prefer kanji dari focusKotoba/focusBunpou (item difficult), supaya
    // Fokus Hari Ini menampilkan satu kanji yang relevan dengan latihan.
    const candidates: Array<CatatanItem | null> = [
      focusKotoba,
      focusBunpou,
      ...recentKotoba,
      ...recentBunpou,
    ];
    for (const item of candidates) {
      if (!item) continue;
      const match = item.jpOrPattern.match(KANJI_RANGE);
      if (match) return match[0];
      const ex = (item.detail as { normalExample?: string | null })?.normalExample;
      if (ex) {
        const m2 = ex.match(KANJI_RANGE);
        if (m2) return m2[0];
      }
    }
    return null;
  })();

  const totalQuizAnswered = progress.reduce((s, p) => s + p.totalAnswered, 0);
  const scoredProgress = progress.filter((p) => typeof p.lastScore === "number");
  const avgScore =
    scoredProgress.length === 0
      ? null
      : Math.round(
          scoredProgress.reduce((s, p) => s + (p.lastScore ?? 0), 0) /
            scoredProgress.length,
        );

  const isLoading = catatanQ.isLoading || progressQ.isLoading;
  // We treat catatan as the primary signal — quiz progress is allowed to be empty.
  const isError = catatanQ.isError;
  // Only show offline banner for transient errors (network / 5xx). Validation
  // errors (4xx) get logged but kept silent on the user-facing dashboard.
  const isFallback = isError && isTransientError(catatanQ.error);
  const errorMessage = isError ? mapApiErrorToMessage(catatanQ.error) : null;

  return {
    isLoading,
    isError,
    errorMessage,
    isFallback,
    totals,
    recentKotoba,
    recentBunpou,
    dailyKanjiChar,
    focusKotoba,
    focusBunpou,
    quizProgress: progress,
    totalQuizAnswered,
    avgScore,
  };
}

/** Pick the most-needed item to review: weak > mid > latest. */
function pickFocus(list: CatatanItem[]): CatatanItem | null {
  const weak = list.find((b) => b.mastery === "weak");
  if (weak) return weak;
  const mid = list.find((b) => b.mastery === "mid");
  if (mid) return mid;
  return list[0] ?? null;
}

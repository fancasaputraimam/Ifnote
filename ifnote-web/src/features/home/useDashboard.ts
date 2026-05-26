"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
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
  /** First kanji char extracted from user's most recent kotoba. Null if no kanji ditemukan. */
  dailyKanjiChar: string | null;
  /** Bunpou yang perlu diperhatikan: prefer mastery=weak, lalu mid, lalu paling baru. */
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
      api.get<CatatanList>("/api/catatan", {
        query: { type: "all", page: 1, limit: 200 },
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
    for (const item of recentKotoba) {
      const match = item.jpOrPattern.match(KANJI_RANGE);
      if (match) return match[0];
    }
    return null;
  })();

  const focusBunpou = (() => {
    const weak = recentBunpou.find((b) => b.mastery === "weak");
    if (weak) return weak;
    const mid = recentBunpou.find((b) => b.mastery === "mid");
    if (mid) return mid;
    return recentBunpou[0] ?? null;
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
  const errorMessage = catatanQ.error instanceof Error ? catatanQ.error.message : null;
  const isFallback = isError;

  return {
    isLoading,
    isError,
    errorMessage,
    isFallback,
    totals,
    recentKotoba,
    recentBunpou,
    dailyKanjiChar,
    focusBunpou,
    quizProgress: progress,
    totalQuizAnswered,
    avgScore,
  };
}

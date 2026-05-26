"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { QuizQuestion, QuizType } from "@/lib/types";

const QUIZ_KEY = "quiz";

export interface QuizProgress {
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

/** Generate a fresh quiz from the user's pool (kotoba/bunpou/mixed). */
export function useQuizQuestions(type: QuizType, count = 10, enabled = true) {
  return useQuery<QuizQuestion[]>({
    queryKey: [QUIZ_KEY, "questions", type, count],
    queryFn: () =>
      api.get<QuizQuestion[]>("/api/quiz", { query: { type, count } }),
    enabled,
    retry: 0,
    refetchOnMount: false,         // never auto-refetch a started quiz
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  });
}

/** AI-generated quiz: backend AI proxy with mock fallback. Different shape. */
export interface AiQuizQuestion {
  prompt: string;
  choices: { id: string; label: string }[];
  correctChoiceId: string;
  explanation?: string;
}
export interface AiQuizResult {
  source: "ai" | "mock";
  data: { topic: string; questions: AiQuizQuestion[] };
}

export function useGenerateAiQuiz() {
  return useMutation({
    mutationFn: (body: { topic?: string; count?: number }) =>
      api.post<AiQuizResult>("/api/ai/generate-quiz", body),
  });
}

/** Persist a single answer; backend updates mastery automatically. */
export function useSubmitAnswer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      type: QuizType;
      itemType: "kotoba" | "bunpou";
      itemId: string;
      correct: boolean;
    }) => api.post<QuizProgress>("/api/quiz/answer", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUIZ_KEY, "progress"] });
      qc.invalidateQueries({ queryKey: ["catatan"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["hafalan"] });
    },
  });
}

export function useQuizProgress() {
  return useQuery<QuizProgress[]>({
    queryKey: [QUIZ_KEY, "progress"],
    queryFn: () => api.get<QuizProgress[]>("/api/quiz/progress"),
    retry: 0,
    staleTime: 30_000,
  });
}

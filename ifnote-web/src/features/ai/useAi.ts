"use client";

import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type {
  AiEnvelope,
  AnalyzeSentenceData,
  BulkKotobaData,
  CorrectSentenceData,
  CreateHafalanData,
  ExplainBunpouData,
  ExplainKotobaData,
  GenerateQuizData,
  MakeExampleData,
} from "./types";

/**
 * One mutation per AI mode. Backend returns AiEnvelope shape so callers can
 * surface the source ("ai" | "mock") to the user honestly.
 */

export function useExplainKotoba() {
  return useMutation({
    mutationFn: (body: { jp: string }) =>
      api.post<AiEnvelope<ExplainKotobaData>>("/api/ai/explain-kotoba", body),
  });
}

export function useExplainBunpou() {
  return useMutation({
    mutationFn: (body: { pattern: string }) =>
      api.post<AiEnvelope<ExplainBunpouData>>("/api/ai/explain-bunpou", body),
  });
}

export function useCorrectSentence() {
  return useMutation({
    mutationFn: (body: { sentence: string }) =>
      api.post<AiEnvelope<CorrectSentenceData>>("/api/ai/correct-sentence", body),
  });
}

export function useMakeExample() {
  return useMutation({
    mutationFn: (body: { topic: string }) =>
      api.post<AiEnvelope<MakeExampleData>>("/api/ai/make-example", body),
  });
}

export function useGenerateQuizAi() {
  return useMutation({
    mutationFn: (body: { topic?: string; count?: number }) =>
      api.post<AiEnvelope<GenerateQuizData>>("/api/ai/generate-quiz", body),
  });
}

export function useCreateHafalanAi() {
  return useMutation({
    mutationFn: (body: { topic: string }) =>
      api.post<AiEnvelope<CreateHafalanData>>("/api/ai/create-hafalan", body),
  });
}

export function useBulkKotobaAi() {
  return useMutation({
    mutationFn: (body: { words: string[] }) =>
      api.post<AiEnvelope<BulkKotobaData>>("/api/ai/bulk-kotoba", body),
  });
}

export function useAnalyzeSentence() {
  return useMutation({
    mutationFn: (body: { sentence: string }) =>
      api.post<AiEnvelope<AnalyzeSentenceData>>("/api/ai/analyze-sentence", body),
  });
}

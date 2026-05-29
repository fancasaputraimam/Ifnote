"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
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
 * One mutation per AI mode. Backend selalu mengembalikan source="ai".
 * Kalau AI belum diatur atau gagal, backend lempar 503 (AI_NOT_CONFIGURED /
 * AI_CALL_FAILED) — tidak ada lagi mock fallback yang dilempar ke user.
 */

export interface AiStatus {
  configured: boolean;
  source: "user" | "env" | null;
}

/**
 * Pre-detect apakah AI siap dipakai untuk user saat ini. Tidak
 * memanggil provider — cuma cek konfigurasi. Dipakai oleh AiContextCard
 * supaya bisa menampilkan "AI siap" / "AI belum diatur" sebelum user
 * mengirim pesan.
 */
export function useAiStatus() {
  return useQuery<AiStatus>({
    queryKey: ["aiStatus"],
    queryFn: () => api.get<AiStatus>("/api/ai/status"),
    staleTime: 30_000,
    retry: 0,
  });
}

export function useExplainKotoba() {
  return useMutation({
    mutationFn: (body: { jp: string }) =>
      api.post<AiEnvelope<ExplainKotobaData>>("/api/ai/explain-kotoba", body),
  });
}

export interface TranslateExampleData {
  exampleMeaning: string;
}

/**
 * Repair: minta AI mengisi exampleMeaning saja saat hasil
 * `explainKotoba` balik dengan kalimat contoh tapi tanpa terjemahan.
 */
export function useTranslateExample() {
  return useMutation({
    mutationFn: (body: {
      kotoba: string;
      meaning: string;
      normalExample: string;
      exampleReading?: string;
    }) =>
      api.post<AiEnvelope<TranslateExampleData>>(
        "/api/ai/translate-example",
        body,
      ),
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

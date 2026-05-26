"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export interface KanjiInfo {
  kanji: string;
  meaning: string | null;
  onyomi: string | null;
  kunyomi: string | null;
  explanation: string | null;
  wordsJson?: unknown;
  exampleJp: string | null;
  exampleId: string | null;
  source: "cache" | "ai" | "fallback";
}

/**
 * Fetches kanji info from the backend cache-first endpoint.
 * Only runs when `enabled` is true.
 */
export function useKanjiInfo(kanji: string | null, enabled: boolean) {
  return useQuery<KanjiInfo>({
    queryKey: ["kanji", kanji],
    queryFn: () => api.get<KanjiInfo>(`/api/kanji/${encodeURIComponent(kanji ?? "")}`),
    enabled: enabled && !!kanji,
    retry: 0,
    staleTime: 5 * 60_000,
  });
}

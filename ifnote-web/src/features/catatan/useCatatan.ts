"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type {
  CatatanList,
  Bunpou,
  JlptLevel,
  Kotoba,
  Mastery,
} from "@/lib/types";

// ---- query types ---------------------------------------------------

export type CatatanFilterType = "all" | "kotoba" | "bunpou";
export type CatatanFilterStatus =
  | "all"
  | "good"
  | "mid"
  | "weak"
  | "review"
  | "new";

export interface CatatanQuery {
  search?: string;
  type?: CatatanFilterType;
  level?: JlptLevel;
  status?: Exclude<CatatanFilterStatus, "all">;
  page?: number;
  limit?: number;
}

// ---- list query ----------------------------------------------------

const CATATAN_KEY = "catatan";

export function useCatatanList(params: CatatanQuery) {
  // Server only accepts a single primary filter; we map "all" → undefined.
  const query = {
    search: params.search?.trim() || undefined,
    type: params.type && params.type !== "all" ? params.type : undefined,
    level: params.level,
    status: params.status,
    page: params.page,
    limit: params.limit ?? 50,
  };

  return useQuery<CatatanList>({
    queryKey: [CATATAN_KEY, query],
    queryFn: () => api.get<CatatanList>("/api/catatan", { query }),
    retry: 0,
    staleTime: 15_000,
  });
}

// ---- write payloads -----------------------------------------------

export interface KotobaWritePayload {
  jp: string;
  reading?: string;
  romaji?: string;
  meaning: string;
  type?: string;
  level?: JlptLevel;
  tags?: string[];
  beginnerExample?: string;
  normalExample?: string;
  furiganaExample?: string;
  exampleReading?: string;
  exampleMeaning?: string;
  mastery?: Mastery;
}

export interface BunpouWritePayload {
  pattern: string;
  reading?: string;
  meaning: string;
  formula?: string;
  usage?: string;
  level?: JlptLevel;
  tags?: string[];
  beginnerExample?: string;
  normalExample?: string;
  furiganaExample?: string;
  exampleReading?: string;
  exampleMeaning?: string;
  note?: string;
  commonMistake?: string;
  mastery?: Mastery;
}

// ---- mutations ----------------------------------------------------

function useInvalidateCatatan() {
  const qc = useQueryClient();
  return () => {
    // Catatan + Home/Dashboard + Hafalan (new items append to order) +
    // Quiz (new items can be drawn into questions). Required by
    // task-spec PART 10 — data sync after AI save.
    qc.invalidateQueries({ queryKey: [CATATAN_KEY] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
    qc.invalidateQueries({ queryKey: ["home"] });
    qc.invalidateQueries({ queryKey: ["hafalan"] });
    qc.invalidateQueries({ queryKey: ["kotoba"] });
    qc.invalidateQueries({ queryKey: ["bunpou"] });
    qc.invalidateQueries({ queryKey: ["quiz"] });
  };
}

export function useCreateKotoba() {
  const invalidate = useInvalidateCatatan();
  return useMutation({
    mutationFn: (payload: KotobaWritePayload) =>
      api.post<Kotoba>("/api/kotoba", payload),
    onSuccess: invalidate,
  });
}

export function useUpdateKotoba() {
  const invalidate = useInvalidateCatatan();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: KotobaWritePayload }) =>
      api.put<Kotoba>(`/api/kotoba/${id}`, payload),
    onSuccess: invalidate,
  });
}

export function useDeleteKotoba() {
  const invalidate = useInvalidateCatatan();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete<{ ok: boolean }>(`/api/kotoba/${id}`),
    onSuccess: invalidate,
  });
}

export function useCreateBunpou() {
  const invalidate = useInvalidateCatatan();
  return useMutation({
    mutationFn: (payload: BunpouWritePayload) =>
      api.post<Bunpou>("/api/bunpou", payload),
    onSuccess: invalidate,
  });
}

export function useUpdateBunpou() {
  const invalidate = useInvalidateCatatan();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: BunpouWritePayload }) =>
      api.put<Bunpou>(`/api/bunpou/${id}`, payload),
    onSuccess: invalidate,
  });
}

export function useDeleteBunpou() {
  const invalidate = useInvalidateCatatan();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete<{ ok: boolean }>(`/api/bunpou/${id}`),
    onSuccess: invalidate,
  });
}

// ---- AI explain (cached) ------------------------------------------

export interface AiExplainResult<T> {
  /** True kalau backend benar-benar memanggil AI dan menyimpan field baru.
   * False artinya item sudah punya penjelasan — tidak ada token yang dipakai. */
  generated: boolean;
  item: T;
}

/**
 * Hook combined endpoint `/api/kotoba/:id/ai-explain`.
 * Server akan skip AI call kalau item sudah punya penjelasan.
 */
export function useAiExplainKotoba() {
  const invalidate = useInvalidateCatatan();
  return useMutation<AiExplainResult<Kotoba>, Error, string>({
    mutationFn: (id) =>
      api.post<AiExplainResult<Kotoba>>(`/api/kotoba/${id}/ai-explain`, {}),
    onSuccess: (r) => {
      // Invalidate hanya kalau ada perubahan supaya cache tidak ke-flush
      // sia-sia.
      if (r.generated) invalidate();
    },
  });
}

export function useAiExplainBunpou() {
  const invalidate = useInvalidateCatatan();
  return useMutation<AiExplainResult<Bunpou>, Error, string>({
    mutationFn: (id) =>
      api.post<AiExplainResult<Bunpou>>(`/api/bunpou/${id}/ai-explain`, {}),
    onSuccess: (r) => {
      if (r.generated) invalidate();
    },
  });
}

// ---- hafalan add ---------------------------------------------------

export function useAddToHafalan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { itemType: "kotoba" | "bunpou"; itemId: string }) =>
      api.post<{ ok: boolean }>("/api/hafalan/add", body),
    onSuccess: () => {
      // Hafalan order changed; affects Hafalan + dashboard counts +
      // catatan list (review counts).
      qc.invalidateQueries({ queryKey: ["hafalan"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: [CATATAN_KEY] });
    },
  });
}

// ---- mastery quick update -----------------------------------------

export function useUpdateMastery() {
  const invalidate = useInvalidateCatatan();
  return useMutation({
    mutationFn: (body: { itemType: "kotoba" | "bunpou"; itemId: string; mastery: Mastery }) =>
      api.put<unknown>("/api/hafalan/mastery", body),
    onSuccess: invalidate,
  });
}

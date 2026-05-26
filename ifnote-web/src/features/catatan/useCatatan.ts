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
  romaji?: string;
  meaning: string;
  type?: string;
  level?: JlptLevel;
  tags?: string[];
  beginnerExample?: string;
  normalExample?: string;
  furiganaExample?: string;
  exampleMeaning?: string;
  mastery?: Mastery;
}

export interface BunpouWritePayload {
  pattern: string;
  meaning: string;
  formula?: string;
  usage?: string;
  level?: JlptLevel;
  tags?: string[];
  beginnerExample?: string;
  normalExample?: string;
  furiganaExample?: string;
  exampleMeaning?: string;
  note?: string;
  commonMistake?: string;
  mastery?: Mastery;
}

// ---- mutations ----------------------------------------------------

function useInvalidateCatatan() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: [CATATAN_KEY] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
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

// ---- hafalan add ---------------------------------------------------

export function useAddToHafalan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { itemType: "kotoba" | "bunpou"; itemId: string }) =>
      api.post<{ ok: boolean }>("/api/hafalan/add", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hafalan"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
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

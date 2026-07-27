"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
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

/**
 * Versi infinite (halaman berlipat) — dipakai layar Catatan supaya user
 * dengan >100 catatan tetap bisa memuat semuanya ("Muat lebih").
 * Backend membatasi limit per halaman di 100; kita pakai 50 per halaman.
 */
export function useCatatanInfinite(params: Omit<CatatanQuery, "page">) {
  const base = {
    search: params.search?.trim() || undefined,
    type: params.type && params.type !== "all" ? params.type : undefined,
    level: params.level,
    status: params.status,
    limit: params.limit ?? 50,
  };

  return useInfiniteQuery<CatatanList>({
    queryKey: [CATATAN_KEY, "infinite", base],
    queryFn: ({ pageParam }) =>
      api.get<CatatanList>("/api/catatan", {
        query: { ...base, page: (pageParam as number) ?? 1 },
      }),
    initialPageParam: 1,
    getNextPageParam: (last) => {
      const { page, limit, total } = last.pagination;
      return page * limit < total ? page + 1 : undefined;
    },
    retry: 0,
    staleTime: 15_000,
  });
}

/**
 * Total item satu tipe (menghormati search/level aktif) — dibaca dari
 * `pagination.total` dengan limit=1 supaya murah. Dipakai SummaryRow agar
 * angkanya jujur meski list belum memuat semua halaman.
 */
export function useCatatanCount(
  type: "kotoba" | "bunpou",
  filters: { search?: string; level?: JlptLevel },
) {
  const query = {
    search: filters.search?.trim() || undefined,
    type,
    level: filters.level,
    page: 1,
    limit: 1,
  };
  return useQuery<CatatanList, Error, number>({
    queryKey: [CATATAN_KEY, "count", query],
    queryFn: () => api.get<CatatanList>("/api/catatan", { query }),
    select: (d) => d.pagination.total,
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
  beginnerExampleReading?: string;
  beginnerExampleMeaning?: string;
  normalExample?: string;
  normalExampleReading?: string;
  normalExampleMeaning?: string;
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
  beginnerExampleReading?: string;
  beginnerExampleMeaning?: string;
  normalExample?: string;
  normalExampleReading?: string;
  normalExampleMeaning?: string;
  furiganaExample?: string;
  exampleReading?: string;
  exampleMeaning?: string;
  note?: string;
  commonMistake?: string;
  mastery?: Mastery;
}

// ---- mutations ----------------------------------------------------

/**
 * Invalidator bersama — diekspor untuk alur bulk yang menyimpan banyak
 * item lalu invalidasi SEKALI di akhir (bukan badai refetch per item).
 */
export function useInvalidateCatatan() {
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

/**
 * Quick mastery dari baris Catatan — memakai endpoint hafalan yang sudah
 * ada (PUT /api/hafalan/mastery) supaya konsisten dengan layar Hafalan.
 */
export function useSetMastery() {
  const invalidate = useInvalidateCatatan();
  return useMutation({
    mutationFn: (body: {
      itemType: "kotoba" | "bunpou";
      itemId: string;
      mastery: Mastery;
    }) => api.put<unknown>("/api/hafalan/mastery", body),
    onSuccess: invalidate,
  });
}

export function useCreateKotoba() {
  const invalidate = useInvalidateCatatan();
  return useMutation({
    mutationFn: (payload: KotobaWritePayload) =>
      api.post<Kotoba>("/api/kotoba", payload),
    onSuccess: invalidate,
  });
}

/**
 * Versi TANPA invalidasi otomatis — khusus loop bulk save. Pemanggil
 * WAJIB memanggil useInvalidateCatatan() sekali setelah loop selesai.
 */
export function useCreateKotobaRaw() {
  return useMutation({
    mutationFn: (payload: KotobaWritePayload) =>
      api.post<Kotoba>("/api/kotoba", payload),
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

// ---- Database-first lookup (PART 3 + PART 4) ----------------------

/**
 * Database-first lookup. Cek apakah catatan user sudah punya kotoba
 * yang cocok dengan query input — BEFORE memanggil AI. Backend menerima
 * input bebas (Jepang, Indonesia, romaji) dan match terhadap field-field
 * relevannya.
 */
export function useLookupKotoba() {
  return useMutation<
    { found: false } | { found: true; item: Kotoba },
    Error,
    string
  >({
    mutationFn: (q) =>
      api.get<{ found: false } | { found: true; item: Kotoba }>(
        "/api/kotoba/lookup",
        { query: { q } },
      ),
  });
}

export function useLookupBunpou() {
  return useMutation<
    { found: false } | { found: true; item: Bunpou },
    Error,
    string
  >({
    mutationFn: (q) =>
      api.get<{ found: false } | { found: true; item: Bunpou }>(
        "/api/bunpou/lookup",
        { query: { q } },
      ),
  });
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

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

/**
 * Data hooks untuk admin panel (owner-only). Semua endpoint di-guard
 * server-side (JwtAuthGuard + OwnerGuard) — non-owner dapat 403.
 */

export interface AdminTable {
  name: string;
  label: string;
  count: number;
  hasSecrets: boolean;
}

export interface AdminRowsResponse {
  table: string;
  label: string;
  secretFields: string[];
  columns: string[];
  rows: Record<string, unknown>[];
  pagination: { page: number; limit: number; total: number };
}

const ADMIN_KEY = "admin";

export function useAdminTables() {
  return useQuery<{ tables: AdminTable[] }>({
    queryKey: [ADMIN_KEY, "tables"],
    queryFn: () => api.get<{ tables: AdminTable[] }>("/api/admin/tables"),
    staleTime: 10_000,
  });
}

export function useAdminRows(table: string | null, page: number, limit: number) {
  return useQuery<AdminRowsResponse>({
    queryKey: [ADMIN_KEY, "rows", table, page, limit],
    queryFn: () =>
      api.get<AdminRowsResponse>(
        `/api/admin/tables/${encodeURIComponent(table ?? "")}/rows`,
        { query: { page, limit } },
      ),
    enabled: !!table,
    staleTime: 5_000,
  });
}

export function useAdminUpdateRow(table: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; data: Record<string, unknown> }) =>
      api.put(`/api/admin/tables/${encodeURIComponent(table)}/rows/${vars.id}`, {
        data: vars.data,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [ADMIN_KEY, "rows", table] });
      qc.invalidateQueries({ queryKey: [ADMIN_KEY, "tables"] });
    },
  });
}

export function useAdminDeleteRow(table: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`/api/admin/tables/${encodeURIComponent(table)}/rows/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [ADMIN_KEY, "rows", table] });
      qc.invalidateQueries({ queryKey: [ADMIN_KEY, "tables"] });
    },
  });
}

export interface FullExport {
  meta: { format: string; version: number; tables: string[]; exportedAt?: string };
  data: Record<string, unknown[]>;
}

export interface ImportResult {
  ok: boolean;
  counts: Record<string, { ok: number; skipped: number }>;
}

/** Ambil dump full-database (semua tabel & user, termasuk secret). */
export function fetchFullExport(): Promise<FullExport> {
  return api.get<FullExport>("/api/admin/export");
}

/** Kirim dump untuk di-merge (upsert) ke database. */
export function importFullDb(data: Record<string, unknown[]>): Promise<ImportResult> {
  return api.post<ImportResult>("/api/admin/import", { data });
}

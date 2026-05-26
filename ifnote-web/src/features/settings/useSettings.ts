"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { AiRequestFormat, AppSettings, JpMode, ThemeMode } from "@/lib/types";

const SETTINGS_KEY = "settings";

export function useSettings() {
  return useQuery<AppSettings>({
    queryKey: [SETTINGS_KEY],
    queryFn: () => api.get<AppSettings>("/api/settings"),
    retry: 0,
    staleTime: 60_000,
  });
}

export interface UpdateSettingsBody {
  theme?: ThemeMode;
  jpMode?: JpMode;
  onboardingSeen?: boolean;
  aiProvider?: string | null;
  aiBaseUrl?: string | null;
  aiModelId?: string | null;
  aiRequestFormat?: AiRequestFormat;
  useRealAi?: boolean;
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateSettingsBody) => api.put<AppSettings>("/api/settings", body),
    onSuccess: (data) => {
      qc.setQueryData([SETTINGS_KEY], data);
    },
  });
}

// ---- backup ------------------------------------------------------

export interface BackupExport {
  version: number;
  exportedAt: string;
  data: {
    kotoba: unknown[];
    bunpou: unknown[];
    hafalanOrder: unknown[];
    quizProgress: unknown[];
    settings: unknown;
    kanjiCache: unknown[];
  };
}

export function useExportBackup() {
  return useMutation({
    mutationFn: () => api.get<BackupExport>("/api/backup/export"),
  });
}

export function useImportBackup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { data: unknown; replace?: boolean }) =>
      api.post<{ ok: boolean; replaced: boolean; counts: Record<string, number> }>(
        "/api/backup/import",
        body,
      ),
    onSuccess: () => {
      // Wipe-and-reload cache because user data shape just changed
      qc.invalidateQueries();
    },
  });
}

export function useResetBackup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<{ ok: boolean }>("/api/backup/reset"),
    onSuccess: () => {
      qc.invalidateQueries();
    },
  });
}

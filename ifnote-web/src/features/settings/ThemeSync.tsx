"use client";

import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { useAuth } from "@/features/auth/AuthProvider";
import { useTheme } from "./ThemeProvider";
import type { AppSettings } from "@/lib/types";

/**
 * Sinkronkan theme dari server → ThemeProvider SEKALI per sesi.
 *
 * Tanpa ini, ThemeProvider hanya membaca localStorage — theme yang
 * disimpan di server tidak pernah diterapkan saat login di perangkat
 * lain. Berbagi queryKey ["settings"] dengan useSettings supaya tidak
 * menambah request.
 */
export function ThemeSync() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const applied = useRef(false);

  const q = useQuery<AppSettings>({
    queryKey: ["settings"],
    queryFn: () => api.get<AppSettings>("/api/settings"),
    enabled: !!user,
    retry: 0,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (applied.current) return;
    const serverTheme = q.data?.theme;
    if (!serverTheme) return;
    applied.current = true;
    if (serverTheme !== theme) setTheme(serverTheme);
  }, [q.data, theme, setTheme]);

  return null;
}

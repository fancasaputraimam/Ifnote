"use client";

import { ReactNode } from "react";
import { QueryProvider } from "@/features/auth/QueryProvider";
import { AuthProvider } from "@/features/auth/AuthProvider";
import { ThemeProvider } from "@/features/settings/ThemeProvider";
import { ThemeSync } from "@/features/settings/ThemeSync";
import { ToastViewport } from "@/components/feedback/Toast";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <AuthProvider>
          {children}
          {/* Terapkan theme tersimpan di server (sinkron antar perangkat). */}
          <ThemeSync />
          <ToastViewport />
        </AuthProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}

"use client";

import { ReactNode } from "react";
import { QueryProvider } from "@/features/auth/QueryProvider";
import { AuthProvider } from "@/features/auth/AuthProvider";
import { ThemeProvider } from "@/features/settings/ThemeProvider";
import { ToastViewport } from "@/components/feedback/Toast";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <AuthProvider>
          {children}
          <ToastViewport />
        </AuthProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}

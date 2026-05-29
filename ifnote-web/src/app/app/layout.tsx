"use client";

import { ReactNode } from "react";
import { ProtectedRoute } from "@/features/auth/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";
import { IdleLogoutWatcher } from "@/components/auth/IdleLogoutWatcher";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <IdleLogoutWatcher />
      <AppShell>{children}</AppShell>
    </ProtectedRoute>
  );
}

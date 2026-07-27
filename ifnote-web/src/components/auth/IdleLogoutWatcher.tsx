"use client";

import { useCallback, useRef } from "react";
import { useIdleLogout } from "@/hooks/useIdleLogout";
import { useAuth } from "@/features/auth/AuthProvider";
import { notify } from "@/lib/toast";
import { IdleWarningDialog } from "./IdleWarningDialog";

/**
 * Window idle:
 *   - 14 menit          : modal warning ("Kamu masih di sana?")
 *   - 15 menit          : auto-logout + top notification
 *
 * Watcher hanya aktif kalau user logged in (lihat auth provider). Ditaruh
 * di dalam `<ProtectedRoute>` lewat AppShell layout, jadi tidak ikut
 * ke landing/login/register/forgot-password.
 *
 * Re-mount perlindungan: ref `firedRef` mencegah notify ganda kalau
 * komponen sempat re-render saat logout flow berjalan.
 */
const WARNING_AFTER_MS = 14 * 60 * 1000;
const LOGOUT_AFTER_MS = 15 * 60 * 1000;

export function IdleLogoutWatcher() {
  const { user, logout } = useAuth();
  const firedRef = useRef(false);

  const handleLogout = useCallback(async (reason: "idle" | "manual" = "idle") => {
    if (firedRef.current) return;
    firedRef.current = true;
    if (reason === "manual") {
      notify.info(
        "Kamu keluar dari sesi",
        "Sampai jumpa lagi.",
        { icon: "👋" },
      );
    } else {
      notify.warning(
        "🔒 Sesi berakhir",
        "Kamu keluar otomatis karena tidak ada aktivitas.",
      );
    }
    try {
      await logout();
    } finally {
      // Reset supaya kalau user login lagi di tab yang sama, watcher
      // tetap bisa logout ulang nanti.
      firedRef.current = false;
    }
  }, [logout]);

  const { warning, acknowledge, forceLogout } = useIdleLogout({
    enabled: !!user,
    warnAfterMs: WARNING_AFTER_MS,
    logoutAfterMs: LOGOUT_AFTER_MS,
    onWarn: () => {
      // Modal akan tampil otomatis lewat `warning` flag.
    },
    onLogout: () => {
      void handleLogout();
    },
  });

  if (!user) return null;

  const msUntilLogout = LOGOUT_AFTER_MS - WARNING_AFTER_MS;

  return (
    <IdleWarningDialog
      open={warning}
      msUntilLogout={msUntilLogout}
      onContinue={acknowledge}
      onLogout={() => {
        forceLogout();
        void handleLogout("manual");
      }}
    />
  );
}

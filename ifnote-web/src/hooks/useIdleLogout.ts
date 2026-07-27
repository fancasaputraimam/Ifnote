"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Idle logout timer.
 *
 * Track aktivitas user (mouse, keyboard, touch, scroll, focus). Setelah
 * `warnAfterMs` tanpa aktivitas, fire `onWarn` (UI tampilkan modal). Kalau
 * masih tidak ada aktivitas sampai `logoutAfterMs`, fire `onLogout` dan
 * timer berhenti.
 *
 * Penting:
 *   - Hanya kapan-pun `enabled` true. Stop semua listener saat false.
 *   - User interaction reset timer; background API call TIDAK reset.
 *   - Listener dibersihkan saat unmount supaya tidak ada leak/duplicate.
 *   - `acknowledge()` dipakai oleh modal "Lanjutkan" supaya warning hilang
 *     dan timer reset ke status fresh tanpa men-trigger logout.
 */
export interface UseIdleLogoutOptions {
  /** Apakah timer aktif. Biasanya true hanya kalau user logged in. */
  enabled: boolean;
  /** ms tanpa aktivitas sebelum onWarn dipanggil. */
  warnAfterMs: number;
  /** ms tanpa aktivitas sebelum onLogout dipanggil. */
  logoutAfterMs: number;
  /** Disebut saat threshold warning tercapai. */
  onWarn: () => void;
  /** Disebut saat threshold logout tercapai. */
  onLogout: () => void;
}

export interface UseIdleLogoutReturn {
  /** Apakah modal warning sedang tampil. */
  warning: boolean;
  /** "Lanjutkan" \u2014 reset timer dan tutup warning. */
  acknowledge: () => void;
  /** Force logout sekarang (mis. tombol "Logout" di modal). */
  forceLogout: () => void;
  /** Reset timer manual (jarang dipakai dari luar). */
  reset: () => void;
}

const ACTIVITY_EVENTS = [
  "mousemove",
  "mousedown",
  "keydown",
  "touchstart",
  "scroll",
  "wheel",
  "focus",
] as const;

export function useIdleLogout(opts: UseIdleLogoutOptions): UseIdleLogoutReturn {
  const { enabled, warnAfterMs, logoutAfterMs, onWarn, onLogout } = opts;

  const [warning, setWarning] = useState(false);

  const warnTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logoutTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Stable refs for callbacks supaya effect tidak re-bind setiap render.
  const onWarnRef = useRef(onWarn);
  const onLogoutRef = useRef(onLogout);
  useEffect(() => {
    onWarnRef.current = onWarn;
    onLogoutRef.current = onLogout;
  }, [onWarn, onLogout]);

  const clearTimers = useCallback(() => {
    if (warnTimer.current) {
      clearTimeout(warnTimer.current);
      warnTimer.current = null;
    }
    if (logoutTimer.current) {
      clearTimeout(logoutTimer.current);
      logoutTimer.current = null;
    }
  }, []);

  const startTimers = useCallback(() => {
    clearTimers();
    warnTimer.current = setTimeout(() => {
      setWarning(true);
      onWarnRef.current();
    }, warnAfterMs);
    logoutTimer.current = setTimeout(() => {
      setWarning(false);
      onLogoutRef.current();
    }, logoutAfterMs);
  }, [clearTimers, warnAfterMs, logoutAfterMs]);

  const reset = useCallback(() => {
    if (!enabled) return;
    if (warning) return; // jangan diam-diam reset; warning butuh acknowledge eksplisit
    startTimers();
  }, [enabled, warning, startTimers]);

  const acknowledge = useCallback(() => {
    setWarning(false);
    startTimers();
  }, [startTimers]);

  const forceLogout = useCallback(() => {
    clearTimers();
    setWarning(false);
    onLogoutRef.current();
  }, [clearTimers]);

  useEffect(() => {
    if (!enabled) {
      clearTimers();
      setWarning(false);
      return;
    }

    startTimers();

    const onActivity = () => {
      // Selama warning aktif, jangan auto-reset \u2014 user harus klik
      // "Lanjutkan". Kalau tidak, gerakan kursor liar bisa membatalkan
      // warning dan user tidak pernah lihat dialog.
      if (warning) return;
      startTimers();
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible" && !warning) {
        startTimers();
      }
    };

    for (const evt of ACTIVITY_EVENTS) {
      window.addEventListener(evt, onActivity, { passive: true });
    }
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      for (const evt of ACTIVITY_EVENTS) {
        window.removeEventListener(evt, onActivity);
      }
      document.removeEventListener("visibilitychange", onVisibility);
      clearTimers();
    };
  }, [enabled, warning, startTimers, clearTimers]);

  return { warning, acknowledge, forceLogout, reset };
}

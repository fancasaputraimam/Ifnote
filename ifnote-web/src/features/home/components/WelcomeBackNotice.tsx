"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ROUTES } from "@/lib/constants";
import { safeStorage } from "@/lib/utils";
import { cn } from "@/lib/utils";

const SESSION_FLAG = "ifnote.homeWelcomeShown";
/** Auto-dismiss timer (ms). 0 = no auto-dismiss. */
const AUTO_DISMISS_MS = 8_000;

/**
 * Floating welcome notification ("おかえりなさい") yang menggantikan kartu
 * besar Welcome Back di Home. Sifatnya non-blocking, tampil sekali per
 * sesi browser (sessionStorage flag), dan auto-dismiss setelah beberapa
 * detik. Bisa ditutup manual via tombol X.
 *
 * Posisi:
 *   - Desktop: pojok kanan bawah
 *   - Mobile : melayang di atas bottom nav (margin bawah ~5.5rem)
 *
 * Dipanggil sekali di HomeScreen.
 */
export function WelcomeBackNotice() {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    // Cek session flag — kalau sudah pernah tampil, jangan tampil lagi
    // sampai user buka tab baru / reload.
    const seen = safeStorage.session.get(SESSION_FLAG);
    if (seen === "1") return;
    setOpen(true);
    safeStorage.session.set(SESSION_FLAG, "1");

    if (AUTO_DISMISS_MS > 0) {
      const timer = setTimeout(() => requestClose(), AUTO_DISMISS_MS);
      return () => clearTimeout(timer);
    }
  }, []);

  const requestClose = () => {
    setClosing(true);
    setTimeout(() => setOpen(false), 200);
  };

  if (!open) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        // PRD PART 6: notifikasi tampil di atas, bukan di bawah.
        // Mobile: top-center, safe-area aware. Desktop: top-right.
        "fixed left-3 right-3 z-30 md:left-auto md:right-6 md:max-w-sm",
        // Mobile: agak turun supaya tidak menutup global toast viewport
        // (toast viewport pakai env(safe-area-inset-top)+16px). Desktop
        // tetap agak menjorok dari topbar.
        "top-[calc(env(safe-area-inset-top,0px)+88px)] md:top-6",
        "rounded-notebook border border-paper-200 bg-white p-4 shadow-notebook-md",
        "dark:border-ink-700 dark:bg-ink-800",
        "transition-all duration-200 ease-out",
        closing
          ? "-translate-y-2 opacity-0"
          : "translate-y-0 opacity-100",
      )}
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent-500/15 font-jp text-accent-600 dark:text-accent-300"
        >
          ノ
        </span>
        <div className="min-w-0 flex-1">
          <div className="font-jp text-sm font-semibold text-ink-800 dark:text-paper-50">
            おかえりなさい
          </div>
          <p className="mt-0.5 font-jp text-xs text-ink-700 dark:text-paper-50">
            今日も少しずつ勉強しましょう。
          </p>
          <p className="mt-0.5 text-xs text-ink-400">
            Lanjutkan belajar Jepang hari ini.
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href={ROUTES.app.catatan}
              onClick={requestClose}
              className="inline-flex items-center justify-center rounded-full bg-accent-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-accent-600"
            >
              Buka Catatan
            </Link>
            <Link
              href={ROUTES.app.hafalan}
              onClick={requestClose}
              className="inline-flex items-center justify-center rounded-full bg-paper-200 px-3 py-1.5 text-xs font-medium text-ink-800 transition-colors hover:bg-paper-200/70 dark:bg-ink-700 dark:text-paper-50 dark:hover:bg-ink-600"
            >
              Mulai Hafalan
            </Link>
          </div>
        </div>

        <button
          type="button"
          aria-label="Tutup notifikasi"
          onClick={requestClose}
          className="shrink-0 rounded-full p-1 text-ink-400 hover:bg-paper-100 hover:text-ink-700 dark:hover:bg-ink-700 dark:hover:text-paper-50"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/lib/constants";

/**
 * Error boundary global untuk app shell. Next.js akan otomatis nge-mount
 * komponen ini kalau client component di dalam `/app/*` lempar error
 * yang tidak tertangkap. Tanpa file ini, dev mode jatuh ke `/_error`
 * legacy yang menampilkan "missing required error components".
 *
 * Cases umum:
 *   - logout race condition (queries refetch saat token sudah dihapus)
 *   - mutation error yang lolos dari try/catch komponen
 *   - lifecycle error saat unmount route
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    // Log raw error ke console saja — UI hanya tampilkan pesan ramah.
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.error("[AppError]", error);
    }
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-3 px-4 text-center">
      <div className="text-5xl" aria-hidden>
        🍂
      </div>
      <h1 className="text-lg font-semibold text-ink-800 dark:text-paper-50">
        Ada yang tidak beres
      </h1>
      <p className="text-sm text-ink-500 dark:text-paper-50/70">
        Halaman ini gagal dimuat. Coba muat ulang, atau kembali ke Home.
      </p>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-full bg-accent-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-600"
        >
          Coba lagi
        </button>
        <Link
          href={ROUTES.app.home}
          className="rounded-full bg-paper-100 px-4 py-2 text-sm font-medium text-ink-700 transition-colors hover:bg-paper-200 dark:bg-ink-700 dark:text-paper-50 dark:hover:bg-ink-600"
        >
          Kembali ke Home
        </Link>
        <button
          type="button"
          onClick={() => router.replace(ROUTES.login)}
          className="text-xs text-ink-400 underline-offset-4 hover:underline"
        >
          Masuk ulang
        </button>
      </div>
    </div>
  );
}

"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ROUTES } from "@/lib/constants";

/**
 * Root-level error boundary. Catch error apapun di luar `/app/*` (mis.
 * landing, login, register, forgot-password). Next.js wajib punya file
 * ini di app router segments yang punya client components — kalau tidak,
 * dev mode jatuh ke `/_error` legacy.
 */
export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.error("[RootError]", error);
    }
  }, [error]);

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-3 px-4 text-center">
      <div className="text-5xl" aria-hidden>
        🍂
      </div>
      <h1 className="text-lg font-semibold text-ink-800 dark:text-paper-50">
        Halaman bermasalah
      </h1>
      <p className="text-sm text-ink-500 dark:text-paper-50/70">
        Coba muat ulang halaman, atau kembali ke beranda.
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
          href={ROUTES.login}
          className="rounded-full bg-paper-100 px-4 py-2 text-sm font-medium text-ink-700 transition-colors hover:bg-paper-200 dark:bg-ink-700 dark:text-paper-50 dark:hover:bg-ink-600"
        >
          Kembali ke beranda
        </Link>
      </div>
    </div>
  );
}

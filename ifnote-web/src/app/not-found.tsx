import Link from "next/link";
import { ROUTES } from "@/lib/constants";

/**
 * Catch-all 404 page. Tanpa file ini, app router fallback ke
 * `/_error` legacy → muncul "missing required error components".
 */
export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-3 px-4 text-center">
      <div className="text-5xl" aria-hidden>
        🍃
      </div>
      <h1 className="text-lg font-semibold text-ink-800 dark:text-paper-50">
        Halaman tidak ditemukan
      </h1>
      <p className="text-sm text-ink-500 dark:text-paper-50/70">
        URL ini tidak ada di ifNote. Coba kembali ke Home atau Catatan.
      </p>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
        <Link
          href={ROUTES.app.home}
          className="rounded-full bg-accent-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-600"
        >
          Kembali ke Home
        </Link>
        <Link
          href={ROUTES.app.catatan}
          className="rounded-full bg-paper-100 px-4 py-2 text-sm font-medium text-ink-700 transition-colors hover:bg-paper-200 dark:bg-ink-700 dark:text-paper-50 dark:hover:bg-ink-600"
        >
          Buka Catatan
        </Link>
      </div>
    </div>
  );
}

import Link from "next/link";
import { APP_NAME, ROUTES } from "@/lib/constants";

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center gap-2 px-4 py-4">
        <span aria-hidden className="grid h-9 w-9 place-items-center rounded-full bg-accent-500/15 text-accent-600 font-jp">
          ノ
        </span>
        <span className="font-semibold text-ink-800 dark:text-paper-50">{APP_NAME}</span>
        <div className="ml-auto flex items-center gap-2">
          <Link
            href={ROUTES.login}
            className="rounded-full px-3 py-1.5 text-sm font-medium text-ink-700 hover:bg-paper-100 dark:text-paper-50 dark:hover:bg-ink-700"
          >
            Masuk
          </Link>
          <Link
            href={ROUTES.register}
            className="rounded-full bg-accent-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-600"
          >
            Daftar
          </Link>
        </div>
      </header>

      <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-6 text-center">
        <span className="text-5xl font-jp text-accent-500" aria-hidden>ノート</span>
        <h1 className="mt-6 text-3xl font-semibold text-ink-800 dark:text-paper-50 sm:text-4xl">
          Catatan tenang untuk belajar bahasa Jepang
        </h1>
        <p className="mt-4 max-w-xl text-base text-ink-400">
          Simpan kotoba dan bunpou, hafalkan dengan slide tetap 20 item, ujikan diri
          dengan quiz, dan minta bantuan AI tutor untuk fokus N5/N4.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href={ROUTES.register}
            className="rounded-full bg-accent-500 px-5 py-2.5 text-sm font-semibold text-white shadow-notebook hover:bg-accent-600"
          >
            Mulai gratis
          </Link>
          <Link
            href={ROUTES.login}
            className="rounded-full border border-paper-200 bg-white px-5 py-2.5 text-sm font-semibold text-ink-700 hover:bg-paper-100 dark:border-ink-700 dark:bg-ink-800 dark:text-paper-50 dark:hover:bg-ink-700"
          >
            Sudah punya akun
          </Link>
        </div>
      </section>

      <footer className="mx-auto w-full max-w-5xl px-4 py-6 text-center text-xs text-ink-400">
        © {new Date().getFullYear()} {APP_NAME}
      </footer>
    </main>
  );
}

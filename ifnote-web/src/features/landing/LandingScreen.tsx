"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LinkButton } from "@/components/ui/LinkButton";
import { authClient } from "@/lib/auth-client";
import { ROUTES } from "@/lib/constants";

interface Feature {
  kana: string;
  title: string;
  desc: string;
}

const FEATURES: Feature[] = [
  {
    kana: "言",
    title: "Catatan",
    desc: "Kotoba & bunpou jadi satu. Cari, filter per level N5–N1, dan kelola contoh kalimat dengan reading.",
  },
  {
    kana: "記",
    title: "Hafalan",
    desc: "Slide tetap 20 item, mode kotoba/bunpou/mixed/weak, tandai mastery, dan latih kata yang masih lemah.",
  },
  {
    kana: "試",
    title: "Quiz",
    desc: "Empat tipe soal dari catatanmu sendiri. Progres tersimpan otomatis per tipe quiz.",
  },
  {
    kana: "AI",
    title: "AI Tutor",
    desc: "Jelaskan kotoba/bunpou, koreksi kalimat, buat contoh, dan bulk import — lewat proxy aman di server.",
  },
];

/**
 * Landing page ifNote. Mengikuti design system "Calm Japanese notebook":
 * latar paper, aksen kana samar, accent indigo. User yang sudah login
 * langsung diarahkan ke /app/home (sama seperti ProtectedRoute, tapi
 * terbalik) supaya tidak melihat halaman marketing lagi.
 */
export function LandingScreen() {
  const router = useRouter();
  // Cegah flash konten marketing untuk user yang ternyata sudah login.
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (authClient.hasToken()) {
      router.replace(ROUTES.app.home);
      return;
    }
    setChecking(false);
  }, [router]);

  if (checking) {
    return (
      <main className="grid min-h-screen place-items-center bg-paper-50 dark:bg-paper-900">
        <span
          className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-accent-400 border-t-transparent"
          aria-label="Memuat"
        />
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-paper-50 dark:bg-paper-900">
      <KanaBackdrop />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-5xl flex-col px-5 py-6 sm:px-8">
        {/* Top bar */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden
              className="grid h-9 w-9 place-items-center rounded-2xl bg-accent-500 font-jp text-lg text-white shadow-notebook"
            >
              ノ
            </span>
            <span className="text-lg font-semibold tracking-tight text-ink-800 dark:text-paper-50">
              ifNote
            </span>
          </div>
          <Link
            href={ROUTES.login}
            className="text-sm font-medium text-ink-600 underline-offset-4 hover:text-accent-600 hover:underline dark:text-paper-50 dark:hover:text-accent-400"
          >
            Masuk
          </Link>
        </header>

        {/* Hero */}
        <section className="flex flex-1 flex-col items-center justify-center py-12 text-center sm:py-16">
          <p className="font-jp text-sm tracking-widest text-accent-500">
            ノート・記憶・AI
          </p>
          <h1 className="mt-4 max-w-2xl text-3xl font-semibold leading-tight tracking-tight text-ink-800 dark:text-paper-50 sm:text-4xl md:text-5xl">
            Belajar bahasa Jepang dengan tenang
          </h1>
          <p className="mt-4 max-w-xl text-base text-ink-400 sm:text-lg">
            Catatan kotoba & bunpou, hafalan terstruktur, quiz, dan AI tutor
            dalam satu tempat. Dirancang untuk pelajar Indonesia level N5–N1.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
            <LinkButton href={ROUTES.register} size="lg" className="w-full sm:w-auto">
              Mulai gratis
            </LinkButton>
            <LinkButton
              href={ROUTES.login}
              size="lg"
              variant="secondary"
              className="w-full sm:w-auto"
            >
              Sudah punya akun
            </LinkButton>
          </div>
        </section>

        {/* Features */}
        <section
          aria-label="Fitur ifNote"
          className="grid grid-cols-1 gap-4 pb-12 sm:grid-cols-2 lg:grid-cols-4"
        >
          {FEATURES.map((f) => (
            <article
              key={f.title}
              className="rounded-notebook border border-paper-200 bg-white p-5 shadow-notebook dark:border-ink-700 dark:bg-ink-800"
            >
              <span
                aria-hidden
                className="grid h-10 w-10 place-items-center rounded-xl bg-accent-50 font-jp text-base font-semibold text-accent-600 dark:bg-ink-700 dark:text-accent-200"
              >
                {f.kana}
              </span>
              <h2 className="mt-3 text-base font-semibold text-ink-800 dark:text-paper-50">
                {f.title}
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-ink-400">{f.desc}</p>
            </article>
          ))}
        </section>

        {/* Footer */}
        <footer className="border-t border-paper-200 py-6 text-center text-xs text-ink-400 dark:border-ink-700">
          © {new Date().getFullYear()} ifNote · Japanese Notes with AI
        </footer>
      </div>
    </main>
  );
}

/**
 * Kana besar samar di latar — selaras dengan AuthCard. aria-hidden,
 * tidak intercept input, hanya tampil di sm+ supaya mobile tetap bersih.
 */
function KanaBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 hidden select-none sm:block"
    >
      <span className="absolute left-[6%] top-[14%] font-jp text-[160px] leading-none text-accent-500/[0.06] dark:text-accent-200/[0.05]">
        あ
      </span>
      <span className="absolute right-[8%] top-[10%] font-jp text-[130px] leading-none text-lilac-500/[0.07] dark:text-lilac-400/[0.06]">
        ア
      </span>
      <span className="absolute bottom-[12%] left-[10%] font-jp text-[170px] leading-none text-leaf-500/[0.06] dark:text-leaf-500/[0.05]">
        漢
      </span>
      <span className="absolute bottom-[16%] right-[7%] font-jp text-[120px] leading-none text-accent-500/[0.06] dark:text-accent-200/[0.05]">
        の
      </span>
    </div>
  );
}

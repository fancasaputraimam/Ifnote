"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { FOCUS_RING } from "@/components/site/focus";
import { ROUTES, APP_NAME } from "@/lib/constants";

interface AuthCardProps {
  /** Heading di dalam card. */
  title: string;
  /** Subtitle / deskripsi pendek. */
  description?: ReactNode;
  /** Form atau body utama. */
  children: ReactNode;
  /** Bagian bawah card, mis. link kembali. */
  footer?: ReactNode;
  /** Tampilkan brand block ifNote. Default: true. */
  showBrand?: boolean;
}

const EASE = [0.22, 0.61, 0.36, 1] as const;

const SMALL_LINK = `inline-flex min-h-11 items-center rounded px-1 underline-offset-4 hover:text-accent-700 hover:underline dark:hover:text-accent-300 ${FOCUS_RING}`;

/**
 * Split-screen auth shell ("Sumi & Washi"):
 *  - kiri  : panel sumi-ink gelap (desktop): ensō, tulisan vertikal, stempel hanko, tiga pilar
 *  - kanan : kolom form di atas kertas bergaris dengan garis margin merah
 *
 * Form dirender langsung terlihat dari server. Tidak ada animasi masuk per elemen:
 * dulu framer-motion mengirim opacity:0 di HTML, jadi form kosong sampai JS selesai.
 * Satu-satunya gerak adalah ensō yang tergambar sekali (menghormati reduced motion).
 */
export function AuthCard({ title, description, children, footer, showBrand = true }: AuthCardProps) {
  return (
    <main className="relative min-h-screen w-full bg-paper-50 dark:bg-paper-900 lg:grid lg:grid-cols-[1.08fr_1fr]">
      <VisualPanel />

      {/* Kanan: form di atas kertas bergaris */}
      <section className="notebook-rule relative flex min-h-screen flex-col justify-center overflow-hidden px-5 py-10 sm:px-10">
        {/* garis margin merah, seperti buku latihan Jepang */}
        <div aria-hidden className="absolute inset-y-0 left-6 hidden w-px bg-accent-500/25 sm:block lg:left-10" />
        <div aria-hidden className="absolute inset-y-0 left-[27px] hidden w-px bg-accent-500/10 sm:block lg:left-[43px]" />
        <FormKana />

        <div className="relative z-10 mx-auto w-full max-w-sm">
          {showBrand ? <BrandBlock /> : null}

          <h1 className="font-serif text-3xl font-semibold leading-tight tracking-tight text-ink-800 dark:text-paper-50">
            {title}
          </h1>
          {description ? (
            <div className="mt-1.5 text-sm leading-relaxed text-ink-400">{description}</div>
          ) : null}

          <div className="mt-7">{children}</div>

          {footer ? <div className="mt-7">{footer}</div> : null}

          {/* Halaman Ketentuan dan Privasi lengkap sudah dihapus; yang ada ringkasan di halaman depan. */}
          <p className="mt-9 text-center text-xs leading-relaxed text-ink-400">
            Dengan memakai {APP_NAME}, kamu menyetujui ringkasan{" "}
            <Link href={ROUTES.terms} className={SMALL_LINK}>
              Ketentuan
            </Link>{" "}
            dan{" "}
            <Link href={ROUTES.privacy} className={SMALL_LINK}>
              Privasi
            </Link>{" "}
            di halaman depan.
          </p>
          <p className="text-center text-xs text-ink-400">
            <Link href={ROUTES.about} className={SMALL_LINK}>
              Tentang
            </Link>
            <span aria-hidden> · </span>
            <Link href={ROUTES.contact} className={SMALL_LINK}>
              Kontak
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}

/* ------------------------------------------------------------------ */
/* Brand (sisi form, HP dan tablet)                                    */
/* ------------------------------------------------------------------ */

function BrandBlock() {
  return (
    <Link
      href={ROUTES.landing}
      className={`mb-8 flex min-h-11 w-fit items-center gap-2.5 rounded lg:hidden ${FOCUS_RING}`}
      aria-label="Kembali ke beranda ifNote"
    >
      <span
        aria-hidden
        className="grid h-10 w-10 -rotate-3 place-items-center rounded-[10px] bg-accent-gradient font-serif text-xl text-white"
      >
        ノ
      </span>
      <span className="font-serif text-lg font-semibold tracking-tight text-ink-800 dark:text-paper-50">
        {APP_NAME}
      </span>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/* Panel kiri (desktop): sumi ink, ensō, tulisan vertikal, hanko       */
/* ------------------------------------------------------------------ */

const FEATURES = [
  { kanji: "語", label: "Kotoba", jp: "ことば" },
  { kanji: "文", label: "Bunpou", jp: "ぶんぽう" },
  { kanji: "記", label: "Hafalan", jp: "あんき" },
] as const;

function VisualPanel() {
  return (
    <aside className="relative hidden flex-col overflow-hidden bg-ink-gradient p-12 text-paper-50 lg:flex">
      {/* tekstur kertas washi */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(rgba(247,247,246,0.05) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />
      <Enso />

      <Link
        href={ROUTES.landing}
        className={`relative z-10 flex min-h-11 w-fit items-center gap-2.5 rounded ${FOCUS_RING}`}
        aria-label="Beranda ifNote"
      >
        <span
          aria-hidden
          className="grid h-10 w-10 -rotate-3 place-items-center rounded-[10px] bg-accent-gradient font-serif text-xl text-white"
        >
          ノ
        </span>
        <span className="text-lg font-semibold tracking-tight">{APP_NAME}</span>
      </Link>

      {/* tengah: tulisan vertikal + stempel hanko, dekoratif */}
      <div aria-hidden className="relative z-10 flex flex-1 items-center justify-center">
        <div className="relative flex items-start gap-9 pb-10">
          <p lang="ja" className="font-jp text-4xl font-medium tracking-[0.42em] text-paper-50 [writing-mode:vertical-rl]">
            ことばを、あつめる。
          </p>
          <p lang="ja" className="mt-16 font-jp text-2xl tracking-[0.42em] text-paper-50/60 [writing-mode:vertical-rl]">
            しずかに、まなぶ。
          </p>
          <span className="absolute -bottom-6 -left-14 grid h-14 w-14 -rotate-6 place-items-center rounded-[12px] bg-accent-gradient font-serif text-2xl text-white">
            ノ
          </span>
        </div>
      </div>

      {/* bawah: satu kalimat deskripsi produk + tiga pilar */}
      <div className="relative z-10 space-y-6">
        <p className="max-w-md text-base leading-relaxed text-paper-50/90">
          Kotoba, bunpou, hafalan, dan AI tutor dalam satu buku catatan.
        </p>

        <div className="grid max-w-md grid-cols-3 gap-px overflow-hidden rounded-notebook border border-paper-50/10 bg-paper-50/10">
          {FEATURES.map((f) => (
            <div key={f.label} className="bg-ink-900/45 px-4 py-3">
              <div lang="ja" aria-hidden className="font-serif text-lg leading-none text-accent-300">
                {f.kanji}
              </div>
              <div className="mt-1.5 text-xs font-medium text-paper-50/90">{f.label}</div>
              <div lang="ja" className="font-jp text-[11px] tracking-[0.18em] text-paper-50/70">
                {f.jp}
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

/* ------------------------------------------------------------------ */
/* Ensō: lingkaran zen, tergambar sekali saat halaman dibuka           */
/* ------------------------------------------------------------------ */

function Enso() {
  const reduce = useReducedMotion();
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-[56%]"
      viewBox="0 0 200 200"
      fill="none"
    >
      <motion.circle
        cx="100"
        cy="100"
        r="84"
        stroke="rgba(247,247,246,0.09)"
        strokeWidth="9"
        strokeLinecap="round"
        transform="rotate(-96 100 100)"
        initial={reduce ? { pathLength: 0.93 } : { pathLength: 0 }}
        animate={{ pathLength: 0.93 }}
        transition={{ duration: reduce ? 0 : 1.6, ease: EASE, delay: reduce ? 0 : 0.2 }}
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Kana samar di sisi form (HP, saat panel kiri tersembunyi)           */
/* ------------------------------------------------------------------ */

function FormKana() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 select-none overflow-hidden lg:hidden">
      <span lang="ja" className="absolute left-[6%] top-[9%] font-jp text-[130px] leading-none text-accent-500/[0.05]">
        あ
      </span>
      <span lang="ja" className="absolute bottom-[7%] right-[5%] font-jp text-[120px] leading-none text-lilac-500/[0.06]">
        の
      </span>
    </div>
  );
}

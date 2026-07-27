"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ROUTES, APP_NAME } from "@/lib/constants";

interface AuthCardProps {
  /** Furigana/kanji overline di atas judul (mis. "ようこそ"). */
  overline?: string;
  /** Heading di dalam card. */
  title: string;
  /** Subtitle / deskripsi pendek. */
  description?: ReactNode;
  /** Form atau body utama. */
  children: ReactNode;
  /** Bagian bawah card — biasanya social buttons + link alternatif. */
  footer?: ReactNode;
  /** Tampilkan brand block ifNote. Default: true. */
  showBrand?: boolean;
}

const EASE = [0.22, 0.61, 0.36, 1] as const;

const container = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};
const item = {
  hidden: { y: 14, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.38, ease: EASE } },
};

/**
 * Split-screen auth shell (ifNote 3.0 — "Sumi & Washi"):
 *  - kiri  : panel sumi-ink gelap — ensō, tategaki (tulisan vertikal),
 *            stempel hanko vermillion, strip fitur di bawah
 *  - kanan : kolom form di atas kertas bergaris notebook dengan garis
 *            margin merah, animasi stagger
 *
 * Props tidak berubah → Login / Register / ForgotPassword tetap memakainya.
 */
export function AuthCard({
  overline,
  title,
  description,
  children,
  footer,
  showBrand = true,
}: AuthCardProps) {
  return (
    <main className="relative min-h-screen w-full bg-paper-50 dark:bg-paper-900 lg:grid lg:grid-cols-[1.08fr_1fr]">
      {/* Left — visual panel (desktop only) */}
      <VisualPanel />

      {/* Right — form on ruled notebook paper */}
      <section className="notebook-rule relative flex min-h-screen flex-col justify-center overflow-hidden px-5 py-10 sm:px-10">
        {/* red margin line, like a Japanese exercise book */}
        <div
          aria-hidden
          className="absolute inset-y-0 left-6 hidden w-px bg-accent-500/25 sm:block lg:left-10"
        />
        <div
          aria-hidden
          className="absolute inset-y-0 left-[27px] hidden w-px bg-accent-500/10 sm:block lg:left-[43px]"
        />
        <FormKana />

        <div className="relative z-10 mx-auto w-full max-w-sm">
          <motion.div variants={container} initial="hidden" animate="visible">
            {showBrand ? (
              <motion.div variants={item}>
                <BrandBlock />
              </motion.div>
            ) : null}

            <motion.div variants={item}>
              {overline ? (
                <div className="flex items-center gap-2">
                  <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-accent-500" />
                  <span className="font-jp text-xs tracking-[0.28em] text-accent-600 dark:text-accent-400">
                    {overline}
                  </span>
                </div>
              ) : null}
              <h1 className="mt-2 font-serif text-3xl font-semibold leading-tight tracking-tight text-ink-800 dark:text-paper-50">
                {title}
              </h1>
              {description ? (
                <div className="mt-1.5 text-sm leading-relaxed text-ink-400">{description}</div>
              ) : null}
            </motion.div>

            <motion.div variants={item} className="mt-7">
              {children}
            </motion.div>

            {footer ? (
              <motion.div variants={item} className="mt-7">
                {footer}
              </motion.div>
            ) : null}

            <motion.p variants={item} className="mt-9 text-center text-xs text-ink-400">
              Dengan melanjutkan kamu menyetujui{" "}
              <Link
                href={ROUTES.landing}
                className="underline-offset-4 hover:text-accent-600 hover:underline dark:hover:text-accent-300"
              >
                ketentuan
              </Link>{" "}
              {APP_NAME}.
            </motion.p>
          </motion.div>
        </div>
      </section>
    </main>
  );
}

/* ------------------------------------------------------------------ */
/* Brand (form side, mobile/tablet)                                    */
/* ------------------------------------------------------------------ */

function BrandBlock() {
  return (
    <Link
      href={ROUTES.landing}
      className="mb-8 flex items-center gap-2.5 lg:hidden"
      aria-label="Kembali ke beranda ifNote"
    >
      <span
        aria-hidden
        className="grid h-10 w-10 -rotate-3 place-items-center rounded-[10px] bg-accent-gradient font-serif text-xl text-white shadow-glow-sm"
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
/* Visual panel (desktop) — sumi ink, ensō, tategaki, hanko            */
/* ------------------------------------------------------------------ */

const FEATURES = [
  { kanji: "語", label: "Kotoba", jp: "ことば" },
  { kanji: "文", label: "Bunpou", jp: "ぶんぽう" },
  { kanji: "記", label: "Hafalan", jp: "あんき" },
] as const;

function VisualPanel() {
  return (
    <aside className="relative hidden flex-col overflow-hidden bg-ink-gradient p-12 text-paper-50 lg:flex">
      {/* washi grain */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(rgba(247,247,246,0.05) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />
      <Enso />
      <FloatingKana />

      {/* brand top */}
      <Link
        href={ROUTES.landing}
        className="relative z-10 flex items-center gap-2.5"
        aria-label="Beranda ifNote"
      >
        <span
          aria-hidden
          className="grid h-10 w-10 -rotate-3 place-items-center rounded-[10px] bg-accent-gradient font-serif text-xl text-white shadow-glow-sm"
        >
          ノ
        </span>
        <span className="text-lg font-semibold tracking-tight">{APP_NAME}</span>
      </Link>

      {/* center — tategaki + hanko signature */}
      <div className="relative z-10 flex flex-1 items-center justify-center">
        <div className="relative flex items-start gap-9 pb-10">
          <motion.p
            initial={{ opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.15 }}
            className="font-jp text-4xl font-medium tracking-[0.42em] text-paper-50 [writing-mode:vertical-rl]"
          >
            ことばを、あつめる。
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.35 }}
            className="mt-16 font-jp text-2xl tracking-[0.42em] text-paper-50/55 [writing-mode:vertical-rl]"
          >
            しずかに、まなぶ。
          </motion.p>
          {/* hanko seal — a signature under the calligraphy */}
          <motion.span
            aria-hidden
            initial={{ opacity: 0, scale: 0.55, rotate: -14 }}
            animate={{ opacity: 1, scale: 1, rotate: -5 }}
            transition={{ duration: 0.5, ease: EASE, delay: 0.85 }}
            className="absolute -bottom-6 -left-14 grid h-14 w-14 place-items-center rounded-[12px] bg-accent-gradient font-serif text-2xl text-white shadow-glow"
          >
            ノ
          </motion.span>
        </div>
      </div>

      {/* bottom — quote + feature strip */}
      <div className="relative z-10 space-y-6">
        <blockquote className="max-w-md space-y-1.5">
          <p className="text-base leading-relaxed text-paper-50/90">
            “Catat bahasa Jepang dengan tenang — kotoba, bunpou, hafalan, dan AI tutor
            dalam satu tempat.”
          </p>
          <footer className="font-jp text-xs tracking-[0.22em] text-paper-50/60">
            静かに学ぶ · {APP_NAME}
          </footer>
        </blockquote>

        <div className="grid max-w-md grid-cols-3 gap-px overflow-hidden rounded-notebook border border-paper-50/10 bg-paper-50/10">
          {FEATURES.map((f) => (
            <div key={f.label} className="bg-ink-900/45 px-4 py-3 backdrop-blur-sm">
              <div className="font-serif text-lg leading-none text-accent-300">{f.kanji}</div>
              <div className="mt-1.5 text-xs font-medium text-paper-50/90">{f.label}</div>
              <div className="font-jp text-[10px] tracking-[0.18em] text-paper-50/45">{f.jp}</div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

/* ------------------------------------------------------------------ */
/* Ensō — brushed zen circle, drawn once on mount                      */
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
        transition={{ duration: 1.6, ease: EASE, delay: 0.2 }}
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Floating kana particles (visual panel)                              */
/* ------------------------------------------------------------------ */

const KANA_PARTICLES = [
  { ch: "あ", left: "9%", top: "16%", size: 74, dur: 13, delay: 0 },
  { ch: "ん", left: "80%", top: "11%", size: 56, dur: 16, delay: 1.2 },
  { ch: "の", left: "72%", top: "64%", size: 88, dur: 15, delay: 0.6 },
  { ch: "き", left: "12%", top: "70%", size: 52, dur: 14, delay: 1.8 },
] as const;

function FloatingKana() {
  const reduce = useReducedMotion();
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 select-none overflow-hidden">
      {KANA_PARTICLES.map((k) => (
        <motion.span
          key={k.ch}
          className="absolute font-jp leading-none text-paper-50/[0.05]"
          style={{ left: k.left, top: k.top, fontSize: k.size }}
          animate={reduce ? undefined : { y: [0, -14, 0] }}
          transition={{ duration: k.dur, delay: k.delay, repeat: Infinity, ease: "easeInOut" }}
        >
          {k.ch}
        </motion.span>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Subtle kana on the form side (mobile, where the panel is hidden)    */
/* ------------------------------------------------------------------ */

function FormKana() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 select-none overflow-hidden lg:hidden"
    >
      <span className="absolute left-[6%] top-[9%] font-jp text-[130px] leading-none text-accent-500/[0.05]">
        あ
      </span>
      <span className="absolute bottom-[7%] right-[5%] font-jp text-[120px] leading-none text-lilac-500/[0.06]">
        の
      </span>
    </div>
  );
}

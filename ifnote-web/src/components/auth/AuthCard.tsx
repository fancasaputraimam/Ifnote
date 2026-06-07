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
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};
const item = {
  hidden: { y: 16, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.4, ease: EASE } },
};

/**
 * Split-screen auth shell (ifNote 2.0, MCP "AuthFormSplitScreen" pattern):
 *  - kiri  : panel visual gradient Jepang + 日本語 + animated floating paths
 *  - kanan : kolom form ber-animasi stagger (brand, overline, title, form)
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
    <main className="relative min-h-screen w-full bg-paper-50 dark:bg-paper-900 lg:grid lg:grid-cols-2">
      {/* Left — visual panel (desktop only) */}
      <VisualPanel />

      {/* Right — form */}
      <section className="relative flex min-h-screen flex-col justify-center overflow-hidden px-5 py-10 sm:px-10">
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
                <div className="font-jp text-xs tracking-[0.3em] text-accent-500">
                  {overline}
                </div>
              ) : null}
              <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-ink-800 dark:text-paper-50">
                {title}
              </h1>
              {description ? (
                <div className="mt-1 text-sm leading-relaxed text-ink-400">{description}</div>
              ) : null}
            </motion.div>

            <motion.div variants={item} className="mt-6">
              {children}
            </motion.div>

            {footer ? (
              <motion.div variants={item} className="mt-6">
                {footer}
              </motion.div>
            ) : null}

            <motion.p variants={item} className="mt-8 text-center text-xs text-ink-400">
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
/* Brand (form side)                                                   */
/* ------------------------------------------------------------------ */

function BrandBlock() {
  return (
    <Link
      href={ROUTES.landing}
      className="mb-7 flex items-center gap-2.5 lg:hidden"
      aria-label="Kembali ke beranda ifNote"
    >
      <span
        aria-hidden
        className="grid h-10 w-10 place-items-center rounded-2xl bg-accent-gradient font-jp text-xl text-white shadow-glow-sm"
      >
        ノ
      </span>
      <span className="text-lg font-semibold tracking-tight text-ink-800 dark:text-paper-50">
        {APP_NAME}
      </span>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/* Visual panel (desktop)                                              */
/* ------------------------------------------------------------------ */

function VisualPanel() {
  return (
    <aside className="relative hidden flex-col overflow-hidden bg-accent-gradient p-10 text-white lg:flex">
      {/* darkening gradient for legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-black/10" />
      <FloatingPaths position={1} />
      <FloatingPaths position={-1} />

      {/* brand top */}
      <Link href={ROUTES.landing} className="relative z-10 flex items-center gap-2.5" aria-label="Beranda ifNote">
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white/15 font-jp text-xl backdrop-blur-sm ring-1 ring-white/25">
          ノ
        </span>
        <span className="text-lg font-semibold tracking-tight">{APP_NAME}</span>
      </Link>

      {/* center kana */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center">
        <motion.span
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE }}
          className="font-jp text-[7rem] font-bold leading-none drop-shadow-sm"
        >
          日本語
        </motion.span>
        <motion.span
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.7, delay: 0.25, ease: EASE }}
          className="mt-5 h-1 w-24 origin-center rounded-full bg-white/70"
        />
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35, ease: EASE }}
          className="mt-5 font-jp text-sm tracking-[0.3em] text-white/85"
        >
          ことば・ぶんぽう・あんき
        </motion.p>
      </div>

      {/* quote bottom */}
      <blockquote className="relative z-10 max-w-sm space-y-2">
        <p className="text-lg leading-relaxed">
          “Catat bahasa Jepang dengan tenang — kotoba, bunpou, hafalan, dan AI tutor
          dalam satu tempat.”
        </p>
        <footer className="font-jp text-sm text-white/80">— 静かに学ぶ · {APP_NAME}</footer>
      </blockquote>
    </aside>
  );
}

/* ------------------------------------------------------------------ */
/* Animated floating SVG paths (MCP AuthPage) — accent on gradient     */
/* ------------------------------------------------------------------ */

function FloatingPaths({ position }: { position: number }) {
  const reduce = useReducedMotion();
  const paths = Array.from({ length: 24 }, (_, i) => ({
    id: i,
    d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${380 - i * 5 * position} -${
      189 + i * 6
    } -${312 - i * 5 * position} ${216 - i * 6} ${152 - i * 5 * position} ${
      343 - i * 6
    }C${616 - i * 5 * position} ${470 - i * 6} ${684 - i * 5 * position} ${
      875 - i * 6
    } ${684 - i * 5 * position} ${875 - i * 6}`,
    width: 0.5 + i * 0.03,
  }));

  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      <svg className="h-full w-full text-white" viewBox="0 0 696 316" fill="none">
        {paths.map((path) => (
          <motion.path
            key={path.id}
            d={path.d}
            stroke="currentColor"
            strokeWidth={path.width}
            strokeOpacity={0.08 + path.id * 0.02}
            initial={{ pathLength: 0.3, opacity: 0.5 }}
            animate={
              reduce
                ? { opacity: 0.4 }
                : { pathLength: 1, opacity: [0.2, 0.5, 0.2], pathOffset: [0, 1, 0] }
            }
            transition={{
              duration: 20 + Math.random() * 10,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        ))}
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Subtle kana on the form side                                        */
/* ------------------------------------------------------------------ */

function FormKana() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 select-none overflow-hidden lg:hidden">
      <span className="absolute left-[6%] top-[10%] font-jp text-[130px] leading-none text-accent-500/[0.05]">
        あ
      </span>
      <span className="absolute bottom-[8%] right-[6%] font-jp text-[120px] leading-none text-lilac-500/[0.06]">
        の
      </span>
    </div>
  );
}

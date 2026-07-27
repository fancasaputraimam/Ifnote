"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { BookText, SquareStack, Target, ArrowUpRight } from "lucide-react";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface Props {
  kotoba: number;
  bunpou: number;
  /** Rata-rata lastScore semua tipe quiz (0–100). Null = belum ada quiz. */
  quizScore: number | null;
  /** Total soal quiz yang pernah dijawab. */
  quizAnswered: number;
}

/**
 * Home stats (Sumi & Washi). Tiga kartu: Kotoba, Bunpou (→ Catatan) dan
 * Skor Quiz (→ Quiz). Garis margin merah ala buku latihan, angka besar
 * serif, kana watermark.
 */
export function StatsGrid({ kotoba, bunpou, quizScore, quizAnswered }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
      <StatCard
        href={ROUTES.app.catatan}
        Icon={BookText}
        kana="言"
        label="Kotoba"
        sub="kosakata tercatat"
        jp="ことば"
        value={String(kotoba)}
        tone="accent"
        delay={0}
      />
      <StatCard
        href={ROUTES.app.catatan}
        Icon={SquareStack}
        kana="文"
        label="Bunpou"
        sub="pola tata bahasa"
        jp="ぶんぽう"
        value={String(bunpou)}
        tone="lilac"
        delay={0.06}
      />
      <StatCard
        href={ROUTES.app.quiz}
        Icon={Target}
        kana="試"
        label="Akurasi Quiz"
        sub={
          quizAnswered > 0
            ? `${quizAnswered} soal dijawab`
            : "belum ada quiz — coba yuk"
        }
        jp="クイズ"
        value={quizScore !== null ? String(quizScore) : "—"}
        tone="leaf"
        delay={0.12}
        className="col-span-2 sm:col-span-1"
      />
    </div>
  );
}

const TONE: Record<
  "accent" | "lilac" | "leaf",
  { chip: string; value: string; line: string }
> = {
  accent: {
    chip: "bg-accent-50 text-accent-600 ring-accent-200/70 dark:bg-accent-500/15 dark:text-accent-200 dark:ring-accent-400/25",
    value: "text-accent-700 dark:text-accent-200",
    line: "bg-accent-500/25",
  },
  lilac: {
    chip: "bg-lilac-50 text-lilac-600 ring-lilac-200/70 dark:bg-lilac-500/15 dark:text-lilac-300 dark:ring-lilac-400/25",
    value: "text-lilac-700 dark:text-lilac-300",
    line: "bg-lilac-500/25",
  },
  leaf: {
    chip: "bg-leaf-50 text-leaf-600 ring-leaf-200/70 dark:bg-leaf-500/15 dark:text-leaf-300 dark:ring-leaf-400/25",
    value: "text-leaf-700 dark:text-leaf-300",
    line: "bg-leaf-500/25",
  },
};

function StatCard({
  href,
  Icon,
  kana,
  label,
  sub,
  jp,
  value,
  tone,
  delay,
  className,
}: {
  href: string;
  Icon: typeof BookText;
  kana: string;
  label: string;
  sub: string;
  jp: string;
  value: string;
  tone: "accent" | "lilac" | "leaf";
  delay: number;
  className?: string;
}) {
  const t = TONE[tone];
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 0.61, 0.36, 1] }}
      className={className}
    >
      <Link
        href={href}
        className="group relative block overflow-hidden rounded-notebook bg-white p-4 shadow-notebook ring-1 ring-paper-200/90 transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-notebook-md dark:bg-ink-800 dark:ring-ink-700 sm:p-5"
      >
        {/* garis margin ala buku latihan */}
        <span aria-hidden className={cn("absolute inset-y-4 left-3 w-px", t.line)} />
        <span
          aria-hidden
          className="pointer-events-none absolute -bottom-4 -right-1 select-none font-jp text-7xl leading-none text-ink-800/[0.04] transition-transform duration-300 group-hover:scale-110 dark:text-paper-50/[0.04]"
        >
          {kana}
        </span>

        <div className="relative pl-3">
          <div className="flex items-center justify-between">
            <span className={cn("grid h-10 w-10 place-items-center rounded-xl ring-1 ring-inset", t.chip)}>
              <Icon className="h-5 w-5" />
            </span>
            <ArrowUpRight className="h-4 w-4 text-ink-300 transition-colors group-hover:text-ink-500 dark:text-ink-600 dark:group-hover:text-paper-50" />
          </div>
          <div className={cn("mt-3 font-serif text-4xl font-semibold leading-none tracking-tight tabular-nums", t.value)}>
            {value}
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-sm font-medium text-ink-800 dark:text-paper-50">{label}</span>
            <span className="font-jp text-[10px] tracking-[0.2em] text-ink-400/70">{jp}</span>
          </div>
          <div className="text-xs text-ink-400">{sub}</div>
        </div>
      </Link>
    </motion.div>
  );
}

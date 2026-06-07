"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { BookText, SquareStack, ArrowUpRight } from "lucide-react";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface Props {
  kotoba: number;
  bunpou: number;
}

/**
 * Home stats (ifNote 2.0). Dua kartu statistik premium: jumlah Kotoba &
 * Bunpou dengan angka besar, ikon, kana watermark, dan hover-lift. Tetap
 * mengarah ke Catatan saat diklik.
 */
export function StatsGrid({ kotoba, bunpou }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4">
      <StatCard
        href={ROUTES.app.catatan}
        Icon={BookText}
        kana="言"
        label="Kotoba"
        sub="kosakata"
        value={kotoba}
        tone="accent"
        delay={0}
      />
      <StatCard
        href={ROUTES.app.catatan}
        Icon={SquareStack}
        kana="文"
        label="Bunpou"
        sub="tata bahasa"
        value={bunpou}
        tone="lilac"
        delay={0.06}
      />
    </div>
  );
}

const TONE: Record<
  "accent" | "lilac",
  { chip: string; value: string; glow: string }
> = {
  accent: {
    chip: "bg-accent-50 text-accent-600 ring-accent-200/70 dark:bg-accent-500/15 dark:text-accent-200 dark:ring-accent-400/25",
    value: "text-accent-700 dark:text-accent-200",
    glow: "before:bg-accent-300/20",
  },
  lilac: {
    chip: "bg-lilac-50 text-lilac-600 ring-lilac-200/70 dark:bg-lilac-500/15 dark:text-lilac-300 dark:ring-lilac-400/25",
    value: "text-lilac-700 dark:text-lilac-300",
    glow: "before:bg-lilac-300/20",
  },
};

function StatCard({
  href,
  Icon,
  kana,
  label,
  sub,
  value,
  tone,
  delay,
}: {
  href: string;
  Icon: typeof BookText;
  kana: string;
  label: string;
  sub: string;
  value: number;
  tone: "accent" | "lilac";
  delay: number;
}) {
  const t = TONE[tone];
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 0.61, 0.36, 1] }}
    >
      <Link
        href={href}
        className={cn(
          "group relative block overflow-hidden rounded-notebook bg-white p-4 shadow-notebook ring-1 ring-paper-200/90 transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-notebook-md dark:bg-ink-800 dark:ring-ink-700 sm:p-5",
          "before:pointer-events-none before:absolute before:-right-8 before:-top-8 before:h-24 before:w-24 before:rounded-full before:blur-2xl before:content-['']",
          t.glow,
        )}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute -bottom-4 -right-1 select-none font-jp text-7xl leading-none text-ink-800/[0.04] transition-transform duration-300 group-hover:scale-110 dark:text-paper-50/[0.04]"
        >
          {kana}
        </span>
        <div className="relative flex items-center justify-between">
          <span className={cn("grid h-10 w-10 place-items-center rounded-xl ring-1 ring-inset", t.chip)}>
            <Icon className="h-5 w-5" />
          </span>
          <ArrowUpRight className="h-4 w-4 text-ink-300 transition-colors group-hover:text-ink-500 dark:text-ink-600 dark:group-hover:text-paper-50" />
        </div>
        <div className={cn("relative mt-3 text-3xl font-bold tracking-tight tabular-nums", t.value)}>
          {value}
        </div>
        <div className="relative mt-0.5 text-sm font-medium text-ink-800 dark:text-paper-50">
          {label}
        </div>
        <div className="relative text-xs text-ink-400">{sub}</div>
      </Link>
    </motion.div>
  );
}

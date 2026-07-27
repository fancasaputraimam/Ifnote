"use client";

import { cn } from "@/lib/utils";

interface AiLoadingProps {
  /** Headline. Defaults to a friendly Indonesian message. */
  title?: string;
  /** Secondary line. Defaults to "Tunggu sebentar ya." */
  description?: string;
  /** Compact variant for tight spaces (e.g. inside a row/card). */
  compact?: boolean;
  className?: string;
}

/**
 * AiLoading — panel loading AI bergaya "Sumi & Washi": ensō (lingkaran
 * kuas zen) yang berputar dengan kanji 知 berdenyut di tengahnya, di atas
 * kertas washi dengan garis margin merah, plus titik-titik "berpikir"
 * ala tinta.
 *
 * Use this for AI actions only (analyze, explain, bulk import, sakubun
 * generate, kanji AI lookup). Don't use for plain page/list fetches —
 * those keep the lightweight `LoadingState` spinner.
 *
 * SSR-safe (CSS only) dan menghormati prefers-reduced-motion.
 */
export function AiLoading({
  title = "AI sedang menganalisa…",
  description = "Tunggu sebentar ya.",
  compact = false,
  className,
}: AiLoadingProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "relative flex items-center overflow-hidden",
        "rounded-notebook border border-paper-200 bg-paper-50/70",
        "shadow-notebook dark:border-ink-700 dark:bg-ink-800/80",
        compact ? "gap-3 p-3 pl-5" : "gap-4 p-4 pl-6 sm:p-5 sm:pl-7",
        className,
      )}
    >
      {/* garis margin merah ala buku latihan */}
      <span aria-hidden className="absolute inset-y-2.5 left-2 w-px bg-accent-500/25" />
      <span aria-hidden className="absolute inset-y-2.5 left-[11px] w-px bg-accent-500/10" />
      {/* watermark kana */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-2 -top-4 select-none font-jp text-6xl leading-none text-ink-800/[0.04] dark:text-paper-50/[0.04]"
      >
        知
      </span>

      <EnsoSpinner compact={compact} />

      <div className="relative min-w-0 flex-1">
        <p
          className={cn(
            "font-semibold leading-snug text-ink-800 dark:text-paper-50",
            compact ? "text-sm" : "text-base",
          )}
        >
          {title}
        </p>
        {description ? (
          <p className={cn("mt-0.5 text-ink-400", compact ? "text-xs" : "text-sm")}>
            {description}
          </p>
        ) : null}
        <ThinkingDots compact={compact} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Ensō spinner — lingkaran kuas terbuka yang berputar, 知 di tengah    */
/* ------------------------------------------------------------------ */

function EnsoSpinner({ compact }: { compact?: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "relative grid shrink-0 place-items-center",
        compact ? "h-9 w-9" : "h-12 w-12",
      )}
    >
      <svg
        viewBox="0 0 48 48"
        fill="none"
        className="absolute inset-0 h-full w-full animate-[spin_1.6s_linear_infinite] text-accent-500 motion-reduce:animate-none"
      >
        {/* ensō: lingkaran dengan celah, ujung membulat seperti kuas */}
        <circle
          cx="24"
          cy="24"
          r="19"
          stroke="currentColor"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeDasharray="96 24"
        />
        {/* bayangan tinta tipis di belakang */}
        <circle cx="24" cy="24" r="19" stroke="currentColor" strokeOpacity="0.15" strokeWidth="4.5" />
      </svg>
      <span
        className={cn(
          "relative animate-pulse font-serif text-accent-600 dark:text-accent-300 motion-reduce:animate-none",
          compact ? "text-sm" : "text-lg",
        )}
      >
        知
      </span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Titik "berpikir" — tiga tetes tinta naik-turun bergantian            */
/* ------------------------------------------------------------------ */

function ThinkingDots({ compact }: { compact?: boolean }) {
  return (
    <span
      aria-hidden
      className={cn("mt-1.5 inline-flex items-center gap-1", compact && "mt-1")}
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="inline-block h-1 w-1 rounded-full bg-accent-400/80 dark:bg-accent-300/70"
          style={{ animation: `ifnote-dot 1.4s ease-in-out ${i * 0.18}s infinite` }}
        />
      ))}
      <span className="ml-1.5 select-none font-jp text-[9px] tracking-[0.28em] text-ink-400/70">
        かんがえちゅう
      </span>
    </span>
  );
}

"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { QuizType } from "@/lib/types";

interface Props {
  type: QuizType;
  /** Stats for the current session (in-memory, resets per quiz). */
  sessionCorrect: number;
  sessionWrong: number;
  /** Persisted lifetime stats from backend, optional. */
  lifetimeCorrect?: number;
  lifetimeWrong?: number;
  lifetimeTotal?: number;
  lastScore?: number | null;
}

/**
 * Strip progres quiz (Sumi & Washi): kertas washi bergaris margin merah,
 * akurasi serif besar, hitungan benar/salah bertitik warna, bar proporsi
 * hijau/merah untuk sesi berjalan, dan lifetime di kanan.
 */
export function ProgressStrip({
  type,
  sessionCorrect,
  sessionWrong,
  lifetimeCorrect,
  lifetimeTotal,
  lastScore,
}: Props) {
  const sessionTotal = sessionCorrect + sessionWrong;
  const sessionAcc =
    sessionTotal === 0 ? 0 : Math.round((sessionCorrect / sessionTotal) * 100);

  return (
    <div className="relative overflow-hidden rounded-notebook bg-white p-4 shadow-notebook ring-1 ring-paper-200/90 dark:bg-ink-800 dark:ring-ink-700">
      <span aria-hidden className="absolute inset-y-3.5 left-3 w-px bg-accent-500/25" />
      <span
        aria-hidden
        className="pointer-events-none absolute -right-3 -top-4 select-none font-jp text-6xl leading-none text-ink-800/[0.04] dark:text-paper-50/[0.04]"
      >
        試
      </span>

      <div className="relative flex flex-wrap items-center gap-x-4 gap-y-2 pl-3">
        <div className="min-w-0">
          <div className="flex items-baseline gap-1.5">
            <span className="font-serif text-2xl font-semibold leading-none tabular-nums text-ink-800 dark:text-paper-50">
              {sessionAcc}
              <span className="text-sm font-normal text-ink-400">%</span>
            </span>
            <span className="text-xs text-ink-400">
              akurasi sesi · <span className="font-jp tracking-[0.18em]">{type}</span>
            </span>
          </div>
          <div className="mt-1 flex items-center gap-3 text-xs text-ink-400">
            <span className="inline-flex items-center gap-1 tabular-nums">
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-leaf-500" />
              {sessionCorrect} benar
            </span>
            <span className="inline-flex items-center gap-1 tabular-nums">
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-rose-400" />
              {sessionWrong} salah
            </span>
          </div>
        </div>

        {typeof lifetimeTotal === "number" && lifetimeTotal > 0 ? (
          <div className="ml-auto text-right text-xs text-ink-400">
            <div>
              lifetime{" "}
              <span className="font-semibold tabular-nums text-ink-700 dark:text-paper-50">
                {lifetimeCorrect ?? 0}/{lifetimeTotal}
              </span>
            </div>
            {typeof lastScore === "number" ? (
              // Backend menghitung nilai ini dari SEMUA jawaban (bukan sesi
              // terakhir) — labelnya harus jujur.
              <div className="mt-0.5">
                akurasi keseluruhan{" "}
                <span className="font-semibold tabular-nums text-ink-700 dark:text-paper-50">
                  {lastScore}%
                </span>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* bar proporsi benar/salah sesi ini */}
      <div className="relative mt-3 flex h-1.5 overflow-hidden rounded-full bg-paper-100 dark:bg-ink-900/60">
        <motion.div
          className={cn("h-full bg-leaf-500", sessionWrong === 0 && "rounded-full")}
          initial={false}
          animate={{
            width: sessionTotal > 0 ? `${(sessionCorrect / sessionTotal) * 100}%` : "0%",
          }}
          transition={{ type: "spring", stiffness: 260, damping: 30 }}
        />
        <motion.div
          className="h-full bg-rose-400"
          initial={false}
          animate={{
            width: sessionTotal > 0 ? `${(sessionWrong / sessionTotal) * 100}%` : "0%",
          }}
          transition={{ type: "spring", stiffness: 260, damping: 30 }}
        />
      </div>
    </div>
  );
}

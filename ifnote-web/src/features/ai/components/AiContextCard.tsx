"use client";

import { Badge } from "@/components/ui/Badge";
import { NotebookCard } from "@/components/ui/NotebookCard";
import type { AiModeMeta } from "../modes";

interface Props {
  meta: AiModeMeta;
  /**
   * Last-known AI status reported by the backend response.
   *  - "configured" → at least one call returned source="ai"
   *  - "fallback"   → at least one call returned source="mock"
   *  - "unknown"    → no calls yet, or auth not yet completed
   */
  status: "configured" | "fallback" | "unknown";
}

export function AiContextCard({ meta, status }: Props) {
  return (
    <NotebookCard stripe={meta.tone} className="p-5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span aria-hidden className="text-xl">{meta.icon}</span>
            <h2 className="text-base font-semibold text-ink-800 dark:text-paper-50">
              {meta.title}
            </h2>
          </div>
          <p className="mt-1 text-xs text-ink-400">{meta.subtitle}</p>
        </div>
        <StatusBadge status={status} />
      </div>

      <dl className="mt-3 grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
        <div className="rounded-xl bg-paper-50/60 px-3 py-2 dark:bg-ink-900/30">
          <dt className="uppercase tracking-wide text-ink-400">Input yang diharapkan</dt>
          <dd className="mt-0.5 text-ink-700 dark:text-paper-50">{meta.inputLabel}</dd>
        </div>
        <div className="rounded-xl bg-paper-50/60 px-3 py-2 dark:bg-ink-900/30">
          <dt className="uppercase tracking-wide text-ink-400">Output yang dihasilkan</dt>
          <dd className="mt-0.5 text-ink-700 dark:text-paper-50">{meta.outputLabel}</dd>
        </div>
      </dl>
    </NotebookCard>
  );
}

function StatusBadge({ status }: { status: "configured" | "fallback" | "unknown" }) {
  if (status === "configured") return <Badge tone="leaf">AI aktif</Badge>;
  if (status === "fallback") return <Badge tone="warn">Mock fallback</Badge>;
  return <Badge tone="neutral">AI belum tersedia</Badge>;
}

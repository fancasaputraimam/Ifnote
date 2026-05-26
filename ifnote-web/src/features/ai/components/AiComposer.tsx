"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { AiModeMeta } from "../modes";

interface Props {
  meta: AiModeMeta;
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  submitting?: boolean;
  /** When true, focus the textarea on mount and on mode change. */
  autoFocus?: boolean;
}

export function AiComposer({ meta, value, onChange, onSubmit, submitting, autoFocus }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, [meta.key, autoFocus]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl/Cmd+Enter submits, Enter alone in single-line modes also submits
    if (
      (e.key === "Enter" && (e.ctrlKey || e.metaKey)) ||
      (e.key === "Enter" && !meta.multiline && !e.shiftKey)
    ) {
      e.preventDefault();
      if (value.trim().length > 0) onSubmit();
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium uppercase tracking-wide text-ink-400">
        {meta.inputLabel}
      </label>
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={meta.placeholder}
        rows={meta.multiline ? 6 : 2}
        className={cn(
          "block w-full resize-y rounded-xl border bg-white px-3 py-2 text-sm transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-accent-400",
          "dark:bg-ink-800 dark:text-paper-50",
          "placeholder:text-ink-400/70",
          "border-paper-200 dark:border-ink-700",
        )}
      />
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] text-ink-400">
          {meta.multiline ? "Ctrl/Cmd + Enter untuk kirim" : "Tekan Enter untuk kirim"}
        </p>
        <Button onClick={onSubmit} loading={submitting} disabled={value.trim().length === 0}>
          {meta.key === "bulk-kotoba" ? "Analisa daftar" : "Tanya AI"}
        </Button>
      </div>
    </div>
  );
}

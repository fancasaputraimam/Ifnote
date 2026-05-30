"use client";

/**
 * AiPromptInput — kotak input bergaya "prompt AI" untuk Tambah Kotoba /
 * Bunpou. Terinspirasi PromptInputBox tapi disesuaikan tema ifNote
 * (paper/ink/accent, terbaca di light & dark) dan TANPA fitur chat yang
 * tidak relevan (upload, mic, voice, canvas, search, dll).
 *
 * Fitur:
 *  - textarea autosize (Enter submit, Shift+Enter newline)
 *  - tombol submit bundar dengan ArrowUp + loading (LoaderGrid)
 *  - footer slot untuk helper/counter/chips
 *  - tooltip submit via title + CSS (tanpa dependency tambahan)
 *
 * SSR-safe: tidak ada akses `document` di module top-level, tidak ada
 * injeksi <style> manual (scrollbar diatur lewat class di globals.css).
 */

import {
  useEffect,
  useRef,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { ArrowUp } from "lucide-react";
import LoaderGrid from "@/components/ui/loader-grid";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  /** True saat AI sedang memproses — kunci input + tombol. */
  loading?: boolean;
  /** True kalau submit tidak boleh (mis. kosong / over limit). */
  submitDisabled?: boolean;
  placeholder?: string;
  /** aria-label + tooltip untuk tombol submit. */
  submitLabel?: string;
  /** Label aksesibilitas untuk textarea. */
  ariaLabel?: string;
  /** Tinggi maksimum autosize (px). Default 240. */
  maxHeight?: number;
  autoFocus?: boolean;
  /** Slot bawah: helper, counter, chips, error. */
  footer?: ReactNode;
}

export function AiPromptInput({
  value,
  onChange,
  onSubmit,
  loading = false,
  submitDisabled = false,
  placeholder,
  submitLabel = "Analisa pakai AI",
  ariaLabel = "Input untuk dianalisa AI",
  maxHeight = 240,
  autoFocus,
  footer,
}: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

  // Autosize: reset lalu set ke scrollHeight (capped).
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
  }, [value, maxHeight]);

  const canSubmit = !loading && !submitDisabled && value.trim().length > 0;

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (canSubmit) onSubmit();
    }
  };

  return (
    <div
      className={cn(
        "ai-prompt-input rounded-3xl border bg-white p-2 shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300",
        "dark:bg-ink-800",
        loading
          ? "border-accent-400 ring-2 ring-accent-400/30"
          : "border-paper-200 focus-within:border-accent-400 focus-within:ring-2 focus-within:ring-accent-400/30 dark:border-ink-700",
      )}
    >
      <div className="flex items-end gap-2">
        <textarea
          ref={ref}
          rows={2}
          value={value}
          disabled={loading}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          aria-label={ariaLabel}
          autoFocus={autoFocus}
          className={cn(
            "block min-h-[44px] flex-1 resize-none bg-transparent px-2 py-2 text-sm text-ink-800 placeholder:text-ink-400 focus:outline-none",
            "dark:text-paper-50 dark:placeholder:text-ink-400/70",
            "disabled:opacity-60",
          )}
          style={{ maxHeight }}
        />
        <button
          type="button"
          onClick={() => canSubmit && onSubmit()}
          disabled={!canSubmit}
          aria-label={submitLabel}
          title={submitLabel}
          className={cn(
            "group relative grid h-9 w-9 shrink-0 place-items-center rounded-full transition-all",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400",
            canSubmit
              ? "bg-accent-500 text-white hover:bg-accent-600"
              : "cursor-not-allowed bg-paper-200 text-ink-400 dark:bg-ink-700",
          )}
        >
          {loading ? (
            <LoaderGrid label={submitLabel} className="text-[0.32rem]" />
          ) : (
            <ArrowUp className="h-4 w-4" strokeWidth={2.5} />
          )}
          {/* Tooltip CSS-only (tanpa dependency). */}
          <span
            role="tooltip"
            className="pointer-events-none absolute -top-9 right-0 whitespace-nowrap rounded-md border border-paper-200 bg-white px-2 py-1 text-[11px] text-ink-700 opacity-0 shadow-sm transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100 dark:border-ink-700 dark:bg-ink-800 dark:text-paper-50"
          >
            {submitLabel}
          </span>
        </button>
      </div>
      {footer ? <div className="px-1 pt-1.5">{footer}</div> : null}
    </div>
  );
}

/** Chip statis kecil untuk hint di dalam dialog (mis. "1 kata", "Banyak"). */
export function PromptChip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-paper-100 px-2 py-0.5 text-[11px] font-medium text-ink-500 dark:bg-ink-700 dark:text-paper-50/70">
      {children}
    </span>
  );
}

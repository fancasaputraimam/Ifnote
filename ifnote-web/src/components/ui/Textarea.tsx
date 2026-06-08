"use client";

import { TextareaHTMLAttributes, forwardRef, useId } from "react";
import { cn } from "@/lib/utils";

interface Props extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

/**
 * Labeled textarea (ifNote 2.0) — same ring/focus language as TextInput.
 */
export const Textarea = forwardRef<HTMLTextAreaElement, Props>(function Textarea(
  { label, error, hint, className, id: idProp, ...rest },
  ref,
) {
  const autoId = useId();
  const id = idProp ?? autoId;
  return (
    <label className="block">
      {label ? (
        <span className="mb-1.5 block text-sm font-medium text-ink-700 dark:text-paper-50">
          {label}
        </span>
      ) : null}
      <textarea
        ref={ref}
        id={id}
        className={cn(
          "block w-full resize-y rounded-xl bg-white px-3.5 py-2.5 text-sm text-ink-800 shadow-sm ring-1 ring-inset transition-[box-shadow,background-color]",
          "placeholder:text-ink-400/80",
          "focus:outline-none focus:ring-2 focus:ring-accent-400",
          "dark:bg-ink-800 dark:text-paper-50 dark:placeholder:text-ink-400/70",
          error
            ? "ring-rose-400 focus:ring-rose-400 dark:ring-rose-500"
            : "ring-paper-300 hover:ring-paper-400 dark:ring-ink-700 dark:hover:ring-ink-600",
          className,
        )}
        aria-invalid={!!error}
        {...rest}
      />
      {error ? (
        <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-ink-400">{hint}</p>
      ) : null}
    </label>
  );
});

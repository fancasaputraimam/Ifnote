"use client";

import { InputHTMLAttributes, forwardRef, useId } from "react";
import { cn } from "@/lib/utils";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

/**
 * Labeled text input (ifNote 2.0). Soft surface, hairline ring that lifts to
 * an accent ring on focus, calm error state. API unchanged.
 */
export const TextInput = forwardRef<HTMLInputElement, Props>(function TextInput(
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
      <input
        ref={ref}
        id={id}
        className={cn(
          // text-base di HP: di bawah 16px Safari iOS memperbesar layar saat input disentuh.
          "block min-h-11 w-full rounded-xl bg-white px-3.5 py-2.5 text-base text-ink-800 shadow-sm ring-1 ring-inset transition-[box-shadow,background-color] sm:text-sm",
          "placeholder:text-ink-400",
          "focus:outline-none focus:ring-2 focus:ring-accent-600 dark:focus:ring-accent-300",
          "dark:bg-ink-800 dark:text-paper-50 dark:placeholder:text-ink-300",
          // Border 3:1 terhadap latar (WCAG 1.4.11): ink-400/80 di putih 3.42, ink-400 di ink-800 3.40.
          error
            ? "ring-rose-400 focus:ring-rose-400 dark:ring-rose-500"
            : "ring-ink-400/80 hover:ring-ink-500 dark:ring-ink-400 dark:hover:ring-ink-300",
          className,
        )}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        {...rest}
      />
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-rose-600 dark:text-rose-400">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-ink-400">
          {hint}
        </p>
      ) : null}
    </label>
  );
});

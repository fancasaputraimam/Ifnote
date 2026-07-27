"use client";

import { SelectHTMLAttributes, forwardRef, useId } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
}

/**
 * Labeled native select (ifNote 2.0) — ring style + custom chevron, matches
 * TextInput. Keeps native `<option>` children for full form compatibility.
 */
export const Select = forwardRef<HTMLSelectElement, Props>(function Select(
  { label, error, hint, className, id: idProp, children, ...rest },
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
      <div className="relative">
        <select
          ref={ref}
          id={id}
          className={cn(
            "block w-full appearance-none rounded-xl bg-white px-3.5 py-2.5 pr-10 text-sm text-ink-800 shadow-sm ring-1 ring-inset transition-[box-shadow,background-color]",
            "focus:outline-none focus:ring-2 focus:ring-accent-400",
            "dark:bg-ink-800 dark:text-paper-50",
            error
              ? "ring-rose-400 focus:ring-rose-400 dark:ring-rose-500"
              : "ring-paper-300 hover:ring-paper-400 dark:ring-ink-700 dark:hover:ring-ink-600",
            className,
          )}
          aria-invalid={!!error}
          {...rest}
        >
          {children}
        </select>
        <ChevronDown
          aria-hidden
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
        />
      </div>
      {error ? (
        <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-ink-400">{hint}</p>
      ) : null}
    </label>
  );
});

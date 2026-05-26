"use client";

import { InputHTMLAttributes, forwardRef, useId } from "react";
import { cn } from "@/lib/utils";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const TextInput = forwardRef<HTMLInputElement, Props>(function TextInput(
  { label, error, hint, className, id: idProp, ...rest },
  ref,
) {
  const autoId = useId();
  const id = idProp ?? autoId;
  return (
    <label className="block">
      {label ? (
        <span className="mb-1 block text-sm font-medium text-ink-700 dark:text-paper-50">{label}</span>
      ) : null}
      <input
        ref={ref}
        id={id}
        className={cn(
          "block w-full rounded-xl border bg-white px-3 py-2 text-sm text-ink-800 transition-colors",
          "placeholder:text-ink-400",
          "focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-accent-400",
          "dark:bg-ink-800 dark:text-paper-50 dark:placeholder:text-ink-400/70",
          error
            ? "border-rose-400 dark:border-rose-500"
            : "border-paper-200 dark:border-ink-700",
          className,
        )}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        {...rest}
      />
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-xs text-rose-600 dark:text-rose-400">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1 text-xs text-ink-400">
          {hint}
        </p>
      ) : null}
    </label>
  );
});

"use client";

import { InputHTMLAttributes, forwardRef, useId, useState } from "react";
import { cn } from "@/lib/utils";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

/**
 * Password input dengan toggle lihat/sembunyi. Styling mengikuti TextInput
 * (surface, hairline ring, error state) supaya form tetap satu bahasa visual.
 * `type` dikelola internal — jangan dioper dari luar.
 */
export const PasswordInput = forwardRef<HTMLInputElement, Props>(function PasswordInput(
  { label, error, hint, className, id: idProp, ...rest },
  ref,
) {
  const [visible, setVisible] = useState(false);
  const autoId = useId();
  const id = idProp ?? autoId;
  return (
    <div>
      {label ? (
        <label
          htmlFor={id}
          className="mb-1.5 block text-sm font-medium text-ink-700 dark:text-paper-50"
        >
          {label}
        </label>
      ) : null}
      <div className="relative">
        <input
          ref={ref}
          id={id}
          type={visible ? "text" : "password"}
          className={cn(
            "block w-full rounded-xl bg-white py-2.5 pl-3.5 pr-11 text-sm text-ink-800 shadow-sm ring-1 ring-inset transition-[box-shadow,background-color]",
            "placeholder:text-ink-400/80",
            "focus:outline-none focus:ring-2 focus:ring-accent-400",
            "dark:bg-ink-800 dark:text-paper-50 dark:placeholder:text-ink-400/70",
            error
              ? "ring-rose-400 focus:ring-rose-400 dark:ring-rose-500"
              : "ring-paper-300 hover:ring-paper-400 dark:ring-ink-700 dark:hover:ring-ink-600",
            className,
          )}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          {...rest}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Sembunyikan password" : "Tampilkan password"}
          aria-pressed={visible}
          tabIndex={-1}
          className="absolute right-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-ink-400 transition hover:bg-paper-100 hover:text-ink-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 dark:hover:bg-ink-700 dark:hover:text-paper-50"
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-rose-600 dark:text-rose-400">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-ink-400">
          {hint}
        </p>
      ) : null}
    </div>
  );
});

function EyeIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9.9 4.24A9.1 9.1 0 0 1 12 4c6.5 0 10 7 10 7a13.2 13.2 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.5 13.5 0 0 0 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.39-1.61" />
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="m2 2 20 20" />
    </svg>
  );
}

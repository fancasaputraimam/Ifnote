"use client";

import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void;
}

export const SearchInput = forwardRef<HTMLInputElement, Props>(function SearchInput(
  { className, onClear, value, ...rest },
  ref,
) {
  return (
    <div className="relative">
      <span aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400">
        🔍
      </span>
      <input
        ref={ref}
        type="search"
        value={value}
        className={cn(
          "block w-full rounded-full border bg-white py-2 pl-9 pr-9 text-sm text-ink-800",
          "placeholder:text-ink-400 border-paper-200 focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-accent-400",
          "dark:bg-ink-800 dark:text-paper-50 dark:border-ink-700",
          className,
        )}
        {...rest}
      />
      {value && onClear ? (
        <button
          type="button"
          onClick={onClear}
          aria-label="Hapus pencarian"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-ink-400 hover:bg-paper-100 dark:hover:bg-ink-700"
        >
          ✕
        </button>
      ) : null}
    </div>
  );
});

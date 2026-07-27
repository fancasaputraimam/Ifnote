"use client";

import { InputHTMLAttributes, forwardRef } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void;
}

/**
 * Rounded search field (ifNote 2.0). Lucide search/clear icons, hairline
 * ring → accent ring on focus. API unchanged.
 */
export const SearchInput = forwardRef<HTMLInputElement, Props>(function SearchInput(
  { className, onClear, value, ...rest },
  ref,
) {
  return (
    <div className="relative">
      <Search
        aria-hidden
        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
      />
      <input
        ref={ref}
        type="search"
        value={value}
        className={cn(
          "block w-full rounded-full bg-white py-2.5 pl-10 pr-10 text-sm text-ink-800 shadow-sm ring-1 ring-inset ring-paper-300 transition-[box-shadow]",
          "placeholder:text-ink-400/80 hover:ring-paper-400 focus:outline-none focus:ring-2 focus:ring-accent-400",
          "dark:bg-ink-800 dark:text-paper-50 dark:ring-ink-700 dark:hover:ring-ink-600",
          className,
        )}
        {...rest}
      />
      {value && onClear ? (
        <button
          type="button"
          onClick={onClear}
          aria-label="Hapus pencarian"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-ink-400 transition-colors hover:bg-paper-100 hover:text-ink-700 dark:hover:bg-ink-700 dark:hover:text-paper-50"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  );
});

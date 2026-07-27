"use client";

import { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

export function FilterButton({ active, className, children, ...rest }: Props) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium border transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400",
        active
          ? "border-accent-500 bg-accent-50 text-accent-700 dark:bg-accent-700/30 dark:border-accent-400 dark:text-accent-200"
          : "border-paper-200 bg-white text-ink-700 hover:bg-paper-100 dark:bg-ink-800 dark:border-ink-700 dark:text-paper-50 dark:hover:bg-ink-700",
        className,
      )}
      aria-pressed={active}
      {...rest}
    >
      {children}
    </button>
  );
}

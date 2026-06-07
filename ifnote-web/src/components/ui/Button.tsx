"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "ghost" | "danger" | "secondary";
type Size = "sm" | "md" | "lg";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

/**
 * ifNote button. Redesigned (ifNote 2.0): primary uses the accent gradient
 * with a soft glow, secondary/ghost are crisp & calm, all share a refined
 * focus ring and a subtle press/scale micro-interaction.
 *
 * Public API unchanged (variant / size / loading) so every call site keeps
 * working.
 */
export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = "primary", size = "md", loading, className, disabled, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "group relative inline-flex select-none items-center justify-center gap-2 rounded-full font-medium",
        "transition-[transform,background-color,color,box-shadow,opacity] duration-200 ease-out",
        "active:scale-[0.97] motion-reduce:active:scale-100 motion-reduce:transition-none",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-paper-50 dark:focus-visible:ring-offset-paper-900",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 disabled:shadow-none",
        size === "sm" && "px-3.5 py-1.5 text-sm",
        size === "md" && "px-5 py-2.5 text-sm",
        size === "lg" && "px-6 py-3 text-base",
        variant === "primary" &&
          "bg-accent-gradient text-white shadow-glow-sm hover:shadow-glow hover:-translate-y-px active:translate-y-0",
        variant === "secondary" &&
          "bg-white text-ink-800 ring-1 ring-inset ring-paper-300 hover:bg-paper-100 hover:ring-paper-400 dark:bg-ink-800 dark:text-paper-50 dark:ring-ink-700 dark:hover:bg-ink-700",
        variant === "ghost" &&
          "bg-transparent text-ink-700 hover:bg-paper-100 dark:text-paper-50 dark:hover:bg-ink-700/70",
        variant === "danger" &&
          "bg-rose-500 text-white shadow-[0_4px_14px_-4px_rgba(244,63,94,0.5)] hover:bg-rose-600 hover:-translate-y-px active:translate-y-0",
        className,
      )}
      {...rest}
    >
      {loading ? (
        <span
          className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden
        />
      ) : null}
      {children}
    </button>
  );
});

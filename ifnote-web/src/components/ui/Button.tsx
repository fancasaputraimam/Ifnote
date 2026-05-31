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

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = "primary", size = "md", loading, className, disabled, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-medium",
        "transition-[transform,background-color,color,box-shadow] duration-150 ease-out",
        "active:scale-[0.96] motion-reduce:active:scale-100 motion-reduce:transition-none",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 focus-visible:ring-offset-paper-50 dark:focus-visible:ring-offset-paper-900",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
        size === "sm" && "px-3 py-1.5 text-sm",
        size === "md" && "px-4 py-2 text-sm",
        size === "lg" && "px-6 py-3 text-base",
        variant === "primary" && "bg-accent-500 text-white hover:bg-accent-600 active:bg-accent-700",
        variant === "secondary" && "bg-paper-200 text-ink-800 hover:bg-paper-200/70 dark:bg-ink-700 dark:text-paper-50 dark:hover:bg-ink-600",
        variant === "ghost" && "bg-transparent text-ink-700 hover:bg-paper-100 dark:text-paper-50 dark:hover:bg-ink-700",
        variant === "danger" && "bg-rose-500 text-white hover:bg-rose-600",
        className,
      )}
      {...rest}
    >
      {loading ? (
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />
      ) : null}
      {children}
    </button>
  );
});

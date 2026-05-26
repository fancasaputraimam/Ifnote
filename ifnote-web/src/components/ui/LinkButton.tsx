"use client";

import Link from "next/link";
import { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

interface Props extends Omit<ComponentProps<typeof Link>, "className"> {
  variant?: Variant;
  size?: Size;
  className?: string;
}

/**
 * Visually identical to <Button> but renders as <Link> so Next.js
 * can prefetch the target. Use for navigation; use Button for actions.
 */
export function LinkButton({
  variant = "primary",
  size = "md",
  className,
  children,
  ...rest
}: Props) {
  return (
    <Link
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 focus-visible:ring-offset-paper-50 dark:focus-visible:ring-offset-paper-900",
        size === "sm" && "px-3 py-1.5 text-sm",
        size === "md" && "px-4 py-2 text-sm",
        size === "lg" && "px-6 py-3 text-base",
        variant === "primary" && "bg-accent-500 text-white hover:bg-accent-600 active:bg-accent-700",
        variant === "secondary" && "bg-paper-200 text-ink-800 hover:bg-paper-200/70 dark:bg-ink-700 dark:text-paper-50 dark:hover:bg-ink-600",
        variant === "ghost" && "bg-transparent text-ink-700 hover:bg-paper-100 dark:text-paper-50 dark:hover:bg-ink-700",
        className,
      )}
      {...rest}
    >
      {children}
    </Link>
  );
}

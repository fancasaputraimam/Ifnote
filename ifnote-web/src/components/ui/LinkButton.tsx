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
        "group relative inline-flex select-none items-center justify-center gap-2 rounded-full font-medium",
        "transition-[transform,background-color,color,box-shadow] duration-200 ease-out",
        "active:scale-[0.97] motion-reduce:active:scale-100 motion-reduce:transition-none",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-paper-50 dark:focus-visible:ring-offset-paper-900",
        size === "sm" && "px-3.5 py-1.5 text-sm",
        size === "md" && "px-5 py-2.5 text-sm",
        size === "lg" && "px-6 py-3 text-base",
        variant === "primary" &&
          "bg-accent-gradient text-white shadow-glow-sm hover:shadow-glow hover:-translate-y-px active:translate-y-0",
        variant === "secondary" &&
          "bg-white text-ink-800 ring-1 ring-inset ring-paper-300 hover:bg-paper-100 hover:ring-paper-400 dark:bg-ink-800 dark:text-paper-50 dark:ring-ink-700 dark:hover:bg-ink-700",
        variant === "ghost" &&
          "bg-transparent text-ink-700 hover:bg-paper-100 dark:text-paper-50 dark:hover:bg-ink-700/70",
        className,
      )}
      {...rest}
    >
      {children}
    </Link>
  );
}

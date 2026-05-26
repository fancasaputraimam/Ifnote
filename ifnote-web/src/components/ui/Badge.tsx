import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "accent" | "lilac" | "leaf" | "warn" | "danger";

interface Props extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  size?: "sm" | "md";
}

export function Badge({ tone = "neutral", size = "sm", className, children, ...rest }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-medium",
        size === "sm" && "px-2 py-0.5 text-[11px]",
        size === "md" && "px-2.5 py-1 text-xs",
        tone === "neutral" && "bg-paper-100 text-ink-700 dark:bg-ink-700 dark:text-paper-50",
        tone === "accent"  && "bg-accent-50 text-accent-700 dark:bg-accent-700/20 dark:text-accent-200",
        tone === "lilac"   && "bg-lilac-400/15 text-lilac-600 dark:text-lilac-400",
        tone === "leaf"    && "bg-leaf-500/15 text-leaf-600 dark:text-leaf-500",
        tone === "warn"    && "bg-amber-100 text-amber-800 dark:bg-amber-700/20 dark:text-amber-200",
        tone === "danger"  && "bg-rose-100 text-rose-700 dark:bg-rose-700/20 dark:text-rose-200",
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
}

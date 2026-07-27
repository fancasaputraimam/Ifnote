import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "accent" | "lilac" | "leaf" | "warn" | "danger";

interface Props extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  size?: "sm" | "md";
}

/**
 * Pill badge (ifNote 2.0). Soft tinted fills with a hairline ring so chips
 * read crisply on both the warm paper and dark surfaces. API unchanged.
 */
export function Badge({ tone = "neutral", size = "sm", className, children, ...rest }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-medium ring-1 ring-inset",
        size === "sm" && "px-2 py-0.5 text-[11px]",
        size === "md" && "px-2.5 py-1 text-xs",
        tone === "neutral" &&
          "bg-paper-100 text-ink-600 ring-paper-300/70 dark:bg-ink-700 dark:text-paper-50 dark:ring-ink-600",
        tone === "accent" &&
          "bg-accent-50 text-accent-700 ring-accent-200/70 dark:bg-accent-500/15 dark:text-accent-200 dark:ring-accent-400/30",
        tone === "lilac" &&
          "bg-lilac-50 text-lilac-700 ring-lilac-200/70 dark:bg-lilac-500/15 dark:text-lilac-300 dark:ring-lilac-400/30",
        tone === "leaf" &&
          "bg-leaf-50 text-leaf-700 ring-leaf-200/70 dark:bg-leaf-500/15 dark:text-leaf-300 dark:ring-leaf-400/30",
        tone === "warn" &&
          "bg-amber-50 text-amber-700 ring-amber-200/70 dark:bg-amber-500/15 dark:text-amber-200 dark:ring-amber-400/30",
        tone === "danger" &&
          "bg-rose-50 text-rose-700 ring-rose-200/70 dark:bg-rose-500/15 dark:text-rose-200 dark:ring-rose-400/30",
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
}

import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface Props extends HTMLAttributes<HTMLDivElement> {
  /** Render as a notebook page with subtle ruled-paper lines. */
  ruled?: boolean;
  /** Accent stripe at top edge — soft blue / lilac / leaf. */
  stripe?: "accent" | "lilac" | "leaf" | "none";
}

export function NotebookCard({ ruled, stripe = "none", className, children, ...rest }: Props) {
  return (
    <div
      className={cn(
        "relative rounded-notebook bg-white dark:bg-ink-800 shadow-notebook",
        "border border-paper-200/60 dark:border-ink-700",
        stripe === "accent" && "border-t-4 border-t-accent-400 dark:border-t-accent-500",
        stripe === "lilac"  && "border-t-4 border-t-lilac-400  dark:border-t-lilac-500",
        stripe === "leaf"   && "border-t-4 border-t-leaf-500   dark:border-t-leaf-600",
        ruled && "notebook-rule",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

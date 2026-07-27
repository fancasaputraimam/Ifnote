import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface Props extends HTMLAttributes<HTMLDivElement> {
  /** Render as a notebook page with subtle ruled-paper lines. */
  ruled?: boolean;
  /** Accent stripe at top edge — soft blue / lilac / leaf. */
  stripe?: "accent" | "lilac" | "leaf" | "none";
  /**
   * Visual elevation. "raised" = matching the landing-page hero card style
   * (kept as default). "flat" = thin border, no shadow — for nested cards
   * that should sit inside another raised card.
   */
  elevation?: "raised" | "flat";
}

/**
 * Reusable section-card shell for ifNote. Visual basis is the landing-page
 * "study card" template — soft warm container, soft ring, gentle elevated
 * shadow, dark-mode safe — which the PRD asks us to standardise across
 * Home, Catatan, Hafalan, and Quiz.
 *
 * Don't put a weekday/bar chart inside this shell; it's just the
 * container, not the analytics widget that landing previously had.
 */
export function NotebookCard({
  ruled,
  stripe = "none",
  elevation = "raised",
  className,
  children,
  ...rest
}: Props) {
  return (
    <div
      className={cn(
        "relative rounded-notebook bg-white dark:bg-ink-800",
        // Base ring + shadow ladder — "raised" matches the streak-card
        // template style on the landing page.
        elevation === "raised"
          ? "shadow-notebook-md ring-1 ring-paper-200/80 dark:ring-ink-700"
          : "shadow-notebook ring-1 ring-paper-200/60 dark:ring-ink-700",
        // Stripe accent kept as before, but only as a top border
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

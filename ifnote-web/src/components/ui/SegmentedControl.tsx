"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface SegmentOption<T extends string> {
  value: T;
  label: ReactNode;
}

interface Props<T extends string> {
  value: T;
  onChange: (v: T) => void;
  options: SegmentOption<T>[];
  /** Unique id so the animated pill doesn't bleed across instances. */
  layoutId: string;
  size?: "sm" | "md";
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
}

/**
 * Animated segmented control (ifNote 2.0, MCP "segment group" pattern).
 * A sliding gradient pill (`layoutId` spring) marks the active option.
 */
export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  layoutId,
  size = "md",
  disabled,
  className,
  ...rest
}: Props<T>) {
  return (
    <div
      role="tablist"
      aria-label={rest["aria-label"]}
      className={cn(
        "inline-flex rounded-full bg-paper-100/80 p-1 ring-1 ring-inset ring-paper-300/70 dark:bg-ink-900/40 dark:ring-ink-700",
        className,
      )}
    >
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            className={cn(
              "relative rounded-full font-medium transition-colors disabled:opacity-50",
              size === "sm" ? "px-3 py-1 text-xs" : "px-4 py-1.5 text-sm",
              active
                ? "text-white"
                : "text-ink-600 hover:text-ink-800 dark:text-paper-50/80 dark:hover:text-paper-50",
            )}
          >
            {active ? (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-full bg-accent-gradient shadow-glow-sm"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            ) : null}
            <span className="relative whitespace-nowrap">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}

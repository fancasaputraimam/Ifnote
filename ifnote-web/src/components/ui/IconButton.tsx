"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;          // accessible label
  size?: "sm" | "md";
}

export const IconButton = forwardRef<HTMLButtonElement, Props>(function IconButton(
  { label, size = "md", className, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex items-center justify-center rounded-full text-ink-700",
        "transition-[transform,background-color,color] duration-150 ease-out",
        "active:scale-90 motion-reduce:active:scale-100 motion-reduce:transition-none",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400",
        "hover:bg-paper-100 dark:text-paper-50 dark:hover:bg-ink-700",
        size === "sm" && "h-8 w-8",
        size === "md" && "h-10 w-10",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
});

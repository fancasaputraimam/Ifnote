"use client";

import { cn } from "@/lib/utils";

interface LoaderGridProps {
  className?: string;
  /** Accessible label, also kept on the wrapper as aria-label. */
  label?: string;
}

/**
 * LoaderGrid — colorful 4-corner pulsing loader for AI/analysis actions.
 *
 * Size is driven by font-size (the loader is sized in `em`):
 *   - default: ~2.5em (≈40px at the default text-base font size)
 *   - compact: pass `className="text-[0.55rem]"` for a ~22px footprint
 *
 * Animation lives in `globals.css` (`.loader-grid`) so the component
 * stays SSR-safe and tree-shakable. Honors `prefers-reduced-motion`.
 *
 * Use this only for AI/analysis loading states (per project spec
 * PART 5). Do not blanket-replace generic page loaders.
 */
export default function LoaderGrid({
  className,
  label = "Memproses…",
}: LoaderGridProps) {
  return (
    <div
      role="status"
      aria-label={label}
      className={cn("inline-flex items-center justify-center", className)}
    >
      <div className="loader-grid relative h-[2.5em] w-[2.5em] rotate-[165deg]">
        <span className="beforeEl" aria-hidden />
        <span className="afterEl" aria-hidden />
      </div>
      <span className="sr-only">{label}</span>
    </div>
  );
}

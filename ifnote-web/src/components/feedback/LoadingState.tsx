import { cn } from "@/lib/utils";

interface Props {
  label?: string;
  className?: string;
}

/**
 * Inline loading state (ifNote 2.0). Three pulsing accent dots + label.
 * API unchanged.
 */
export function LoadingState({ label = "Memuat…", className }: Props) {
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-2.5 px-4 py-10 text-sm text-ink-400",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <span className="flex items-center gap-1" aria-hidden>
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent-400 [animation-delay:-0.3s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent-400 [animation-delay:-0.15s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent-400" />
      </span>
      <span>{label}</span>
    </div>
  );
}

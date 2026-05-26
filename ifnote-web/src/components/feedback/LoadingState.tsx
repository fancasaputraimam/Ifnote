import { cn } from "@/lib/utils";

interface Props {
  label?: string;
  className?: string;
}

export function LoadingState({ label = "Memuat…", className }: Props) {
  return (
    <div className={cn("flex items-center justify-center gap-2 px-4 py-8 text-sm text-ink-400", className)} role="status" aria-live="polite">
      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-accent-400 border-t-transparent" aria-hidden />
      <span>{label}</span>
    </div>
  );
}

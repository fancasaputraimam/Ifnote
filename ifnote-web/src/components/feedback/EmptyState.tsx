import { cn } from "@/lib/utils";

interface Props {
  title?: string;
  description?: string;
  icon?: string;
  action?: React.ReactNode;
  className?: string;
}

/**
 * Empty state (ifNote 2.0). Soft haloed icon badge + calm copy, centered.
 * API unchanged.
 */
export function EmptyState({
  title = "Belum ada apa-apa",
  description,
  icon = "📓",
  action,
  className,
}: Props) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 py-14 text-center",
        className,
      )}
    >
      <div
        aria-hidden
        className="grid h-16 w-16 place-content-center rounded-2xl bg-accent-gradient-soft text-3xl ring-1 ring-inset ring-accent-200/60 dark:bg-accent-500/10 dark:ring-accent-400/20"
      >
        {icon}
      </div>
      <p className="mt-4 text-base font-semibold text-ink-800 dark:text-paper-50">
        {title}
      </p>
      {description ? (
        <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-ink-400">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

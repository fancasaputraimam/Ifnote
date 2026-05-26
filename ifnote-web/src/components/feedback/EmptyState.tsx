import { cn } from "@/lib/utils";

interface Props {
  title?: string;
  description?: string;
  icon?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ title = "Belum ada apa-apa", description, icon = "📓", action, className }: Props) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-6 py-12 text-center", className)}>
      <div className="text-4xl" aria-hidden>{icon}</div>
      <p className="mt-3 text-base font-semibold text-ink-700 dark:text-paper-50">{title}</p>
      {description ? (
        <p className="mt-1 max-w-sm text-sm text-ink-400">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

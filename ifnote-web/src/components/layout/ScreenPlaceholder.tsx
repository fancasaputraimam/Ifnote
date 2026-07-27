import { ReactNode } from "react";
import { NotebookCard } from "@/components/ui/NotebookCard";
import { Badge } from "@/components/ui/Badge";

interface Props {
  title: string;
  subtitle?: string;
  description?: string;
  status?: string;
  stripe?: "accent" | "lilac" | "leaf";
  children?: ReactNode;
}

/** Placeholder used by every protected screen until the real UI lands. */
export function ScreenPlaceholder({
  title,
  subtitle,
  description,
  status = "Siap dipakai",
  stripe = "accent",
  children,
}: Props) {
  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-ink-800 dark:text-paper-50">{title}</h1>
        {subtitle ? (
          <p className="text-sm text-ink-400">{subtitle}</p>
        ) : null}
      </header>

      <NotebookCard stripe={stripe} ruled className="p-5">
        <div className="flex items-start gap-3">
          <Badge tone="accent" size="md">{status}</Badge>
        </div>
        <h2 className="mt-3 text-lg font-semibold text-ink-800 dark:text-paper-50">
          Halaman ini sudah terhubung ke shell
        </h2>
        <p className="mt-1 text-sm text-ink-400">
          {description ??
            "Konten interaktif akan diisi di fase implementasi screen-specific."}
        </p>
        {children ? <div className="mt-4">{children}</div> : null}
      </NotebookCard>
    </section>
  );
}

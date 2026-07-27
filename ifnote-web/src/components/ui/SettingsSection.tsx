"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Props {
  /** Neutral icon (lucide) shown in a soft chip. */
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  /** Right-aligned header slot (e.g. a badge/toggle). */
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * Settings section card (ifNote 2.0, MCP "settings card" pattern). Clean
 * neutral surface — icon chip + title + description header, body below.
 * No colored edges; tone comes only from controls inside.
 */
export function SettingsSection({
  icon,
  title,
  description,
  action,
  children,
  className,
}: Props) {
  return (
    <section
      className={cn(
        "group relative overflow-hidden rounded-notebook bg-white p-5 shadow-notebook ring-1 ring-inset ring-paper-200/90 dark:bg-ink-800 dark:ring-ink-700 sm:p-6",
        className,
      )}
    >
      {/* garis margin merah — motif buku latihan (Sumi & Washi) */}
      <span aria-hidden className="absolute inset-y-4 left-2.5 w-px bg-accent-500/15" />
      <header className="relative flex items-start gap-3 pl-2">
        {icon ? (
          <span className="grid h-10 w-10 shrink-0 -rotate-3 place-items-center rounded-[10px] bg-paper-100 text-ink-600 ring-1 ring-inset ring-paper-300/70 transition-transform duration-200 group-hover:rotate-0 dark:bg-ink-700 dark:text-paper-50 dark:ring-ink-600">
            {icon}
          </span>
        ) : null}
        <div className="min-w-0 flex-1">
          <h2 className="font-serif text-lg font-semibold tracking-tight text-ink-800 dark:text-paper-50">
            {title}
          </h2>
          {description ? (
            <p className="mt-0.5 text-xs leading-relaxed text-ink-400">{description}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </header>
      <div className="relative mt-5 pl-2">{children}</div>
    </section>
  );
}

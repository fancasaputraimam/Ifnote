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
        "rounded-notebook bg-white p-5 shadow-notebook ring-1 ring-inset ring-paper-200/90 dark:bg-ink-800 dark:ring-ink-700 sm:p-6",
        className,
      )}
    >
      <header className="flex items-start gap-3">
        {icon ? (
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-paper-100 text-ink-600 ring-1 ring-inset ring-paper-300/70 dark:bg-ink-700 dark:text-paper-50 dark:ring-ink-600">
            {icon}
          </span>
        ) : null}
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold tracking-tight text-ink-800 dark:text-paper-50">
            {title}
          </h2>
          {description ? (
            <p className="mt-0.5 text-xs leading-relaxed text-ink-400">{description}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </header>
      <div className="mt-5">{children}</div>
    </section>
  );
}

"use client";

import { ReactNode, useState } from "react";
import { cn } from "@/lib/utils";

interface Props {
  title: ReactNode;
  defaultOpen?: boolean;
  className?: string;
  children: ReactNode;
  trailing?: ReactNode;
}

export function Accordion({ title, defaultOpen, className, trailing, children }: Props) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div className={cn("rounded-notebook border border-paper-200 dark:border-ink-700 overflow-hidden", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm font-medium text-ink-800 dark:text-paper-50 hover:bg-paper-100 dark:hover:bg-ink-700"
      >
        <span className="flex-1">{title}</span>
        {trailing}
        <span aria-hidden className={cn("transition-transform", open ? "rotate-180" : "")}>
          ▾
        </span>
      </button>
      {open ? <div className="border-t border-paper-200 dark:border-ink-700 px-4 py-3">{children}</div> : null}
    </div>
  );
}

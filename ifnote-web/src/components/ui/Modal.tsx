"use client";

import { ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  className?: string;
  children: ReactNode;
}

export function Modal({ open, onClose, title, className, children }: Props) {
  // Render via React portal supaya konten modal lepas dari DOM tree
  // tempat trigger berada (mis. accordion `<button>`). Tanpa ini, nested
  // interactive elements di dalam `<button>` membuat klik child di-swallow
  // browser — inilah penyebab kanji di Catatan Kotoba tidak bisa diklik.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !mounted) return null;

  const content = (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink-800/40 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className={cn(
          "w-full sm:max-w-lg rounded-t-notebook sm:rounded-notebook bg-white shadow-notebook-md dark:bg-ink-800 max-h-[92vh] overflow-y-auto",
          className,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {title ? (
          <header className="border-b border-paper-200 dark:border-ink-700 px-5 py-4">
            <h2 className="text-base font-semibold text-ink-800 dark:text-paper-50">
              {title}
            </h2>
          </header>
        ) : null}
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}

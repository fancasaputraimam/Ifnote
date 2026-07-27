"use client";

import { cn } from "@/lib/utils";

interface Props {
  /** true = mode manual aktif. */
  manual: boolean;
  onChange: (manual: boolean) => void;
}

/**
 * Pemilih cara mengisi di mode tambah: Dengan AI (default) atau Isi manual.
 * Mode manual penting sebagai fallback saat AI belum dikonfigurasi —
 * tanpa ini user tidak bisa menambah catatan sama sekali.
 */
export function CreateModeTabs({ manual, onChange }: Props) {
  return (
    <div
      role="tablist"
      aria-label="Cara mengisi"
      className="mb-4 grid grid-cols-2 gap-1 rounded-full bg-paper-100 p-1 dark:bg-ink-900/50"
    >
      <Tab active={!manual} onClick={() => onChange(false)}>
        <span aria-hidden>✨</span> Dengan AI
      </Tab>
      <Tab active={manual} onClick={() => onChange(true)}>
        <span aria-hidden>✍️</span> Isi manual
      </Tab>
    </div>
  );
}

function Tab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-full py-1.5 text-xs font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400",
        active
          ? "bg-white text-ink-800 shadow-notebook dark:bg-ink-700 dark:text-paper-50"
          : "text-ink-400 hover:text-ink-700 dark:hover:text-paper-50",
      )}
    >
      {children}
    </button>
  );
}

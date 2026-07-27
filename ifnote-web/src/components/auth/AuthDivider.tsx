import { ReactNode } from "react";

/** Divider hairline dengan label kecil di tengah — dipakai di halaman auth. */
export function AuthDivider({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex items-center">
      <div className="flex-1 border-t border-paper-200 dark:border-ink-700" />
      <span className="px-3 text-xs uppercase tracking-wider text-ink-400">{children}</span>
      <div className="flex-1 border-t border-paper-200 dark:border-ink-700" />
    </div>
  );
}

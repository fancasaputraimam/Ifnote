import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Props {
  /**
   * Eyebrow kecil di atas judul, mis. "🌸 Daily Dashboard".
   * Dipakai untuk memberi rasa "label tab/halaman" ala landing page.
   */
  eyebrow: ReactNode;
  /** Judul utama halaman. */
  title: ReactNode;
  /** Subtitle / deskripsi singkat di bawah judul. */
  subtitle?: ReactNode;
  /**
   * Slot kanan — biasanya tombol primary (Tambah, Generate Quiz, dst).
   * Di mobile akan stack di bawah judul.
   */
  actions?: ReactNode;
  className?: string;
}

/**
 * Page header seragam ifNote: eyebrow accent + judul tracking-tight + subtitle.
 * Visual language mirror landing page (Catat bahasa Jepang dengan tenang).
 *
 * Mobile: stack vertical, actions wrap ke bawah.
 * Desktop (sm+): title + actions sejajar di satu baris.
 */
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
  className,
}: Props) {
  return (
    <header className={cn("space-y-1", className)}>
      <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-accent-600 dark:text-accent-300">
        {eyebrow}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-ink-800 dark:text-paper-50 sm:text-[1.75rem]">
          {title}
        </h1>
        {actions ? (
          <div className="flex flex-wrap gap-2">{actions}</div>
        ) : null}
      </div>
      {subtitle ? (
        <p className="text-sm leading-relaxed text-ink-400">{subtitle}</p>
      ) : null}
    </header>
  );
}

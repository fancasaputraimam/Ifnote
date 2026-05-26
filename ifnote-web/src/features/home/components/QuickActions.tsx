"use client";

import Link from "next/link";
import { NotebookCard } from "@/components/ui/NotebookCard";
import { ROUTES } from "@/lib/constants";

interface QuickAction {
  label: string;
  href: string;
  icon: string;
  hint?: string;
}

const ACTIONS: QuickAction[] = [
  { label: "Tambah Kotoba",   href: `${ROUTES.app.catatan}?add=kotoba`, icon: "📒", hint: "Buka Catatan" },
  { label: "Tambah Bunpou",   href: `${ROUTES.app.catatan}?add=bunpou`, icon: "🧱", hint: "Buka Catatan" },
  { label: "Tanya AI Tutor",  href: ROUTES.app.ai,       icon: "🤖", hint: "Mode bantuan" },
  { label: "Mulai Review",    href: ROUTES.app.hafalan,  icon: "🗂",  hint: "Hafalan slide" },
];

export function QuickActions() {
  return (
    <NotebookCard className="p-5">
      <h2 className="text-base font-semibold text-ink-800 dark:text-paper-50">
        Aksi Cepat
      </h2>
      <p className="mt-1 text-xs text-ink-400">Jalan pintas ke aktivitas yang paling sering dipakai.</p>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {ACTIONS.map((a) => (
          <Link
            key={a.label}
            href={a.href}
            className="group flex flex-col items-start gap-1 rounded-xl border border-paper-200 bg-white px-3 py-3 transition-colors hover:bg-paper-100 dark:border-ink-700 dark:bg-ink-800 dark:hover:bg-ink-700"
          >
            <span aria-hidden className="text-xl">{a.icon}</span>
            <span className="text-sm font-medium text-ink-800 dark:text-paper-50">{a.label}</span>
            {a.hint ? <span className="text-[11px] text-ink-400">{a.hint}</span> : null}
          </Link>
        ))}
      </div>
    </NotebookCard>
  );
}

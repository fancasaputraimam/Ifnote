"use client";

import Link from "next/link";
import { useAuth } from "@/features/auth/AuthProvider";
import { LinkButton } from "@/components/ui/LinkButton";
import { NotebookCard } from "@/components/ui/NotebookCard";
import { Badge } from "@/components/ui/Badge";
import { ROUTES } from "@/lib/constants";

interface Props {
  reviewCount: number;
  streakDays: number;
}

export function WelcomeBackCard({ reviewCount, streakDays }: Props) {
  const { user } = useAuth();
  const name = user?.name?.split(" ")[0] || "kamu";

  return (
    <NotebookCard stripe="accent" ruled className="p-5">
      <div className="flex items-center gap-2">
        <span className="font-jp text-lg text-accent-600 dark:text-accent-300">おかえりなさい</span>
        <Badge tone="accent" size="sm">{name}</Badge>
      </div>
      <p className="mt-1 text-sm text-ink-400">
        Lanjutkan belajar hari ini. Sedikit demi sedikit, tapi konsisten.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
        <div className="rounded-xl border border-paper-200 bg-paper-50/60 px-3 py-2 dark:border-ink-700 dark:bg-ink-900/30">
          <span className="text-ink-400">Review menunggu </span>
          <span className="font-semibold text-ink-800 dark:text-paper-50">{reviewCount}</span>
        </div>
        <div className="rounded-xl border border-paper-200 bg-paper-50/60 px-3 py-2 dark:border-ink-700 dark:bg-ink-900/30">
          <span className="text-ink-400">Streak </span>
          {streakDays > 0 ? (
            <span className="font-semibold text-ink-800 dark:text-paper-50">{streakDays} hari</span>
          ) : (
            <span className="text-ink-400 italic">belum dilacak</span>
          )}
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <LinkButton href={ROUTES.app.hafalan}>Mulai Hafalan</LinkButton>
        <LinkButton variant="secondary" href={ROUTES.app.catatan}>Buka Catatan</LinkButton>
      </div>
    </NotebookCard>
  );
}

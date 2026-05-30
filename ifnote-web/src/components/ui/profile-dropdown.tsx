"use client";

/**
 * ProfileDropdown — animated profile menu di header, terinspirasi Kokonut UI
 * tapi disesuaikan penuh dengan tema ifNote (paper/ink/accent), bukan zinc
 * mentah. Dibangun di atas DropdownMenu bertema (animasi zoom/slide via
 * framer-motion sudah ada di komponennya).
 *
 * Aturan penting (spec):
 *  - TIDAK ada data sample (no "Eugene An", no kokonutui links/avatar).
 *  - Pakai data user asli dari auth context.
 *  - API key TIDAK pernah ditampilkan; model hanya untuk owner & jika ada.
 *  - Trigger ringkas di mobile (avatar saja), nama/email tetap di dalam menu.
 *  - Logout pakai flow logout yang sudah ada.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, LogOut, Settings, Sparkles, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

export type ProfileDropdownUser = {
  name?: string | null;
  email?: string | null;
  avatar?: string | null;
  role?: string | null;
  canManageAi?: boolean;
  model?: string | null;
  jpMode?: "beginner" | "normal" | "pro";
};

const JP_MODE_LABEL: Record<NonNullable<ProfileDropdownUser["jpMode"]>, string> = {
  beginner: "Pemula",
  normal: "Normal",
  pro: "Pro",
};

/** Inisial dari nama atau, kalau kosong, dari bagian depan email. */
export function getInitials(nameOrEmail: string): string {
  const s = (nameOrEmail || "").trim();
  if (!s) return "?";
  // Email → ambil sebelum @.
  const base = s.includes("@") ? s.split("@")[0] : s;
  const parts = base.split(/[\s._-]+/).filter(Boolean);
  if (parts.length === 0) return base.charAt(0).toUpperCase();
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function ProfileDropdown({
  user,
  onLogout,
  className,
}: {
  user: ProfileDropdownUser;
  onLogout: () => void | Promise<void>;
  className?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const email = user.email?.trim() || "";
  const name =
    user.name?.trim() ||
    (email ? email.split("@")[0] : "") ||
    "User";
  const initials = getInitials(user.name?.trim() || email || "User");
  const avatar = user.avatar?.trim() || null;
  const showModel = user.canManageAi === true && !!user.model?.trim();

  const Avatar = (
    <span className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-accent-400 to-lilac-500 text-xs font-semibold uppercase text-white">
      {avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatar} alt={name} className="h-full w-full object-cover" />
      ) : (
        initials
      )}
    </span>
  );

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Buka menu profil"
          className={cn(
            "group flex items-center gap-2 rounded-2xl border border-paper-200 bg-white px-1.5 py-1 transition-all duration-200",
            "hover:bg-paper-50 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400",
            "dark:border-ink-700 dark:bg-ink-800 dark:hover:bg-ink-700",
            open && "border-accent-300 shadow-sm dark:border-accent-500/50",
            className,
          )}
        >
          {Avatar}
          {/* Nama/email hanya tampil di layar >= sm supaya mobile ringkas. */}
          <span className="hidden min-w-0 flex-col text-left sm:flex">
            <span className="max-w-[12ch] truncate text-sm font-medium leading-tight text-ink-800 dark:text-paper-50">
              {name}
            </span>
            {email ? (
              <span className="max-w-[14ch] truncate text-[11px] leading-tight text-ink-400">
                {email}
              </span>
            ) : null}
          </span>
          {/* Bending line indicator — tidak menghalangi klik. */}
          <svg
            aria-hidden
            viewBox="0 0 16 24"
            className={cn(
              "pointer-events-none mr-0.5 hidden h-5 w-3 transition-all duration-200 sm:block",
              open
                ? "scale-110 text-accent-500"
                : "text-ink-300 group-hover:text-ink-400 dark:text-ink-600",
            )}
          >
            <path
              d="M4 3 C 11 8, 11 16, 4 21"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-64 border-paper-200/70 bg-white/95 backdrop-blur-sm dark:border-ink-700/70 dark:bg-ink-800/95"
      >
        {/* Ringkasan profil (selalu tampil, penting untuk mobile). */}
        <DropdownMenuLabel className="flex items-center gap-3 px-2.5 py-2">
          {Avatar}
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-semibold text-ink-800 dark:text-paper-50">
              {name}
            </span>
            {email ? (
              <span className="truncate text-xs text-ink-400">{email}</span>
            ) : null}
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem onSelect={() => router.push(ROUTES.app.profile)}>
          <User size={16} strokeWidth={2} className="opacity-70" aria-hidden />
          <span>Profil</span>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => router.push(ROUTES.app.settings)}>
          <Settings size={16} strokeWidth={2} className="opacity-70" aria-hidden />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => router.push(ROUTES.app.settings)}>
          <FileText size={16} strokeWidth={2} className="opacity-70" aria-hidden />
          <span className="flex-1">Mode Jepang</span>
          {user.jpMode ? (
            <span className="rounded-full bg-paper-100 px-2 py-0.5 text-[10px] font-medium text-ink-500 dark:bg-ink-700 dark:text-paper-50/70">
              {JP_MODE_LABEL[user.jpMode]}
            </span>
          ) : null}
        </DropdownMenuItem>

        {showModel ? (
          <DropdownMenuItem onSelect={() => router.push(ROUTES.app.settings)}>
            <Sparkles size={16} strokeWidth={2} className="opacity-70" aria-hidden />
            <span className="flex-1">AI Model</span>
            <span className="max-w-[10ch] truncate rounded-full bg-accent-50 px-2 py-0.5 text-[10px] font-medium text-accent-700 dark:bg-accent-700/20 dark:text-accent-200">
              {user.model}
            </span>
          </DropdownMenuItem>
        ) : null}

        <DropdownMenuSeparator />

        <DropdownMenuItem destructive onSelect={() => void onLogout()}>
          <LogOut size={16} strokeWidth={2} aria-hidden />
          <span>Keluar</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

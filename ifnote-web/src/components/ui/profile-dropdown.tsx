"use client";

/**
 * ProfileDropdown — menu profil di header, gaya "Sumi & Washi":
 * avatar berbentuk stempel hanko miring yang menegak saat dibuka,
 * header menu di atas kertas washi dengan garis margin merah, dan
 * kanji pengiring halus di tiap item.
 *
 * Aturan penting (spec):
 *  - TIDAK ada data sample. Pakai data user asli dari auth context.
 *  - API key TIDAK pernah ditampilkan; model hanya untuk owner & jika ada.
 *  - Trigger ringkas di mobile (avatar saja), nama/email tetap di dalam menu.
 *  - Logout pakai flow logout yang sudah ada.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, FileText, LogOut, Settings, Sparkles, User } from "lucide-react";
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
  const isOwner = (user.role || "").toLowerCase() === "owner";
  const showModel = user.canManageAi === true && !!user.model?.trim();

  /** Avatar bergaya stempel hanko — miring, menegak saat menu terbuka. */
  const stamp = (extra?: string) => (
    <span
      className={cn(
        "grid shrink-0 place-items-center overflow-hidden rounded-[9px] bg-accent-gradient text-xs font-semibold uppercase text-white shadow-glow-sm transition-transform duration-200",
        open ? "rotate-0" : "-rotate-3 group-hover:rotate-0",
        extra ?? "h-8 w-8",
      )}
    >
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
          {stamp()}
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
          <ChevronDown
            aria-hidden
            className={cn(
              "mr-0.5 hidden h-3.5 w-3.5 transition-transform duration-200 sm:block",
              open
                ? "rotate-180 text-accent-500"
                : "text-ink-300 group-hover:text-ink-400 dark:text-ink-600",
            )}
          />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-64 border-paper-200/70 bg-white/95 backdrop-blur-sm dark:border-ink-700/70 dark:bg-ink-800/95"
      >
        {/* Header profil di atas kertas washi + garis margin merah. */}
        <DropdownMenuLabel className="relative -m-1 mb-1 overflow-hidden rounded-t-notebook bg-paper-100/80 px-3 py-3 dark:bg-ink-900/50">
          <span aria-hidden className="absolute inset-y-2 left-2 w-px bg-accent-500/25" />
          <span
            aria-hidden
            className="pointer-events-none absolute -right-2 -top-3 select-none font-jp text-5xl leading-none text-ink-800/[0.05] dark:text-paper-50/[0.05]"
          >
            ノ
          </span>
          <div className="relative flex items-center gap-3 pl-2">
            {stamp("h-10 w-10 text-sm")}
            <div className="flex min-w-0 flex-col">
              <span className="truncate font-serif text-sm font-semibold text-ink-800 dark:text-paper-50">
                {name}
              </span>
              {email ? (
                <span className="truncate text-xs text-ink-400">{email}</span>
              ) : null}
              {isOwner ? (
                <span className="mt-1 inline-flex w-fit items-center gap-1 rounded-full bg-accent-50 px-2 py-0.5 text-[10px] font-semibold text-accent-700 ring-1 ring-inset ring-accent-200 dark:bg-accent-500/15 dark:text-accent-200 dark:ring-accent-400/30">
                  <span aria-hidden className="font-serif">主</span> Owner
                </span>
              ) : null}
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuItem onSelect={() => router.push(ROUTES.app.profile)}>
          <User size={16} strokeWidth={2} className="opacity-70" aria-hidden />
          <span className="flex-1">Profil</span>
          <ItemKana>私</ItemKana>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => router.push(ROUTES.app.settings)}>
          <Settings size={16} strokeWidth={2} className="opacity-70" aria-hidden />
          <span className="flex-1">Settings</span>
          <ItemKana>設</ItemKana>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => router.push(ROUTES.app.settings)}>
          <FileText size={16} strokeWidth={2} className="opacity-70" aria-hidden />
          <span className="flex-1">Mode Jepang</span>
          {user.jpMode ? (
            <span className="rounded-full bg-paper-100 px-2 py-0.5 text-[10px] font-medium text-ink-500 dark:bg-ink-700 dark:text-paper-50/70">
              {JP_MODE_LABEL[user.jpMode]}
            </span>
          ) : (
            <ItemKana>語</ItemKana>
          )}
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
          <span className="flex-1">Keluar</span>
          <ItemKana className="text-rose-300 dark:text-rose-500/60">出</ItemKana>
        </DropdownMenuItem>

        {/* mantra kecil di kaki menu */}
        <div
          aria-hidden
          className="select-none px-2.5 pb-1 pt-1.5 text-center font-jp text-[9px] tracking-[0.3em] text-ink-300 dark:text-ink-600"
        >
          しずかに、まなぶ
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Kanji pengiring halus di sisi kanan item menu. */
function ItemKana({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn("select-none font-serif text-xs text-ink-300 dark:text-ink-600", className)}
    >
      {children}
    </span>
  );
}

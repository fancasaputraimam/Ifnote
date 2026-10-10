import Link from "next/link";
import { LinkButton } from "@/components/ui/LinkButton";
import { ROUTES, APP_NAME } from "@/lib/constants";
import { FOCUS_RING } from "./focus";

// min-h-11 = 44px: target sentuh minimum di HP (R-03).
const NAV_LINK = `inline-flex min-h-11 items-center rounded px-2 text-sm font-medium text-ink-600 underline-offset-4 transition-colors hover:text-accent-700 hover:underline dark:text-paper-50 dark:hover:text-accent-300 ${FOCUS_RING}`;

/** Header bersama: landing, Tentang, Kontak, Privasi, Ketentuan. */
export function SiteHeader() {
  return (
    <header className="flex items-center justify-between py-4 sm:py-6">
      <Link
        href={ROUTES.landing}
        aria-label={`${APP_NAME}, kembali ke beranda`}
        className={`flex min-h-11 items-center gap-2.5 rounded ${FOCUS_RING}`}
      >
        <span
          aria-hidden
          className="grid h-9 w-9 -rotate-3 place-items-center rounded-[10px] bg-accent-gradient font-serif text-lg text-white"
        >
          ノ
        </span>
        <span className="font-serif text-lg font-semibold tracking-tight text-ink-800 dark:text-paper-50">
          {APP_NAME}
        </span>
      </Link>
      <nav aria-label="Navigasi utama" className="flex items-center gap-1 sm:gap-3">
        <Link href={ROUTES.about} className={NAV_LINK}>
          Tentang
        </Link>
        <Link href={ROUTES.login} className={NAV_LINK}>
          Masuk
        </Link>
        {/* Tanpa glow: glow hanya untuk satu ajakan utama di hero (R-13). */}
        <LinkButton href={ROUTES.register} size="sm" className="ml-1 hidden min-h-11 shadow-none hover:shadow-none sm:inline-flex">
          Buat akun
        </LinkButton>
      </nav>
    </header>
  );
}

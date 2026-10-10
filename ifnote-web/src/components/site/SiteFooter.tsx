import Link from "next/link";
import { ROUTES, APP_NAME } from "@/lib/constants";
import { FOCUS_RING } from "./focus";

// Satu daftar tautan, semuanya halaman yang ada.
const FOOTER_LINKS = [
  { text: "Tentang", href: ROUTES.about },
  { text: "Kontak", href: ROUTES.contact },
  { text: "Kebijakan Privasi", href: ROUTES.privacy },
  { text: "Ketentuan Layanan", href: ROUTES.terms },
  { text: "Masuk", href: ROUTES.login },
  { text: "Buat akun", href: ROUTES.register },
];

/** Footer bersama: landing, Tentang, Kontak, Privasi, Ketentuan. */
export function SiteFooter() {
  return (
    <footer className="mt-10 border-t border-paper-200/80 py-8 dark:border-ink-700">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-xs">
          <p className="font-serif text-lg font-semibold tracking-tight text-ink-800 dark:text-paper-50">
            {APP_NAME}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-ink-400">
            Buku catatan bahasa Jepang untuk orang Indonesia: catat, hafalkan, lalu uji dirimu sendiri.
          </p>
        </div>
        <nav aria-label="Tautan situs">
          <ul className="grid grid-cols-2 gap-x-10 gap-y-1 text-sm">
            {FOOTER_LINKS.map((l) => (
              <li key={l.text}>
                <Link
                  href={l.href}
                  className={`inline-flex min-h-11 items-center rounded text-ink-400 underline-offset-4 transition-colors hover:text-accent-700 hover:underline dark:hover:text-accent-300 ${FOCUS_RING}`}
                >
                  {l.text}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <p className="mt-8 text-xs text-ink-400">
        © {new Date().getFullYear()} {APP_NAME}. Dibuat oleh Imam Fanca Saputra.
      </p>
    </footer>
  );
}

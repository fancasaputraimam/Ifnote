import { ReactNode } from "react";
import Link from "next/link";
import { ROUTES } from "@/lib/constants";

interface AuthCardProps {
  /** Furigana/kanji overline di atas judul (mis. "ようこそ"). */
  overline?: string;
  /** Heading di dalam card. */
  title: string;
  /** Subtitle / deskripsi pendek. */
  description?: ReactNode;
  /** Form atau body utama. */
  children: ReactNode;
  /** Bagian bawah card — biasanya social buttons + link alternatif. */
  footer?: ReactNode;
  /** Tampilkan brand block ifNote di atas card. Default: true. */
  showBrand?: boolean;
}

/**
 * Wrapper kartu auth yang dipakai LoginForm / RegisterForm /
 * ForgotPasswordForm. Layout: centered full-screen, brand di atas,
 * card putih dengan title/description/children/footer.
 *
 * Aksen Jepang menyamai landing page: ikon ノ, font-jp untuk overline,
 * accent indigo untuk highlight.
 */
export function AuthCard({
  overline,
  title,
  description,
  children,
  footer,
  showBrand = true,
}: AuthCardProps) {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-paper-50 px-4 py-10 dark:bg-paper-900">
      {/* Aksen kana dekoratif di latar — hanya tampil di tablet ke atas */}
      <KanaBackdrop />

      <div className="relative z-10 w-full max-w-sm">
        {showBrand ? <BrandBlock /> : null}

        <div className="rounded-notebook border border-paper-200 bg-white p-6 shadow-notebook dark:border-ink-700 dark:bg-ink-800 sm:p-7">
          <div>
            {overline ? (
              <div className="font-jp text-xs tracking-widest text-accent-500">
                {overline}
              </div>
            ) : null}
            <h1 className="mt-1 text-xl font-semibold text-ink-800 dark:text-paper-50">
              {title}
            </h1>
            {description ? (
              <div className="mt-1 text-sm text-ink-400">{description}</div>
            ) : null}
          </div>

          <div className="mt-6">{children}</div>

          {footer ? <div className="mt-6">{footer}</div> : null}
        </div>

        <p className="mt-6 text-center text-xs text-ink-400">
          Dengan melanjutkan kamu menyetujui{" "}
          <Link href={ROUTES.landing} className="underline-offset-4 hover:underline">
            ketentuan
          </Link>{" "}
          ifNote.
        </p>
      </div>
    </main>
  );
}

/**
 * Brand mark seragam dengan landing page:
 *  - kotak rounded dengan kanji ノ (font-jp), background accent
 *  - judul ifNote
 *  - tagline "Japanese Notes with AI"
 */
function BrandBlock() {
  return (
    <Link
      href={ROUTES.landing}
      className="mb-6 flex flex-col items-center gap-3"
      aria-label="Kembali ke beranda ifNote"
    >
      <span
        aria-hidden
        className="grid h-12 w-12 place-items-center rounded-2xl bg-accent-500 font-jp text-2xl text-white shadow-notebook"
      >
        ノ
      </span>
      <div className="text-center">
        <div className="text-lg font-semibold tracking-tight text-ink-800 dark:text-paper-50">
          ifNote
        </div>
        <div className="font-jp text-[11px] tracking-widest text-accent-500">
          ノート・記憶・AI
        </div>
        <div className="mt-0.5 text-xs text-ink-400">Japanese Notes with AI</div>
      </div>
    </Link>
  );
}

/**
 * Kana besar samar-samar di latar — referensi ke aksen orbit kana di
 * landing page. Pakai aria-hidden, tidak intercept input, hanya muncul
 * di sm+ supaya mobile tetap bersih.
 */
function KanaBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 hidden select-none sm:block"
    >
      <span className="absolute left-[8%] top-[12%] font-jp text-[140px] leading-none text-accent-500/[0.06] dark:text-accent-200/[0.05]">
        あ
      </span>
      <span className="absolute right-[10%] top-[18%] font-jp text-[120px] leading-none text-lilac-500/[0.07] dark:text-lilac-400/[0.06]">
        ア
      </span>
      <span className="absolute bottom-[10%] left-[12%] font-jp text-[160px] leading-none text-leaf-500/[0.06] dark:text-leaf-500/[0.05]">
        漢
      </span>
      <span className="absolute bottom-[14%] right-[8%] font-jp text-[110px] leading-none text-accent-500/[0.06] dark:text-accent-200/[0.05]">
        の
      </span>
    </div>
  );
}

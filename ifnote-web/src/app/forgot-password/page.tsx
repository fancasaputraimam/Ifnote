import Link from "next/link";
import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/AuthCard";
import { CopyEmailButton } from "@/components/auth/CopyEmailButton";
import { LinkButton } from "@/components/ui/LinkButton";
import { FOCUS_RING } from "@/components/site/focus";
import { CONTACT_EMAIL, ROUTES } from "@/lib/constants";

export const metadata: Metadata = { title: "Lupa password · ifNote" };

// Reset otomatis butuh pengirim email dan token yang belum ada. Halaman ini
// jujur soal itu dan memberi satu jalur yang benar-benar berfungsi: email.
const MAILTO =
  `mailto:${CONTACT_EMAIL}` +
  `?subject=${encodeURIComponent("Reset password ifNote")}` +
  `&body=${encodeURIComponent(
    "Halo, saya lupa password akun ifNote. Email akun saya adalah email yang mengirim pesan ini.",
  )}`;

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Lupa password?"
      description="Reset otomatis belum ada di ifNote."
      footer={
        <p className="text-center text-sm">
          <Link
            href={ROUTES.login}
            className={`inline-flex min-h-11 items-center gap-1.5 rounded text-ink-400 underline-offset-4 hover:text-ink-700 hover:underline dark:hover:text-paper-50 ${FOCUS_RING}`}
          >
            <span aria-hidden>←</span> Kembali ke halaman masuk
          </Link>
        </p>
      }
    >
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-ink-600 dark:text-paper-50/80">
          Kirim email dari alamat yang kamu pakai untuk mendaftar ke{" "}
          <span className="font-medium text-ink-800 dark:text-paper-50">{CONTACT_EMAIL}</span> dan
          bilang kamu lupa password. Pesannya sudah disiapkan di tombol di bawah.
        </p>
        <LinkButton href={MAILTO} className="min-h-11 w-full">
          Kirim email
        </LinkButton>
        <CopyEmailButton email={CONTACT_EMAIL} />
      </div>
    </AuthCard>
  );
}

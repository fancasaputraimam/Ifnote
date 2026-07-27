import Link from "next/link";
import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/AuthCard";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { ROUTES } from "@/lib/constants";

export const metadata: Metadata = { title: "Lupa password · ifNote" };

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      overline="パスワード再設定"
      title="Lupa password?"
      description="Tenang saja — masukkan email akun kamu dan kami kirimkan tautan untuk membuat password baru."
      footer={
        <p className="text-center text-sm">
          <Link
            href={ROUTES.login}
            className="inline-flex items-center gap-1.5 text-ink-400 underline-offset-4 hover:text-ink-700 hover:underline dark:hover:text-paper-50"
          >
            <span aria-hidden>←</span> Kembali ke halaman masuk
          </Link>
        </p>
      }
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}

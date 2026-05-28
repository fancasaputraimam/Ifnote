import Link from "next/link";
import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/AuthCard";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { ROUTES } from "@/lib/constants";

export const metadata: Metadata = { title: "Lupa password · ifNote" };

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      overline="パスワードを忘れた"
      title="Lupa password"
      description="Masukkan email akun kamu untuk menerima tautan reset."
      footer={
        <p className="text-center text-sm">
          <Link
            href={ROUTES.login}
            className="text-ink-400 underline-offset-4 hover:text-ink-700 hover:underline dark:hover:text-paper-50"
          >
            ← Kembali ke Masuk
          </Link>
        </p>
      }
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}

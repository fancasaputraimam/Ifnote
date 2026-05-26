import Link from "next/link";
import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/forms/ForgotPasswordForm";
import { ROUTES } from "@/lib/constants";

export const metadata: Metadata = { title: "Lupa Password · ifNote" };

export default function ForgotPasswordPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm rounded-notebook border border-paper-200 bg-white p-6 shadow-notebook dark:border-ink-700 dark:bg-ink-800">
        <Link href={ROUTES.login} className="text-xs text-ink-400 hover:underline">
          ← Kembali ke Masuk
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-ink-800 dark:text-paper-50">Lupa Password</h1>
        <p className="mt-1 text-sm text-ink-400">
          Masukkan email akun kamu untuk menerima tautan reset.
        </p>
        <div className="mt-6">
          <ForgotPasswordForm />
        </div>
      </div>
    </main>
  );
}

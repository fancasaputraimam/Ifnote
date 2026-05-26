import Link from "next/link";
import type { Metadata } from "next";
import { LoginForm } from "@/components/forms/LoginForm";
import { ROUTES } from "@/lib/constants";

export const metadata: Metadata = { title: "Masuk · ifNote" };

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm rounded-notebook border border-paper-200 bg-white p-6 shadow-notebook dark:border-ink-700 dark:bg-ink-800">
        <Link href={ROUTES.landing} className="text-xs text-ink-400 hover:underline">
          ← Kembali
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-ink-800 dark:text-paper-50">Masuk</h1>
        <p className="mt-1 text-sm text-ink-400">
          Lanjutkan belajar bahasa Jepang kamu.
        </p>
        <div className="mt-6">
          <LoginForm />
        </div>
        <div className="mt-4 flex items-center justify-between text-sm">
          <Link href={ROUTES.forgotPassword} className="text-accent-600 hover:underline dark:text-accent-300">
            Lupa password?
          </Link>
          <Link href={ROUTES.register} className="text-ink-700 hover:underline dark:text-paper-50">
            Belum punya akun?
          </Link>
        </div>
      </div>
    </main>
  );
}

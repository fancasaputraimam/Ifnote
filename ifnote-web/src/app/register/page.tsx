import Link from "next/link";
import type { Metadata } from "next";
import { RegisterForm } from "@/components/forms/RegisterForm";
import { ROUTES } from "@/lib/constants";

export const metadata: Metadata = { title: "Daftar · ifNote" };

export default function RegisterPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm rounded-notebook border border-paper-200 bg-white p-6 shadow-notebook dark:border-ink-700 dark:bg-ink-800">
        <Link href={ROUTES.landing} className="text-xs text-ink-400 hover:underline">
          ← Kembali
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-ink-800 dark:text-paper-50">Daftar</h1>
        <p className="mt-1 text-sm text-ink-400">
          Buat akun untuk menyimpan catatan kamu.
        </p>
        <div className="mt-6">
          <RegisterForm />
        </div>
        <div className="mt-4 text-center text-sm">
          <span className="text-ink-400">Sudah punya akun? </span>
          <Link href={ROUTES.login} className="text-accent-600 hover:underline dark:text-accent-300">
            Masuk
          </Link>
        </div>
      </div>
    </main>
  );
}

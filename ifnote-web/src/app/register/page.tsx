import Link from "next/link";
import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/AuthCard";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { SocialAuthButtons } from "@/components/auth/SocialAuthButtons";
import { ROUTES } from "@/lib/constants";

export const metadata: Metadata = { title: "Daftar · ifNote" };

export default function RegisterPage() {
  return (
    <AuthCard
      overline="はじめましょう"
      title="Buat akun ifNote"
      description={
        <>
          Sudah punya akun?{" "}
          <Link
            href={ROUTES.login}
            className="font-medium text-accent-600 underline-offset-4 hover:underline dark:text-accent-400"
          >
            Masuk
          </Link>
        </>
      }
      footer={
        <>
          <Divider>atau daftar dengan</Divider>
          <div className="mt-4">
            <SocialAuthButtons intent="register" />
          </div>
        </>
      }
    >
      <RegisterForm />
    </AuthCard>
  );
}

function Divider({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex items-center">
      <div className="flex-1 border-t border-paper-200 dark:border-ink-700" />
      <span className="px-3 text-xs uppercase tracking-wider text-ink-400">
        {children}
      </span>
      <div className="flex-1 border-t border-paper-200 dark:border-ink-700" />
    </div>
  );
}

import Link from "next/link";
import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/AuthCard";
import { LoginForm } from "@/components/auth/LoginForm";
import { SocialAuthButtons } from "@/components/auth/SocialAuthButtons";
import { ROUTES } from "@/lib/constants";

export const metadata: Metadata = { title: "Masuk · ifNote" };

export default function LoginPage() {
  return (
    <AuthCard
      overline="ようこそ・おかえり"
      title="Masuk ke ifNote"
      description={
        <>
          Belum punya akun?{" "}
          <Link
            href={ROUTES.register}
            className="font-medium text-accent-600 underline-offset-4 hover:underline dark:text-accent-400"
          >
            Daftar
          </Link>
        </>
      }
      footer={
        <>
          <Divider>atau lanjut dengan</Divider>
          <div className="mt-4">
            <SocialAuthButtons intent="login" />
          </div>
          <div className="mt-5 text-center text-sm">
            <Link
              href={ROUTES.forgotPassword}
              className="text-ink-400 underline-offset-4 hover:text-ink-700 hover:underline dark:hover:text-paper-50"
            >
              Lupa password?
            </Link>
          </div>
        </>
      }
    >
      <LoginForm />
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

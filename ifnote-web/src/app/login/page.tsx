import Link from "next/link";
import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/AuthCard";
import { LoginForm } from "@/components/auth/LoginForm";
import { FOCUS_RING } from "@/components/site/focus";
import { ROUTES } from "@/lib/constants";

export const metadata: Metadata = { title: "Masuk · ifNote" };

export default function LoginPage() {
  return (
    <AuthCard
      title="Masuk ke ifNote"
      description={
        <>
          Lanjutkan belajarmu. Belum punya akun?{" "}
          <Link
            href={ROUTES.register}
            className={`rounded font-medium text-accent-700 underline-offset-4 hover:underline dark:text-accent-300 ${FOCUS_RING}`}
          >
            Buat akun
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthCard>
  );
}

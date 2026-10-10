import Link from "next/link";
import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/AuthCard";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { FOCUS_RING } from "@/components/site/focus";
import { ROUTES } from "@/lib/constants";

export const metadata: Metadata = { title: "Daftar · ifNote" };

export default function RegisterPage() {
  return (
    <AuthCard
      title="Buat akun ifNote"
      description={
        <>
          Cukup nama, email, dan password untuk mulai mencatat. Sudah punya akun?{" "}
          <Link
            href={ROUTES.login}
            className={`rounded font-medium text-accent-700 underline-offset-4 hover:underline dark:text-accent-300 ${FOCUS_RING}`}
          >
            Masuk
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthCard>
  );
}

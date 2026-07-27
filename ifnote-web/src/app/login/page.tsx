import Link from "next/link";
import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthDivider } from "@/components/auth/AuthDivider";
import { LoginForm } from "@/components/auth/LoginForm";
import { SocialAuthButtons } from "@/components/auth/SocialAuthButtons";
import { ROUTES } from "@/lib/constants";

export const metadata: Metadata = { title: "Masuk · ifNote" };

export default function LoginPage() {
  return (
    <AuthCard
      overline="おかえりなさい"
      title="Masuk ke ifNote"
      description={
        <>
          Lanjutkan perjalanan bahasa Jepangmu. Belum punya akun?{" "}
          <Link
            href={ROUTES.register}
            className="font-medium text-accent-600 underline-offset-4 hover:underline dark:text-accent-400"
          >
            Daftar gratis
          </Link>
        </>
      }
      footer={
        <>
          <AuthDivider>atau lanjut dengan</AuthDivider>
          <div className="mt-4">
            <SocialAuthButtons intent="login" />
          </div>
        </>
      }
    >
      <LoginForm />
    </AuthCard>
  );
}

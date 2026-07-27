import Link from "next/link";
import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthDivider } from "@/components/auth/AuthDivider";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { SocialAuthButtons } from "@/components/auth/SocialAuthButtons";
import { ROUTES } from "@/lib/constants";

export const metadata: Metadata = { title: "Daftar · ifNote" };

export default function RegisterPage() {
  return (
    <AuthCard
      overline="はじめまして"
      title="Buat akun ifNote"
      description={
        <>
          Mulai catat kotoba dan bunpou-mu hari ini. Sudah punya akun?{" "}
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
          <AuthDivider>atau daftar dengan</AuthDivider>
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

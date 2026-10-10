"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { useAuth } from "@/features/auth/AuthProvider";
import { ApiError } from "@/lib/api-client";
import { authErrorMessage } from "@/lib/auth-errors";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { FormError } from "@/components/auth/FormError";
import { FOCUS_RING } from "@/components/site/focus";
import { ROUTES } from "@/lib/constants";
import { notify } from "@/lib/toast";

const schema = z.object({
  // trim: keyboard HP sering menambah spasi di akhir email.
  email: z.string().trim().email("Email tidak valid"),
  password: z.string().min(1, "Password wajib diisi").max(128, "Password maksimal 128 karakter"),
});

type FormValues = z.infer<typeof schema>;

export function LoginForm() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Sudah masuk: langsung ke aplikasi, jangan tampilkan form lagi.
  useEffect(() => {
    if (authClient.hasToken()) router.replace(ROUTES.app.home);
  }, [router]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    setFormError(null);
    try {
      await authClient.login(values);
      await refresh();
      notify.success("Berhasil masuk", "Selamat belajar lagi di ifNote.");
      router.replace(ROUTES.app.home);
    } catch (e) {
      // Satu pesan inline saja (role="alert"); toast di sini akan dibacakan dua kali.
      setFormError(authErrorMessage("login", e instanceof ApiError ? e.status : 0));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <TextInput
        label="Email"
        type="email"
        autoComplete="email"
        placeholder="kamu@email.com"
        {...form.register("email")}
        error={form.formState.errors.email?.message}
      />
      <PasswordInput
        label="Password"
        autoComplete="current-password"
        placeholder="••••••••"
        {...form.register("password")}
        error={form.formState.errors.password?.message}
      />
      <div className="-mt-2 flex justify-end">
        <Link
          href={ROUTES.forgotPassword}
          className={`inline-flex min-h-11 items-center rounded text-sm text-ink-400 underline-offset-4 hover:text-accent-700 hover:underline dark:hover:text-accent-300 ${FOCUS_RING}`}
        >
          Lupa password?
        </Link>
      </div>
      <FormError message={formError} />
      <Button type="submit" loading={submitting} className="min-h-11 w-full">
        Masuk
      </Button>
    </form>
  );
}

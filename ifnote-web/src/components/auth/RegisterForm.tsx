"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { useAuth } from "@/features/auth/AuthProvider";
import { ApiError } from "@/lib/api-client";
import { authErrorMessage } from "@/lib/auth-errors";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { FormError } from "@/components/auth/FormError";
import { ROUTES } from "@/lib/constants";
import { notify } from "@/lib/toast";

// Batas mengikuti RegisterDto di ifnote-api (nama 80, password 8 sampai 128).
// Tanpa kolom konfirmasi: tombol lihat password sudah mencegah salah ketik.
const schema = z.object({
  name: z.string().trim().min(1, "Nama wajib diisi").max(80, "Nama maksimal 80 karakter"),
  email: z.string().trim().email("Email tidak valid"),
  password: z
    .string()
    .min(8, "Password minimal 8 karakter")
    .max(128, "Password maksimal 128 karakter"),
});

type FormValues = z.infer<typeof schema>;

export function RegisterForm() {
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
    defaultValues: { name: "", email: "", password: "" },
  });

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    setFormError(null);
    try {
      await authClient.register(values);
      await refresh();
      notify.success("Akun dibuat", "Selamat datang di ifNote.");
      router.replace(ROUTES.app.home);
    } catch (e) {
      // Satu pesan inline saja (role="alert"); toast di sini akan dibacakan dua kali.
      setFormError(authErrorMessage("register", e instanceof ApiError ? e.status : 0));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <TextInput
        label="Nama"
        type="text"
        autoComplete="name"
        placeholder="Nama kamu"
        {...form.register("name")}
        error={form.formState.errors.name?.message}
      />
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
        autoComplete="new-password"
        placeholder="••••••••"
        hint="Minimal 8 karakter"
        {...form.register("password")}
        error={form.formState.errors.password?.message}
      />
      <FormError message={formError} />
      <Button type="submit" loading={submitting} className="min-h-11 w-full">
        Buat akun
      </Button>
    </form>
  );
}

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { useAuth } from "@/features/auth/AuthProvider";
import { ApiError } from "@/lib/api-client";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { ROUTES } from "@/lib/constants";
import { notify } from "@/lib/toast";
import { mapApiErrorToUserMessage } from "@/lib/error-mapper";

const schema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

type FormValues = z.infer<typeof schema>;

export function LoginForm() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      await authClient.login(values);
      await refresh();
      notify.success("Berhasil masuk", "Selamat belajar lagi di ifNote.", { icon: "🌸" });
      router.replace(ROUTES.app.home);
    } catch (e) {
      // Pada endpoint login, 401 = kombinasi email/password salah (atau
      // akun belum terdaftar), BUKAN "sesi berakhir". Tangani eksplisit
      // supaya pesan tidak menyesatkan.
      if (e instanceof ApiError && e.status === 401) {
        notify.warning(
          "Gagal masuk",
          "Email atau password salah. Belum punya akun? Daftar dulu.",
        );
      } else {
        const m = mapApiErrorToUserMessage(e, {
          title: "Gagal masuk",
          message: "Cek email dan password kamu.",
        });
        notify[m.variant](m.title, m.message);
      }
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
      <TextInput
        label="Password"
        type="password"
        autoComplete="current-password"
        placeholder="••••••••"
        {...form.register("password")}
        error={form.formState.errors.password?.message}
      />
      <Button type="submit" loading={submitting} className="w-full">
        Masuk
      </Button>
    </form>
  );
}

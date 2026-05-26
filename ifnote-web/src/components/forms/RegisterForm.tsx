"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { ApiError } from "@/lib/api-client";
import { useAuth } from "@/features/auth/AuthProvider";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { ROUTES } from "@/lib/constants";
import { toast } from "@/components/feedback/Toast";

const schema = z
  .object({
    name: z.string().trim().min(1, "Nama wajib diisi").max(80, "Maks 80 karakter"),
    email: z.string().email("Email tidak valid"),
    password: z.string().min(8, "Password minimal 8 karakter"),
    confirmPassword: z.string().min(1, "Konfirmasi password wajib"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Konfirmasi password tidak cocok",
  });

type FormValues = z.infer<typeof schema>;

export function RegisterForm() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      await authClient.register({
        name: values.name,
        email: values.email,
        password: values.password,
      });
      await refresh();
      toast("Akun berhasil dibuat", "success");
      router.replace(ROUTES.app.home);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Tidak bisa membuat akun";
      toast(msg, "error");
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
        {...form.register("name")}
        error={form.formState.errors.name?.message}
      />
      <TextInput
        label="Email"
        type="email"
        autoComplete="email"
        {...form.register("email")}
        error={form.formState.errors.email?.message}
      />
      <TextInput
        label="Password"
        type="password"
        autoComplete="new-password"
        hint="Minimal 8 karakter"
        {...form.register("password")}
        error={form.formState.errors.password?.message}
      />
      <TextInput
        label="Konfirmasi Password"
        type="password"
        autoComplete="new-password"
        {...form.register("confirmPassword")}
        error={form.formState.errors.confirmPassword?.message}
      />
      <Button type="submit" loading={submitting} className="w-full">
        Daftar
      </Button>
    </form>
  );
}

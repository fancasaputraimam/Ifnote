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
      toast("Selamat datang kembali", "success");
      router.replace(ROUTES.app.home);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Tidak bisa login";
      toast(msg, "error");
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
        {...form.register("email")}
        error={form.formState.errors.email?.message}
      />
      <TextInput
        label="Password"
        type="password"
        autoComplete="current-password"
        {...form.register("password")}
        error={form.formState.errors.password?.message}
      />
      <Button type="submit" loading={submitting} className="w-full">
        Masuk
      </Button>
    </form>
  );
}

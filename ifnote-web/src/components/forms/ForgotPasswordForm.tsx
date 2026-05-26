"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { toast } from "@/components/feedback/Toast";

const schema = z.object({
  email: z.string().email("Email tidak valid"),
});

type FormValues = z.infer<typeof schema>;

export function ForgotPasswordForm() {
  const [submitting, setSubmitting] = useState(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (_values: FormValues) => {
    setSubmitting(true);
    // Backend forgot/reset password endpoints belum siap di fase ini.
    // Kita tampilkan pesan netral biar user tahu langkah berikutnya.
    setTimeout(() => {
      toast(
        "Fitur reset password akan tersedia setelah email service di-konfigurasi.",
        "info",
      );
      setSubmitting(false);
    }, 600);
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
      <Button type="submit" loading={submitting} className="w-full">
        Kirim Tautan Reset
      </Button>
    </form>
  );
}

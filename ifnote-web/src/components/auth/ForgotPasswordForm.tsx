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

/**
 * Forgot password form. Backend reset/email service belum tersedia di
 * fase ini, jadi submit hanya menampilkan toast netral. Tidak fake-success.
 */
export function ForgotPasswordForm() {
  const [submitting, setSubmitting] = useState(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (_values: FormValues) => {
    setSubmitting(true);
    // Simulasi network round-trip kecil agar loading state terlihat,
    // lalu beri pesan netral.
    setTimeout(() => {
      toast("Fitur reset password belum aktif", "info");
      setSubmitting(false);
    }, 500);
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
      <Button type="submit" loading={submitting} className="w-full">
        Kirim link reset
      </Button>
    </form>
  );
}

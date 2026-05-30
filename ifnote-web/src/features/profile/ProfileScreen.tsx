"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PageHeader } from "@/components/ui/PageHeader";
import { NotebookCard } from "@/components/ui/NotebookCard";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { LoadingState } from "@/components/feedback/LoadingState";
import { notify } from "@/lib/toast";
import { mapApiErrorToUserMessage } from "@/lib/error-mapper";
import { useAuth } from "@/features/auth/AuthProvider";
import { getInitials } from "@/components/ui/profile-dropdown";
import { useProfile, useUpdateProfile } from "./useProfile";

const schema = z.object({
  displayName: z.string().trim().max(80).optional().or(z.literal("")),
  avatarUrl: z
    .string()
    .trim()
    .url("URL avatar tidak valid (harus diawali http/https)")
    .max(500)
    .optional()
    .or(z.literal("")),
  jlptGoal: z.string().trim().max(40).optional().or(z.literal("")),
  dailyTarget: z.coerce.number().int().min(1, "Minimal 1").max(100, "Maksimal 100"),
});

type FormValues = z.infer<typeof schema>;

const JLPT_OPTIONS = ["", "N5", "N4", "N3", "N2", "N1"] as const;

export function ProfileScreen() {
  const { user, refresh } = useAuth();
  const profileQ = useProfile();
  const update = useUpdateProfile();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      displayName: "",
      avatarUrl: "",
      jlptGoal: "",
      dailyTarget: 10,
    },
  });

  useEffect(() => {
    if (!profileQ.data) return;
    form.reset({
      displayName: profileQ.data.displayName ?? "",
      avatarUrl: profileQ.data.avatarUrl ?? "",
      jlptGoal: profileQ.data.jlptGoal ?? "",
      dailyTarget: profileQ.data.dailyTarget ?? 10,
    });
  }, [profileQ.data, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await update.mutateAsync({
        displayName: values.displayName?.trim() || null,
        avatarUrl: values.avatarUrl?.trim() || null,
        jlptGoal: values.jlptGoal?.trim() || null,
        dailyTarget: values.dailyTarget,
      });
      // Sinkronkan nama/avatar yang dipakai di header (dropdown profil).
      await refresh();
      notify.success("Profil disimpan", "Perubahan kamu sudah diperbarui.", {
        icon: "🌸",
      });
    } catch (e) {
      const m = mapApiErrorToUserMessage(e, {
        title: "Gagal menyimpan profil",
        message: "Coba lagi sebentar.",
      });
      notify[m.variant](m.title, m.message);
    }
  });

  const email = user?.email ?? "";
  const liveName = form.watch("displayName")?.trim() || user?.name?.trim() || email.split("@")[0] || "User";
  const liveAvatar = form.watch("avatarUrl")?.trim() || user?.avatarUrl || null;
  const initials = getInitials(user?.name?.trim() || email || "User");

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="🙂 Akun"
        title="Profil"
        subtitle="Atur nama tampilan, avatar, dan target belajarmu."
      />

      {profileQ.isLoading ? (
        <LoadingState label="Memuat profil…" />
      ) : (
        <NotebookCard className="p-5">
          {/* Preview header */}
          <div className="flex items-center gap-4 border-b border-paper-200 pb-4 dark:border-ink-700">
            <span className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-accent-400 to-lilac-500 text-lg font-semibold uppercase text-white">
              {liveAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={liveAvatar} alt={liveName} className="h-full w-full object-cover" />
              ) : (
                initials
              )}
            </span>
            <div className="min-w-0">
              <div className="truncate text-lg font-semibold text-ink-800 dark:text-paper-50">
                {liveName}
              </div>
              <div className="truncate text-sm text-ink-400">{email || "—"}</div>
            </div>
          </div>

          <form className="mt-4 space-y-4" onSubmit={onSubmit} noValidate>
            <TextInput
              label="Nama tampilan"
              {...form.register("displayName")}
              error={form.formState.errors.displayName?.message}
              placeholder="mis. Fanca"
            />
            <TextInput
              label="URL avatar"
              {...form.register("avatarUrl")}
              error={form.formState.errors.avatarUrl?.message}
              placeholder="https://… (opsional)"
              hint="Kosongkan untuk pakai inisial."
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-ink-700 dark:text-paper-50">
                  Target JLPT
                </span>
                <select
                  {...form.register("jlptGoal")}
                  className="block w-full rounded-xl border border-paper-200 bg-white px-3 py-2 text-sm dark:border-ink-700 dark:bg-ink-800 dark:text-paper-50"
                >
                  {JLPT_OPTIONS.map((o) => (
                    <option key={o || "none"} value={o}>
                      {o || "— Belum ditentukan —"}
                    </option>
                  ))}
                </select>
              </label>
              <TextInput
                label="Target harian (item)"
                type="number"
                inputMode="numeric"
                {...form.register("dailyTarget")}
                error={form.formState.errors.dailyTarget?.message}
                placeholder="10"
              />
            </div>

            <div className="flex items-center gap-3 pt-1">
              <Button type="submit" loading={update.isPending}>
                Simpan profil
              </Button>
              <span className="text-xs text-ink-400">
                Email akun tidak bisa diubah di sini.
              </span>
            </div>
          </form>
        </NotebookCard>
      )}
    </div>
  );
}

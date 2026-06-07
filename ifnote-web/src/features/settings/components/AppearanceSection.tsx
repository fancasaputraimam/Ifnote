"use client";

import { useEffect, useState } from "react";
import { Palette, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SettingsSection } from "@/components/ui/SettingsSection";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { notify } from "@/lib/toast";
import { mapApiErrorToUserMessage } from "@/lib/error-mapper";
import { useTheme } from "@/features/settings/ThemeProvider";
import { useSettings, useUpdateSettings } from "@/features/settings/useSettings";
import { normalizeJpMode } from "@/hooks/useJapaneseMode";
import type { JpMode, ThemeMode } from "@/lib/types";
import { cn } from "@/lib/utils";

export function AppearanceSection() {
  const { setTheme } = useTheme();
  const settingsQ = useSettings();
  const update = useUpdateSettings();

  const [theme, setThemePref] = useState<ThemeMode>("system");
  const [jpMode, setJpMode] = useState<JpMode>("beginner");

  useEffect(() => {
    if (!settingsQ.data) return;
    setThemePref(settingsQ.data.theme);
    setJpMode(normalizeJpMode(settingsQ.data.jpMode));
  }, [settingsQ.data]);

  const onSave = async () => {
    try {
      await update.mutateAsync({ theme, jpMode });
      setTheme(theme);
      notify.success("Tampilan disimpan", "Preferensi kamu sudah diperbarui.", {
        icon: "⚙️",
      });
    } catch (e) {
      const m = mapApiErrorToUserMessage(e, {
        title: "Gagal menyimpan tampilan",
        message: "Coba lagi sebentar.",
      });
      notify[m.variant](m.title, m.message);
    }
  };

  /** Mode Jepang global → auto-save begitu user pilih option baru. */
  const onChangeJpMode = async (next: JpMode) => {
    if (next === jpMode) return;
    setJpMode(next);
    try {
      await update.mutateAsync({ jpMode: next });
      notify.success("Mode Jepang diperbarui", "Tampilan bacaan sudah disesuaikan.", {
        icon: "⚙️",
      });
    } catch (e) {
      setJpMode(normalizeJpMode(settingsQ.data?.jpMode));
      const m = mapApiErrorToUserMessage(e, {
        title: "Gagal mengubah Mode Jepang",
        message: "Coba lagi sebentar.",
      });
      notify[m.variant](m.title, m.message);
    }
  };

  return (
    <SettingsSection
      icon={<Palette className="h-5 w-5" />}
      title="Tampilan"
      description="Atur theme dan cara teks Jepang ditampilkan."
    >
      <fieldset>
        <legend className="text-xs font-medium uppercase tracking-wide text-ink-400">
          Theme
        </legend>
        <div className="mt-2">
          <SegmentedControl<ThemeMode>
            layoutId="settings-theme"
            aria-label="Pilih theme"
            value={theme}
            onChange={setThemePref}
            options={[
              { value: "system", label: "Sistem" },
              { value: "light", label: "Terang" },
              { value: "dark", label: "Gelap" },
            ]}
          />
        </div>
      </fieldset>

      <fieldset className="mt-6">
        <legend className="text-xs font-medium uppercase tracking-wide text-ink-400">
          Mode Jepang
        </legend>
        <p className="mt-1 text-xs text-ink-400">
          Berlaku di Catatan, Hafalan, Quiz, Home, dan KanjiPopup. Perubahan
          langsung diterapkan.
        </p>
        <div
          role="radiogroup"
          aria-label="Mode tampilan teks Jepang"
          className="mt-3 grid gap-2 sm:grid-cols-3"
        >
          {JP_MODE_OPTIONS.map((opt) => {
            const active = jpMode === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                role="radio"
                aria-checked={active}
                disabled={update.isPending}
                onClick={() => onChangeJpMode(opt.id)}
                className={cn(
                  "group relative flex flex-col items-start rounded-2xl p-3.5 text-left ring-1 ring-inset transition-[box-shadow,background-color]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400",
                  active
                    ? "bg-accent-50/70 ring-accent-300 dark:bg-accent-500/10 dark:ring-accent-400/40"
                    : "bg-white ring-paper-300 hover:ring-paper-400 hover:bg-paper-50/60 dark:bg-ink-800 dark:ring-ink-700 dark:hover:bg-ink-700/60",
                )}
              >
                <span
                  className={cn(
                    "absolute right-3 top-3 grid h-5 w-5 place-items-center rounded-full ring-1 ring-inset transition-colors",
                    active
                      ? "bg-accent-gradient text-white ring-transparent"
                      : "text-transparent ring-paper-300 group-hover:ring-accent-300 dark:ring-ink-600",
                  )}
                  aria-hidden
                >
                  <Check className="h-3 w-3" />
                </span>
                <span
                  className="font-jp text-lg leading-snug text-ink-800 dark:text-paper-50"
                  aria-hidden
                >
                  {opt.preview}
                </span>
                <span className="mt-1.5 text-sm font-semibold text-ink-800 dark:text-paper-50">
                  {opt.label}
                </span>
                <span className="mt-0.5 text-xs leading-snug text-ink-500 dark:text-paper-50/70">
                  {opt.helper}
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button onClick={onSave} loading={update.isPending}>
          Simpan tampilan
        </Button>
        <span className="text-xs text-ink-400">
          Theme disimpan di sini. Mode Jepang sudah auto-save.
        </span>
      </div>
    </SettingsSection>
  );
}

interface JpModeOption {
  id: JpMode;
  label: string;
  helper: string;
  preview: string;
}

const JP_MODE_OPTIONS: JpModeOption[] = [
  { id: "beginner", label: "Pemula", helper: "Hiragana/katakana tanpa kanji", preview: "たべます" },
  { id: "normal", label: "Normal", helper: "Kanji dengan furigana", preview: "食(た)べます" },
  { id: "pro", label: "Pro", helper: "Kanji saja", preview: "食べます" },
];

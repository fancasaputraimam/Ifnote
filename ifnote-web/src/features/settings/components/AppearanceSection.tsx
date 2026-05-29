"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { NotebookCard } from "@/components/ui/NotebookCard";
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
  const [jpMode, setJpMode] = useState<JpMode>("kana");

  // Hydrate from server settings once. Lewatkan via `normalizeJpMode`
  // supaya legacy values ("beginner"/"normal") yang masih nyangkut di
  // DB ter-translate ke nilai canonical baru.
  useEffect(() => {
    if (!settingsQ.data) return;
    setThemePref(settingsQ.data.theme);
    setJpMode(normalizeJpMode(settingsQ.data.jpMode));
  }, [settingsQ.data]);

  const onSave = async () => {
    try {
      await update.mutateAsync({ theme, jpMode });
      setTheme(theme); // apply locally too
      notify.success(
        "Tampilan disimpan",
        "Preferensi kamu sudah diperbarui.",
        { icon: "⚙️" },
      );
    } catch (e) {
      const m = mapApiErrorToUserMessage(e, {
        title: "Gagal menyimpan tampilan",
        message: "Coba lagi sebentar.",
      });
      notify[m.variant](m.title, m.message);
    }
  };

  /**
   * Mode Jepang berlaku global di semua halaman, jadi auto-save begitu
   * user pilih option baru — supaya UI Catatan / Hafalan / Quiz update
   * tanpa harus tekan tombol Simpan dulu.
   */
  const onChangeJpMode = async (next: JpMode) => {
    if (next === jpMode) return;
    setJpMode(next);
    try {
      await update.mutateAsync({ jpMode: next });
      notify.success(
        "Mode Jepang diperbarui",
        JP_MODE_OPTIONS.find((o) => o.id === next)?.helper,
        { icon: "⚙️" },
      );
    } catch (e) {
      // Rollback ke nilai server kalau gagal.
      setJpMode(normalizeJpMode(settingsQ.data?.jpMode));
      const m = mapApiErrorToUserMessage(e, {
        title: "Gagal mengubah Mode Jepang",
        message: "Coba lagi sebentar.",
      });
      notify[m.variant](m.title, m.message);
    }
  };

  return (
    <NotebookCard className="p-5">
      <h2 className="text-base font-semibold text-ink-800 dark:text-paper-50">
        Tampilan
      </h2>
      <p className="mt-1 text-xs text-ink-400">
        Atur theme dan cara teks Jepang ditampilkan.
      </p>

      <fieldset className="mt-3">
        <legend className="text-xs uppercase tracking-wide text-ink-400">Theme</legend>
        <div className="mt-2 inline-flex rounded-full border border-paper-200 bg-white p-0.5 text-xs dark:border-ink-700 dark:bg-ink-800">
          {(["system", "light", "dark"] as const).map((t) => (
            <ToggleButton
              key={t}
              active={theme === t}
              onClick={() => setThemePref(t)}
              label={t === "system" ? "Sistem" : t === "light" ? "Terang" : "Gelap"}
            />
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-5">
        <legend className="text-xs uppercase tracking-wide text-ink-400">
          Mode Jepang
        </legend>
        <p className="mt-1 text-xs text-ink-400">
          Berlaku di Catatan, Hafalan, Quiz, Home, dan KanjiPopup. Pilih satu
          — perubahan langsung diterapkan.
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
                  "group relative flex flex-col items-start rounded-2xl border px-3.5 py-3 text-left transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400",
                  active
                    ? "border-accent-400 bg-accent-50/70 dark:border-accent-500/60 dark:bg-accent-700/15"
                    : "border-paper-200 bg-white hover:border-accent-200 hover:bg-paper-50/60 dark:border-ink-700 dark:bg-ink-800 dark:hover:bg-ink-700/60",
                )}
              >
                <span
                  className={cn(
                    "absolute right-3 top-3 grid h-5 w-5 place-items-center rounded-full border text-[11px] font-semibold",
                    active
                      ? "border-accent-500 bg-accent-500 text-white"
                      : "border-paper-200 text-transparent group-hover:border-accent-300 dark:border-ink-700",
                  )}
                  aria-hidden
                >
                  ✓
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

      <div className="mt-5">
        <Button onClick={onSave} loading={update.isPending}>
          Simpan tampilan
        </Button>
        <span className="ml-3 text-xs text-ink-400">
          Theme disimpan di sini. Mode Jepang sudah auto-save.
        </span>
      </div>
    </NotebookCard>
  );
}

interface JpModeOption {
  id: JpMode;
  label: string;
  helper: string;
  /** Mini preview dipakai sebagai accent text di kartu pilihan. */
  preview: string;
}

const JP_MODE_OPTIONS: JpModeOption[] = [
  {
    id: "kana",
    label: "Pemula",
    helper: "Hanya hiragana / katakana. Kanji diganti dengan bacaannya.",
    preview: "たべます",
  },
  {
    id: "furigana",
    label: "Normal",
    helper: "Kanji dengan furigana di atasnya.",
    preview: "食(た)べます",
  },
  {
    id: "kanji",
    label: "Pro",
    helper: "Kanji bersih, tanpa furigana.",
    preview: "食べます",
  },
];

function ToggleButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full px-3 py-1.5 font-medium transition-colors",
        active
          ? "bg-accent-500 text-white"
          : "text-ink-700 hover:bg-paper-100 dark:text-paper-50 dark:hover:bg-ink-700",
      )}
    >
      {label}
    </button>
  );
}

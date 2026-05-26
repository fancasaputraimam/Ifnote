"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { NotebookCard } from "@/components/ui/NotebookCard";
import { ApiError } from "@/lib/api-client";
import { toast } from "@/components/feedback/Toast";
import { useTheme } from "@/features/settings/ThemeProvider";
import { useSettings, useUpdateSettings } from "@/features/settings/useSettings";
import type { JpMode, ThemeMode } from "@/lib/types";
import { cn } from "@/lib/utils";

export function AppearanceSection() {
  const { setTheme } = useTheme();
  const settingsQ = useSettings();
  const update = useUpdateSettings();

  const [theme, setThemePref] = useState<ThemeMode>("system");
  const [jpMode, setJpMode] = useState<JpMode>("beginner");

  // Hydrate from server settings once
  useEffect(() => {
    if (!settingsQ.data) return;
    setThemePref(settingsQ.data.theme);
    setJpMode(settingsQ.data.jpMode);
  }, [settingsQ.data]);

  const onSave = async () => {
    try {
      await update.mutateAsync({ theme, jpMode });
      setTheme(theme); // apply locally too
      toast("Preferensi tampilan disimpan", "success");
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Gagal menyimpan";
      toast(msg, "error");
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

      <fieldset className="mt-4">
        <legend className="text-xs uppercase tracking-wide text-ink-400">Mode Jepang</legend>
        <div className="mt-2 inline-flex flex-wrap gap-1 rounded-full border border-paper-200 bg-white p-0.5 text-xs dark:border-ink-700 dark:bg-ink-800">
          {(["beginner", "normal", "furigana"] as const).map((m) => (
            <ToggleButton
              key={m}
              active={jpMode === m}
              onClick={() => setJpMode(m)}
              label={m === "beginner" ? "Pemula" : m === "normal" ? "Normal" : "Furigana"}
            />
          ))}
        </div>
        <p className="mt-2 text-xs text-ink-400">
          Pemula pakai hiragana saja. Normal pakai kanji standar. Furigana
          tampilkan bacaan kecil di atas kanji.
        </p>
      </fieldset>

      <div className="mt-4">
        <Button onClick={onSave} loading={update.isPending}>
          Simpan tampilan
        </Button>
      </div>
    </NotebookCard>
  );
}

function ToggleButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
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

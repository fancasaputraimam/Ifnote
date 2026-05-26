"use client";

import { LoadingState } from "@/components/feedback/LoadingState";
import { useSettings } from "./useSettings";
import { AccountSection } from "./components/AccountSection";
import { AppearanceSection } from "./components/AppearanceSection";
import { AiConfigSection } from "./components/AiConfigSection";
import { BackupSection } from "./components/BackupSection";
import { DangerZone } from "./components/DangerZone";

export function SettingsScreen() {
  const settingsQ = useSettings();

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <div className="text-xs font-medium uppercase tracking-wide text-accent-600 dark:text-accent-300">
          ⚙️ Preferensi Belajar
        </div>
        <h1 className="text-2xl font-semibold text-ink-800 dark:text-paper-50 sm:text-3xl">
          Settings
        </h1>
        <p className="text-sm text-ink-400">
          Atur tampilan, mode Jepang, AI, dan backup data.
        </p>
      </header>

      {settingsQ.isLoading ? (
        <LoadingState label="Memuat preferensi…" />
      ) : (
        <div className="space-y-4">
          <AccountSection />
          <AppearanceSection />
          <AiConfigSection />
          <BackupSection />
          <DangerZone />
        </div>
      )}
    </div>
  );
}

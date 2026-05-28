"use client";

import { LoadingState } from "@/components/feedback/LoadingState";
import { PageHeader } from "@/components/ui/PageHeader";
import { useSettings } from "./useSettings";
import { AccountSection } from "./components/AccountSection";
import { AppearanceSection } from "./components/AppearanceSection";
import { AiConfigSection } from "./components/AiConfigSection";
import { BackupSection } from "./components/BackupSection";
import { DangerZone } from "./components/DangerZone";

export function SettingsScreen() {
  const settingsQ = useSettings();
  const settings = settingsQ.data;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="⚙️ Preferensi Belajar"
        title="Settings"
        subtitle="Atur tampilan, mode Jepang, AI, dan backup data."
      />

      {settingsQ.isLoading ? (
        <LoadingState label="Memuat preferensi…" />
      ) : (
        <div className="space-y-4">
          <AccountSection />
          <AppearanceSection />
          {settings?.canManageAi ? <AiConfigSection /> : null}
          <BackupSection />
          <DangerZone />
        </div>
      )}
    </div>
  );
}

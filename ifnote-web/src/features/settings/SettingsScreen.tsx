"use client";

import { motion } from "framer-motion";
import { LoadingState } from "@/components/feedback/LoadingState";
import { PageHeader } from "@/components/ui/PageHeader";
import { useSettings } from "./useSettings";
import { AccountSection } from "./components/AccountSection";
import { AppearanceSection } from "./components/AppearanceSection";
import { AiConfigSection } from "./components/AiConfigSection";
import { BackupSection } from "./components/BackupSection";
import { DangerZone } from "./components/DangerZone";

const item = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 0.61, 0.36, 1] as const } },
};

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
        <motion.div
          className="space-y-4"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.07 } } }}
        >
          <motion.div variants={item}>
            <AccountSection />
          </motion.div>
          <motion.div variants={item}>
            <AppearanceSection />
          </motion.div>
          {settings?.canManageAi ? (
            <motion.div variants={item}>
              <AiConfigSection />
            </motion.div>
          ) : null}
          <motion.div variants={item}>
            <BackupSection />
          </motion.div>
          <motion.div variants={item}>
            <DangerZone />
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

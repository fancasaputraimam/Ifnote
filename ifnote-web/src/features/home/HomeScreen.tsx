"use client";

import { motion } from "framer-motion";
import { LoadingState } from "@/components/feedback/LoadingState";
import { PanelCard } from "@/components/ui/PanelCard";
import { Badge } from "@/components/ui/Badge";
import { useDashboard } from "@/features/home/useDashboard";
import { HomeHeader } from "@/features/home/components/HomeHeader";
import { WelcomeBackNotice } from "@/features/home/components/WelcomeBackNotice";
import { StatsGrid } from "@/features/home/components/StatsGrid";
import { FokusHariIniCard } from "@/features/home/components/FokusHariIniCard";
import { RecentKotobaList } from "@/features/home/components/RecentKotobaList";
import { RecentBunpouList } from "@/features/home/components/RecentBunpouList";

const sectionMotion = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-40px" },
  transition: { duration: 0.45, ease: [0.22, 0.61, 0.36, 1] as const },
};

/**
 * Home dashboard — versi simplified sesuai task spec.
 *
 * Sengaja dihilangkan dari Home:
 *   - Welcome Back card  → diganti notifikasi WelcomeBackNotice
 *   - Misi Hari Ini card → tidak ada lagi
 *   - Review/Streak stat → tidak ditampilkan di Home
 *   - Bunpou Fokus      → tidak ditampilkan di Home
 *   - Aksi Cepat        → tidak ditampilkan di Home
 *   - AI Study Plan     → tidak ditampilkan di Home
 *
 * Yang tetap ada:
 *   - Header dengan dynamic Japanese day + greeting
 *   - Kotoba & Bunpou stat (2 kartu)
 *   - Kanji Hari Ini
 *   - Recent Kotoba + Recent Bunpou
 *   - Welcome notification (sekali per session)
 */
export function HomeScreen() {
  const dash = useDashboard();

  return (
    <div className="space-y-5">
      <HomeHeader />

      {dash.isLoading ? (
        <LoadingState label="Memuat dashboard…" />
      ) : (
        <>
          {dash.isFallback ? (
            <PanelCard tone="lilac" stripe padding="compact">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="warn">Sebagian data offline</Badge>
                <p className="text-sm text-ink-700 dark:text-paper-50">
                  Sebagian data belum bisa dimuat. Konten lain tetap tersedia.
                </p>
              </div>
              {dash.errorMessage ? (
                <p className="mt-1 text-xs text-ink-400">{dash.errorMessage}</p>
              ) : null}
            </PanelCard>
          ) : null}

          <StatsGrid kotoba={dash.totals.kotoba} bunpou={dash.totals.bunpou} />

          <motion.div {...sectionMotion}>
            <FokusHariIniCard
              kanji={dash.dailyKanjiChar}
              kotoba={dash.focusKotoba}
              bunpou={dash.focusBunpou}
            />
          </motion.div>

          <motion.div {...sectionMotion} className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <RecentKotobaList items={dash.recentKotoba} />
            <RecentBunpouList items={dash.recentBunpou} />
          </motion.div>
        </>
      )}

      <WelcomeBackNotice />
    </div>
  );
}

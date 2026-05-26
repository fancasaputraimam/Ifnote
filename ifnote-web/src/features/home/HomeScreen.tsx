"use client";

import { LoadingState } from "@/components/feedback/LoadingState";
import { NotebookCard } from "@/components/ui/NotebookCard";
import { Badge } from "@/components/ui/Badge";
import { useDashboard } from "@/features/home/useDashboard";
import { HomeHeader } from "@/features/home/components/HomeHeader";
import { WelcomeBackCard } from "@/features/home/components/WelcomeBackCard";
import { TodayMissionCard } from "@/features/home/components/TodayMissionCard";
import { StatsGrid } from "@/features/home/components/StatsGrid";
import { AIStudyPlanCard } from "@/features/home/components/AIStudyPlanCard";
import { DailyKanjiCard } from "@/features/home/components/DailyKanjiCard";
import { FocusBunpouCard } from "@/features/home/components/FocusBunpouCard";
import { RecentKotobaList } from "@/features/home/components/RecentKotobaList";
import { RecentBunpouList } from "@/features/home/components/RecentBunpouList";
import { QuickActions } from "@/features/home/components/QuickActions";

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
            <NotebookCard stripe="lilac" className="p-4">
              <div className="flex items-center gap-2">
                <Badge tone="warn">Mode offline</Badge>
                <p className="text-sm text-ink-700 dark:text-paper-50">
                  Tidak bisa terhubung ke server. Beberapa data ditampilkan kosong sampai
                  koneksi pulih.
                </p>
              </div>
              {dash.errorMessage ? (
                <p className="mt-1 text-xs text-ink-400">{dash.errorMessage}</p>
              ) : null}
            </NotebookCard>
          ) : null}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <WelcomeBackCard
              reviewCount={dash.totals.review}
              streakDays={dash.totals.streakDays}
            />
            <TodayMissionCard
              done={Math.min(dash.totalQuizAnswered, 3)}
              total={dash.totalQuizAnswered === 0 ? 0 : 3}
            />
          </div>

          <StatsGrid
            kotoba={dash.totals.kotoba}
            bunpou={dash.totals.bunpou}
            review={dash.totals.review}
            streakDays={dash.totals.streakDays}
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <AIStudyPlanCard
              totalQuizAnswered={dash.totalQuizAnswered}
              suggestedPattern={dash.focusBunpou?.jpOrPattern ?? null}
            />
            <DailyKanjiCard kanji={dash.dailyKanjiChar} />
          </div>

          <FocusBunpouCard bunpou={dash.focusBunpou} />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <RecentKotobaList items={dash.recentKotoba} />
            <RecentBunpouList items={dash.recentBunpou} />
          </div>

          <QuickActions />
        </>
      )}
    </div>
  );
}

"use client";

import { ReactNode, Suspense } from "react";
import { TopBar } from "@/components/navigation/TopBar";
import { BottomNav } from "@/components/navigation/BottomNav";
import { Sidebar } from "@/components/navigation/Sidebar";
import { RouteProgress } from "@/components/feedback/RouteProgress";

interface Props {
  subtitle?: string;
  children: ReactNode;
}

export function AppShell({ subtitle, children }: Props) {
  return (
    <div className="flex min-h-screen w-full max-w-full flex-col overflow-x-hidden">
      {/* RouteProgress uses next/navigation hooks; wrap in Suspense
          to satisfy useSearchParams server-bailout. */}
      <Suspense fallback={null}>
        <RouteProgress />
      </Suspense>
      <TopBar subtitle={subtitle} />
      <div className="mx-auto flex w-full max-w-5xl flex-1">
        <Sidebar />
        <main className="app-content-bottompad min-w-0 flex-1 px-4 py-4 sm:px-6 sm:py-6">
          <div key={subtitle ?? ""} className="page-enter">
            {children}
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}

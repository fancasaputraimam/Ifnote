"use client";

import { ReactNode } from "react";
import { TopBar } from "@/components/navigation/TopBar";
import { BottomNav } from "@/components/navigation/BottomNav";
import { Sidebar } from "@/components/navigation/Sidebar";

interface Props {
  subtitle?: string;
  children: ReactNode;
}

export function AppShell({ subtitle, children }: Props) {
  return (
    <div className="min-h-screen flex flex-col">
      <TopBar subtitle={subtitle} />
      <div className="mx-auto w-full max-w-5xl flex-1 flex">
        <Sidebar />
        <main className="flex-1 px-4 py-4 sm:px-6 sm:py-6 app-content-bottompad">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}

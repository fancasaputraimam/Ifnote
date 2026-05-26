import type { Metadata } from "next";
import { HafalanScreen } from "@/features/hafalan/HafalanScreen";

export const metadata: Metadata = { title: "Hafalan · ifNote" };

export default function HafalanPage() {
  return <HafalanScreen />;
}

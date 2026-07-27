import type { Metadata } from "next";
import { HomeScreen } from "@/features/home/HomeScreen";

export const metadata: Metadata = { title: "Home · ifNote" };

export default function HomePage() {
  return <HomeScreen />;
}

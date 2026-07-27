import type { Metadata } from "next";
import { LandingScreen } from "@/features/landing/LandingScreen";

export const metadata: Metadata = {
  title: "ifNote — Belajar Bahasa Jepang dengan Tenang",
  description:
    "Catatan kotoba & bunpou, hafalan terstruktur, quiz, dan AI tutor dalam satu tempat. Dirancang untuk pelajar Indonesia level N5–N1.",
};

export default function LandingPage() {
  return <LandingScreen />;
}

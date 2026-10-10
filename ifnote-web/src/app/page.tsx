import type { Metadata } from "next";
import { LandingScreen } from "@/features/landing/LandingScreen";

export const metadata: Metadata = {
  title: "ifNote: buku catatan bahasa Jepang yang bisa menguji kamu",
  description:
    "Catat kotoba dan bunpou, hafalkan lewat slide, uji lewat quiz, dan tanya AI tutor kalau bingung. Untuk orang Indonesia yang belajar bahasa Jepang. Materi bawaan N5 dan N4.",
};

export default function LandingPage() {
  return <LandingScreen />;
}

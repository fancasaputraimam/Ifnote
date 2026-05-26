import type { Metadata } from "next";
import { AiScreen } from "@/features/ai/AiScreen";

export const metadata: Metadata = { title: "AI Tutor · ifNote" };

export default function AiPage() {
  return <AiScreen />;
}

import type { Metadata } from "next";
import { QuizScreen } from "@/features/quiz/QuizScreen";

export const metadata: Metadata = { title: "Quiz · ifNote" };

export default function QuizPage() {
  return <QuizScreen />;
}

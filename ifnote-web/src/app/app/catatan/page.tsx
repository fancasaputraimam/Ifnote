import type { Metadata } from "next";
import { CatatanScreen } from "@/features/catatan/CatatanScreen";

export const metadata: Metadata = { title: "Catatan · ifNote" };

export default function CatatanPage() {
  return <CatatanScreen />;
}

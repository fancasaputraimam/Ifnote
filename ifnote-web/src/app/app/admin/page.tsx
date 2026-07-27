import type { Metadata } from "next";
import { AdminScreen } from "@/features/admin/AdminScreen";

export const metadata: Metadata = { title: "Admin · ifNote" };

export default function AdminPage() {
  return <AdminScreen />;
}

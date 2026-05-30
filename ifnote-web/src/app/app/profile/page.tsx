import type { Metadata } from "next";
import { ProfileScreen } from "@/features/profile/ProfileScreen";

export const metadata: Metadata = { title: "Profil · ifNote" };

export default function ProfilePage() {
  return <ProfileScreen />;
}

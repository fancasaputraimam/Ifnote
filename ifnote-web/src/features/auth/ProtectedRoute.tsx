"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/AuthProvider";
import { ROUTES } from "@/lib/constants";
import { LoadingState } from "@/components/feedback/LoadingState";

interface Props {
  children: ReactNode;
}

/**
 * Client-side guard. The backend is the real authority — this only
 * prevents flicker for unauthenticated users.
 */
export function ProtectedRoute({ children }: Props) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace(ROUTES.login);
    }
  }, [loading, user, router]);

  if (loading) return <LoadingState label="Memeriksa sesi…" className="min-h-[60vh]" />;
  if (!user) return null;
  return <>{children}</>;
}

"use client";

import { ReactNode, createContext, useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { ROUTES, TOKEN_STORAGE_KEY } from "@/lib/constants";
import { ApiError } from "@/lib/api-client";
import type { MeResponse, SessionUser } from "@/lib/types";
import { safeStorage } from "@/lib/utils";

interface AuthContextValue {
  user: SessionUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

interface ProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: ProviderProps) {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!authClient.hasToken()) {
      setUser(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const me: MeResponse = await authClient.me();
      setUser({
        id: me.id,
        email: me.email,
        name: me.name,
        avatarUrl: me.avatarUrl ?? null,
        role: me.role,
        canManageAi: me.canManageAi,
      });
    } catch (e) {
      // Invalid / expired token → clear and treat as anonymous
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
        authClient.clearToken();
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await authClient.logout();
    setUser(null);
    router.replace(ROUTES.login);
  }, [router]);

  // Initial bootstrap from stored token
  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Listen for global 401 events from the api client
  useEffect(() => {
    const onUnauth = () => {
      authClient.clearToken();
      setUser(null);
      // Soft redirect — only if we're inside the app shell
      if (typeof window !== "undefined" && window.location.pathname.startsWith("/app")) {
        router.replace(ROUTES.login);
      }
    };
    window.addEventListener("ifnote:unauthorized", onUnauth);
    return () => window.removeEventListener("ifnote:unauthorized", onUnauth);
  }, [router]);

  // Cross-tab sync: if another tab logs out, reflect here
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== TOKEN_STORAGE_KEY) return;
      void refresh();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [refresh]);

  // Keep safeStorage import linked (avoid tree-shake noise on prod)
  void safeStorage;

  return (
    <AuthContext.Provider value={{ user, loading, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

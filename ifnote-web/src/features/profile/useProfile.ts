"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export interface UserProfile {
  userId: string;
  displayName: string | null;
  avatarUrl: string | null;
  jlptGoal: string | null;
  dailyTarget: number;
}

export interface UpdateProfileBody {
  displayName?: string | null;
  avatarUrl?: string | null;
  jlptGoal?: string | null;
  dailyTarget?: number;
}

const PROFILE_KEY = "profile";

export function useProfile() {
  return useQuery<UserProfile>({
    queryKey: [PROFILE_KEY],
    queryFn: () => api.get<UserProfile>("/api/users/me/profile"),
    retry: 0,
    staleTime: 60_000,
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateProfileBody) =>
      api.put<UserProfile>("/api/users/me/profile", body),
    onSuccess: (data) => {
      qc.setQueryData([PROFILE_KEY], data);
      // Nama/avatar mungkin berubah — refresh sesi user juga.
      qc.invalidateQueries({ queryKey: ["me"] });
    },
  });
}

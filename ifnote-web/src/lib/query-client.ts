"use client";

import { QueryClient } from "@tanstack/react-query";

/**
 * Single shared QueryClient instance for the app shell.
 * Created lazily so it is recreated per Next.js request on the server.
 */
export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}

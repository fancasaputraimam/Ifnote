"use client";

import { ReactNode, useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { makeQueryClient } from "@/lib/query-client";

export function QueryProvider({ children }: { children: ReactNode }) {
  // Memoise per browser session — never recreate on render
  const [client] = useState(() => makeQueryClient());
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

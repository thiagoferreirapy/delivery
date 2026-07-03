"use client";
import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { NavigationOverlay } from "@/components/NavigationOverlay";

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 1, staleTime: 5_000 } },
      })
  );
  return (
    <QueryClientProvider client={client}>
      {children}
      <NavigationOverlay />
      <Toaster richColors position="top-center" />
    </QueryClientProvider>
  );
}

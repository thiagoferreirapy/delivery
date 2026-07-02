"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "./auth-store";

// Redireciona para /login se não houver sessão. Retorna `ready` quando ok.
export function useRequireAuth(redirectTo = "/login") {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => setHydrated(true), []);
  useEffect(() => {
    if (hydrated && !token) router.replace(redirectTo);
  }, [hydrated, token, router, redirectTo]);

  return { ready: hydrated && !!token, token };
}

"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "./auth-store";

export function useRequireAuth() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  useEffect(() => {
    if (hydrated && !token) router.replace("/login");
  }, [hydrated, token, router]);
  return { ready: hydrated && !!token };
}

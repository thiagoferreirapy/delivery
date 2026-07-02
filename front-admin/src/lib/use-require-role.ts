"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { EmployeeRole } from "@cabana/shared";
import { useAuthStore } from "./auth-store";
import { canAccess, homePathForRole } from "./rbac";

// Garante sessão de funcionário + papel autorizado. Redireciona caso contrário.
export function useRequireRole(roles: EmployeeRole[]) {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => setHydrated(true), []);
  useEffect(() => {
    if (!hydrated) return;
    if (!token) {
      router.replace("/login");
    } else if (!canAccess(user?.role, roles)) {
      router.replace(homePathForRole(user?.role));
    }
  }, [hydrated, token, user, roles, router]);

  const ready = hydrated && !!token && canAccess(user?.role, roles);
  return { ready, user };
}

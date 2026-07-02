"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { homePathForRole } from "@/lib/rbac";

export default function IndexPage() {
  const router = useRouter();
  const { token, user } = useAuthStore();
  useEffect(() => {
    router.replace(token ? homePathForRole(user?.role) : "/login");
  }, [token, user, router]);
  return null;
}

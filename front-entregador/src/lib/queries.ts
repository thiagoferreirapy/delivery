"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AuthResponse, OrderDTO } from "@cabana/shared";
import { api } from "./api";
import { useAuthStore } from "./auth-store";

// Login do entregador (telefone no campo email, scope COURIER)
export function useCourierLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);
  return useMutation({
    mutationFn: (input: { phone: string; password: string }) =>
      api<AuthResponse>("/auth/login", {
        method: "POST",
        body: { email: input.phone, password: input.password, scope: "COURIER" },
        auth: false,
      }),
    onSuccess: (data) => setAuth(data.user, data.accessToken),
  });
}

export function useDeliveries(history = false) {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["deliveries", history],
    queryFn: () => api<OrderDTO[]>(`/courier/deliveries${history ? "?history=1" : ""}`),
    enabled: !!token,
    refetchInterval: history ? false : 8000,
  });
}

export function useDelivery(id: string) {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["delivery", id],
    queryFn: () => api<OrderDTO>(`/orders/${id}`),
    enabled: !!token && !!id,
  });
}

export function useDeliveryAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      action,
      photoUrl,
      paymentConfirmed,
    }: {
      id: string;
      action: "pickup" | "start-route" | "deliver";
      photoUrl?: string;
      paymentConfirmed?: boolean;
    }) =>
      api<OrderDTO>(`/courier/deliveries/${id}`, {
        method: "PATCH",
        body: { action, photoUrl, paymentConfirmed },
      }),
    onSuccess: (o) => {
      qc.invalidateQueries({ queryKey: ["deliveries"] });
      qc.invalidateQueries({ queryKey: ["delivery", o.id] });
    },
  });
}

export function useUpdateLocation() {
  return useMutation({
    mutationFn: (loc: { lat: number; lng: number }) =>
      api("/courier/location", { method: "PATCH", body: loc }),
  });
}

"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AuthResponse, OrderDTO, OrderMessageDTO, OrderMessagesResponse, CourierFullDTO } from "@cabana/shared";
import { api } from "./api";
import { useAuthStore } from "./auth-store";

// ===== Perfil do entregador =====
export function useCourierProfile() {
  const token = useAuthStore((s) => s.token);
  return useQuery({ queryKey: ["courier-profile"], queryFn: () => api<CourierFullDTO>("/courier/profile"), enabled: !!token });
}
export function useUpdateCourierProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { name?: string; photoUrl?: string | null }) =>
      api<CourierFullDTO>("/courier/profile", { method: "PATCH", body: input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["courier-profile"] }),
  });
}
export function useChangeCourierPassword() {
  return useMutation({
    mutationFn: (input: { currentPassword: string; newPassword: string }) =>
      api<{ ok: boolean }>("/courier/password", { method: "PATCH", body: input }),
  });
}

// ===== Chat com o cliente (canal COURIER) =====
export function useOrderMessages(orderId: string) {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["order-messages", orderId, "COURIER"],
    queryFn: () => api<OrderMessagesResponse>(`/orders/${orderId}/messages?channel=COURIER`),
    enabled: !!token && !!orderId,
    refetchOnMount: "always",
    staleTime: 0,
  });
}
export function useSendMessage(orderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: string) =>
      api<OrderMessageDTO>(`/orders/${orderId}/messages?channel=COURIER`, { method: "POST", body: { body } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["order-messages", orderId, "COURIER"] }),
  });
}
export function useMarkMessagesRead(orderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api<{ ok: boolean }>(`/orders/${orderId}/messages/read?channel=COURIER`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["order-messages", orderId, "COURIER"] }),
  });
}

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

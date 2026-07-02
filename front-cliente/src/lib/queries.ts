"use client";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import type {
  CategoryDTO,
  ProductDTO,
  AddressDTO,
  OrderDTO,
  AuthResponse,
  AddressInput,
} from "@cabana/shared";
import { api } from "./api";
import { useAuthStore } from "./auth-store";

// ===== Catálogo =====
export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: () => api<CategoryDTO[]>("/categories", { auth: false }),
    staleTime: 60_000,
  });
}

export function useProducts(params?: { categoryId?: string; search?: string }) {
  const qs = new URLSearchParams();
  if (params?.categoryId) qs.set("categoryId", params.categoryId);
  if (params?.search) qs.set("search", params.search);
  const suffix = qs.toString() ? `?${qs}` : "";
  return useQuery({
    queryKey: ["products", params?.categoryId ?? "all", params?.search ?? ""],
    queryFn: () => api<ProductDTO[]>(`/products${suffix}`, { auth: false }),
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ["product", id],
    queryFn: () => api<ProductDTO>(`/products/${id}`, { auth: false }),
    enabled: !!id,
  });
}

// ===== Auth =====
export function useAuthMutations() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const qc = useQueryClient();

  const login = useMutation({
    mutationFn: (input: { email: string; password: string }) =>
      api<AuthResponse>("/auth/login", {
        method: "POST",
        body: { ...input, scope: "CUSTOMER" },
        auth: false,
      }),
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken);
      qc.invalidateQueries();
    },
  });

  const register = useMutation({
    mutationFn: (input: { name: string; email: string; phone?: string; password: string }) =>
      api<AuthResponse>("/auth/register", { method: "POST", body: input, auth: false }),
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken);
      qc.invalidateQueries();
    },
  });

  return { login, register };
}

// ===== Perfil / endereços =====
export function useAddresses() {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["addresses"],
    queryFn: () => api<AddressDTO[]>("/me/addresses"),
    enabled: !!token,
  });
}

export function useAddressMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["addresses"] });
  return {
    create: useMutation({
      mutationFn: (input: AddressInput) => api<AddressDTO>("/me/addresses", { method: "POST", body: input }),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ id, input }: { id: string; input: Partial<AddressInput> }) =>
        api<AddressDTO>(`/me/addresses/${id}`, { method: "PATCH", body: input }),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (id: string) => api(`/me/addresses/${id}`, { method: "DELETE" }),
      onSuccess: invalidate,
    }),
  };
}

// ===== Pedidos =====
export function useOrders() {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["orders"],
    queryFn: () => api<OrderDTO[]>("/orders"),
    enabled: !!token,
  });
}

export function useOrder(id: string, opts?: { poll?: boolean }) {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["order", id],
    queryFn: () => api<OrderDTO>(`/orders/${id}`),
    enabled: !!token && !!id,
    refetchInterval: opts?.poll ? 3000 : false,
  });
}

export interface CreateOrderPayload {
  addressId: string;
  paymentMethod: "PIX" | "CREDIT_CARD" | "DEBIT_CARD" | "CASH";
  items: {
    productId: string;
    quantity: number;
    notes?: string;
    extras?: { id: string; quantity: number }[];
    removedIds?: string[];
  }[];
  notes?: string;
}

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateOrderPayload) =>
      api<OrderDTO>("/orders", { method: "POST", body: payload }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
}

export function useCreatePix() {
  return useMutation({
    mutationFn: (orderId: string) =>
      api<{ orderId: string; qrCode: string; copyPaste: string; qrImageUrl: string; autoConfirmMs: number | null }>(
        `/payments/pix/${orderId}`,
        { method: "POST" }
      ),
  });
}

export function useSimulatePix() {
  return useMutation({
    mutationFn: (orderId: string) =>
      api<{ ok: boolean }>("/payments/pix/webhook", { method: "POST", body: { orderId }, auth: false }),
  });
}

export function useConfirmReceipt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => api<OrderDTO>(`/orders/${orderId}/confirm-receipt`, { method: "POST" }),
    onSuccess: (o) => {
      qc.invalidateQueries({ queryKey: ["order", o.id] });
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

export function useRateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, stars, comment }: { orderId: string; stars: number; comment?: string }) =>
      api<OrderDTO>(`/orders/${orderId}/rating`, { method: "POST", body: { stars, comment } }),
    onSuccess: (o) => {
      qc.invalidateQueries({ queryKey: ["order", o.id] });
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

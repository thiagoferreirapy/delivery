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
  AuthUser,
  UpdateProfileInput,
  ChangePasswordInput,
  QuoteDTO,
  PaymentMethod,
  OrderMessageDTO,
  OrderMessagesResponse,
  MessageChannel,
} from "@cabana/shared";
import { api } from "./api";
import { useAuthStore } from "./auth-store";

// ===== Chat do pedido — canal STORE (loja) ou COURIER (entregador) =====
export function useOrderMessages(orderId: string, channel: MessageChannel = "STORE", enabled = true) {
  return useQuery({
    queryKey: ["order-messages", orderId, channel],
    queryFn: () => api<OrderMessagesResponse>(`/orders/${orderId}/messages?channel=${channel}`),
    enabled: !!orderId && enabled,
    // WebSocket entrega as mensagens; refetchOnMount garante histórico fresco ao abrir.
    refetchOnMount: "always",
    staleTime: 0,
  });
}
export function useSendMessage(orderId: string, channel: MessageChannel = "STORE") {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: string) =>
      api<OrderMessageDTO>(`/orders/${orderId}/messages?channel=${channel}`, { method: "POST", body: { body } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["order-messages", orderId, channel] }),
  });
}
export function useMarkMessagesRead(orderId: string, channel: MessageChannel = "STORE") {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api<{ ok: boolean }>(`/orders/${orderId}/messages/read?channel=${channel}`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["order-messages", orderId, channel] }),
  });
}

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
type MeResponse = { id: string; name: string; email: string; phone: string | null };

export function useUpdateProfile() {
  const qc = useQueryClient();
  const updateUser = useAuthStore((s) => s.updateUser);
  return useMutation({
    mutationFn: (input: UpdateProfileInput) =>
      api<MeResponse>("/me", { method: "PATCH", body: input }),
    onSuccess: (me) => {
      updateUser({ name: me.name, phone: me.phone } as Partial<AuthUser>);
      qc.invalidateQueries();
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (input: ChangePasswordInput) =>
      api<{ ok: boolean }>("/me/password", { method: "PATCH", body: input }),
  });
}

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

export interface QuoteItemInput {
  productId: string;
  quantity: number;
  notes?: string;
  extras?: { id: string; quantity: number }[];
  removedIds?: string[];
}

export interface CreateOrderPayload {
  addressId: string;
  paymentMethod: "PIX" | "CREDIT_CARD" | "DEBIT_CARD" | "CASH";
  items: QuoteItemInput[];
  notes?: string;
  couponCode?: string | null;
}

// Prévia de preços do checkout (subtotal, desconto PIX, cupom, total) — recalcula
// no servidor sempre que método de pagamento, itens ou cupom mudam.
export function useQuote(
  payload: { paymentMethod: PaymentMethod; items: QuoteItemInput[]; couponCode?: string | null } | null
) {
  return useQuery({
    queryKey: ["quote", payload],
    queryFn: () => api<QuoteDTO>("/orders/quote", { method: "POST", body: payload }),
    enabled: !!payload && payload.items.length > 0,
    placeholderData: (prev) => prev, // mantém o valor anterior enquanto recalcula
  });
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

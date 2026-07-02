"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  AuthResponse,
  CategoryDTO,
  ProductDTO,
  OrderDTO,
  CourierPublicDTO,
  OrderStatus,
  CategoryInput,
  ProductInput,
  EmployeeInput,
  CourierInput,
} from "@cabana/shared";
import { api } from "./api";
import { useAuthStore } from "./auth-store";

// ===== Auth (EMPLOYEE) =====
export function useEmployeeLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);
  return useMutation({
    mutationFn: (input: { email: string; password: string }) =>
      api<AuthResponse>("/auth/login", { method: "POST", body: { ...input, scope: "EMPLOYEE" }, auth: false }),
    onSuccess: (data) => setAuth(data.user, data.accessToken),
  });
}

// ===== Dashboard =====
export interface Stats {
  ordersToday: number;
  revenueToday: number;
  avgTicket: number;
  byStatus: Record<string, number>;
  avgRating: number | null;
  ratingCount: number;
}
export function useStats() {
  return useQuery({ queryKey: ["stats"], queryFn: () => api<Stats>("/admin/stats"), refetchInterval: 15_000 });
}

// ===== Cozinha =====
export function useKitchenOrders() {
  return useQuery({ queryKey: ["kitchen"], queryFn: () => api<OrderDTO[]>("/kitchen/orders"), refetchInterval: 10_000 });
}
export function useKitchenAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: "start" | "finish" }) =>
      api<OrderDTO>(`/kitchen/orders/${id}`, { method: "PATCH", body: { action } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["kitchen"] }),
  });
}

// ===== Expedição =====
export function useDispatchOrders() {
  return useQuery({ queryKey: ["dispatch"], queryFn: () => api<OrderDTO[]>("/dispatch/orders"), refetchInterval: 10_000 });
}
export function useDispatchCouriers() {
  return useQuery({ queryKey: ["dispatch-couriers"], queryFn: () => api<CourierPublicDTO[]>("/dispatch/couriers") });
}
export function useAssignCourier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, courierId, photoUrl }: { id: string; courierId: string; photoUrl?: string }) =>
      api<OrderDTO>(`/dispatch/orders/${id}/assign`, { method: "POST", body: { courierId, photoUrl } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dispatch"] }),
  });
}

// ===== Pedidos =====
export function useOrders(filters?: { status?: string; code?: string; courierId?: string }) {
  const qs = new URLSearchParams();
  if (filters?.status) qs.set("status", filters.status);
  if (filters?.code) qs.set("code", filters.code);
  if (filters?.courierId) qs.set("courierId", filters.courierId);
  const suffix = qs.toString() ? `?${qs}` : "";
  return useQuery({ queryKey: ["orders", suffix], queryFn: () => api<OrderDTO[]>(`/orders${suffix}`) });
}
export function useOrder(id: string) {
  return useQuery({ queryKey: ["order", id], queryFn: () => api<OrderDTO>(`/orders/${id}`), enabled: !!id });
}
export function useUpdateStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, note }: { id: string; status: OrderStatus; note?: string }) =>
      api<OrderDTO>(`/orders/${id}/status`, { method: "PATCH", body: { status, note } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["kitchen"] });
      qc.invalidateQueries({ queryKey: ["dispatch"] });
    },
  });
}

// ===== Catálogo — Categorias =====
export function useCategories(all = true) {
  return useQuery({
    queryKey: ["categories", all],
    queryFn: () => api<CategoryDTO[]>(`/categories${all ? "?all=1" : ""}`, { auth: false }),
  });
}
export function useCategoryMutations() {
  const qc = useQueryClient();
  const inv = () => qc.invalidateQueries({ queryKey: ["categories"] });
  return {
    create: useMutation({ mutationFn: (input: CategoryInput) => api("/categories", { method: "POST", body: input }), onSuccess: inv }),
    update: useMutation({ mutationFn: ({ id, input }: { id: string; input: Partial<CategoryInput> }) => api(`/categories/${id}`, { method: "PATCH", body: input }), onSuccess: inv }),
    remove: useMutation({ mutationFn: (id: string) => api(`/categories/${id}`, { method: "DELETE" }), onSuccess: inv }),
  };
}

// ===== Catálogo — Produtos =====
export function useProducts() {
  return useQuery({ queryKey: ["products-admin"], queryFn: () => api<ProductDTO[]>("/products?all=1", { auth: false }) });
}
export function useProductMutations() {
  const qc = useQueryClient();
  const inv = () => qc.invalidateQueries({ queryKey: ["products-admin"] });
  return {
    create: useMutation({ mutationFn: (input: ProductInput) => api("/products", { method: "POST", body: input }), onSuccess: inv }),
    update: useMutation({ mutationFn: ({ id, input }: { id: string; input: Partial<ProductInput> }) => api(`/products/${id}`, { method: "PATCH", body: input }), onSuccess: inv }),
    remove: useMutation({ mutationFn: (id: string) => api(`/products/${id}`, { method: "DELETE" }), onSuccess: inv }),
  };
}

// ===== Funcionários =====
export interface EmployeeDTO {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  createdAt: string;
}
export function useEmployees() {
  return useQuery({ queryKey: ["employees"], queryFn: () => api<EmployeeDTO[]>("/employees") });
}
export function useEmployeeMutations() {
  const qc = useQueryClient();
  const inv = () => qc.invalidateQueries({ queryKey: ["employees"] });
  return {
    create: useMutation({ mutationFn: (input: EmployeeInput) => api("/employees", { method: "POST", body: input }), onSuccess: inv }),
    update: useMutation({ mutationFn: ({ id, input }: { id: string; input: Partial<EmployeeInput> }) => api(`/employees/${id}`, { method: "PATCH", body: input }), onSuccess: inv }),
  };
}

// ===== Entregadores =====
export function useCouriers() {
  return useQuery({ queryKey: ["couriers"], queryFn: () => api<CourierPublicDTO[]>("/couriers") });
}
export function useCourierMutations() {
  const qc = useQueryClient();
  const inv = () => qc.invalidateQueries({ queryKey: ["couriers"] });
  return {
    create: useMutation({ mutationFn: (input: CourierInput) => api("/couriers", { method: "POST", body: input }), onSuccess: inv }),
    update: useMutation({ mutationFn: ({ id, input }: { id: string; input: Partial<CourierInput> }) => api(`/couriers/${id}`, { method: "PATCH", body: input }), onSuccess: inv }),
  };
}

// ===== Clientes (pedido manual) =====
export interface CustomerDTO {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  addresses: { id: string; label: string; street: string; number: string; neighborhood: string; city: string; state: string }[];
}
export function useCustomers(search: string) {
  return useQuery({
    queryKey: ["customers", search],
    queryFn: () => api<CustomerDTO[]>(`/customers${search ? `?search=${encodeURIComponent(search)}` : ""}`),
  });
}
export function useCreateManualOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      userId: string;
      addressId: string;
      paymentMethod: string;
      items: { productId: string; quantity: number }[];
      notes?: string;
    }) => api<OrderDTO>("/orders", { method: "POST", body: payload }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
}

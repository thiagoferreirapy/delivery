"use client";
import { API_URL } from "./config";
import { useAuthStore } from "./auth-store";

export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

interface ApiOptions {
  method?: string;
  body?: unknown;
  auth?: boolean;
}

export async function api<T = unknown>(path: string, opts: ApiOptions = {}): Promise<T> {
  const { method = "GET", body, auth = true } = opts;
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (auth) {
    const token = useAuthStore.getState().token;
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    credentials: "include",
  });
  if (res.status === 401) useAuthStore.getState().clear();
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new ApiError(res.status, data?.error ?? `Erro ${res.status}`, data?.details);
  return data as T;
}

export async function apiUpload(file: File): Promise<{ url: string }> {
  const token = useAuthStore.getState().token;
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_URL}/uploads`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
    credentials: "include",
  });
  if (!res.ok) throw new ApiError(res.status, "Falha no upload");
  return res.json();
}

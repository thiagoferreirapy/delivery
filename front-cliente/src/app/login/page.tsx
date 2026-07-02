"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthMutations } from "@/lib/queries";
import { ApiError } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthMutations();
  const [email, setEmail] = useState("cliente@cabana.com");
  const [password, setPassword] = useState("cliente123");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await login.mutateAsync({ email, password });
      router.replace("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Falha ao entrar");
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-app flex-col justify-center px-6">
      <div className="mb-8 text-center">
        <p className="font-display text-3xl font-bold text-brand">Cabana Lanches</p>
        <p className="mt-1 text-sm text-muted">Entre para pedir</p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <input
          className="input"
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="input"
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="text-sm text-danger">{error}</p>}
        <button className="btn-primary mt-1" disabled={login.isPending}>
          {login.isPending ? "Entrando…" : "Entrar"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-muted">
        Não tem conta?{" "}
        <Link href="/register" className="font-semibold text-brand">
          Cadastre-se
        </Link>
      </p>
      <p className="mt-6 text-center text-xs text-muted">
        Conta de teste já preenchida (cliente@cabana.com / cliente123).
      </p>
    </main>
  );
}

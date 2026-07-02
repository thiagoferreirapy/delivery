"use client";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEmployeeLogin } from "@/lib/queries";
import { homePathForRole } from "@/lib/rbac";
import { ApiError } from "@/lib/api";

export default function AdminLoginPage() {
  const router = useRouter();
  const login = useEmployeeLogin();
  const [email, setEmail] = useState("admin@cabana.com");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const res = await login.mutateAsync({ email, password });
      router.replace(homePathForRole(res.user.role));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Falha ao entrar");
    }
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-brand px-6">
      <div className="w-full max-w-sm rounded-3xl bg-cream p-8 shadow-soft">
        <div className="mb-6 text-center">
          <p className="font-display text-3xl font-bold text-brand">Cabana Lanches</p>
          <p className="mt-1 text-sm text-muted">Painel do restaurante</p>
        </div>
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <input className="input" type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input className="input" type="password" placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} required />
          {error && <p className="text-sm text-danger">{error}</p>}
          <button className="btn-primary mt-1" disabled={login.isPending}>
            {login.isPending && <Loader2 className="animate-spin" width={16} height={16} />}
            {login.isPending ? "Entrando…" : "Entrar"}
          </button>
        </form>
        <div className="mt-5 rounded-xl bg-black/5 p-3 text-xs text-muted">
          <p className="font-semibold text-ink">Contas de teste</p>
          <p>admin@cabana.com · cozinha@cabana.com · expedicao@cabana.com · atendente@cabana.com</p>
          <p>senha: admin123 / cozinha123 / expedicao123 / atendente123</p>
        </div>
      </div>
    </main>
  );
}

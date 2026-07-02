"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useCourierLogin } from "@/lib/queries";
import { ApiError } from "@/lib/api";

export default function CourierLoginPage() {
  const router = useRouter();
  const login = useCourierLogin();
  const [phone, setPhone] = useState("11999990001");
  const [password, setPassword] = useState("entregador123");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await login.mutateAsync({ phone, password });
      router.replace("/");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Falha ao entrar";
      setError(msg);
      toast.error(msg);
    }
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-brand px-6">
      <div className="w-full max-w-sm rounded-3xl bg-cream p-8 shadow-soft">
        <div className="mb-6 text-center">
          <p className="text-4xl">🛵</p>
          <p className="mt-2 font-display text-2xl font-bold text-brand">Cabana Entregas</p>
          <p className="mt-1 text-sm text-muted">Acesso do entregador</p>
        </div>
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <input className="input" placeholder="Telefone" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          <input className="input" type="password" placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} required />
          {error && <p className="text-sm text-danger">{error}</p>}
          <button className="btn-primary mt-1" disabled={login.isPending}>
            {login.isPending && <Loader2 className="animate-spin" width={18} height={18} />}
            {login.isPending ? "Entrando…" : "Entrar"}
          </button>
        </form>
        <p className="mt-5 text-center text-xs text-muted">
          Acesso criado pelo restaurante. Teste: 11999990001 / entregador123
        </p>
      </div>
    </main>
  );
}

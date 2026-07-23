"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuthMutations } from "@/lib/queries";
import { ApiError } from "@/lib/api";
import { AuthShell } from "@/components/AuthShell";
import { IconInput } from "@/components/IconInput";
import { IconMail, IconLock } from "@/components/icons";

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
      const msg = err instanceof ApiError ? err.message : "Falha ao entrar";
      setError(msg);
      toast.error(msg);
    }
  }

  return (
    <AuthShell heading="Bem-vindo de volta" sub="Entre para continuar seus pedidos">
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <IconInput
          icon={<IconMail width={18} height={18} />}
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
        <IconInput
          icon={<IconLock width={18} height={18} />}
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />
        {error && <p className="text-sm text-danger">{error}</p>}
        <button className="btn-primary mt-2" disabled={login.isPending}>
          {login.isPending && <Loader2 className="animate-spin" width={18} height={18} />}
          {login.isPending ? "Entrando…" : "Entrar"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-muted">
        Não tem conta?{" "}
        <Link href="/register" className="font-semibold text-brand">
          Cadastre-se
        </Link>
      </p>
      <p className="mt-4 rounded-xl bg-black/[0.03] px-3 py-2 text-center text-xs text-muted">
        Conta de teste já preenchida · cliente@cabana.com / cliente123
      </p>
    </AuthShell>
  );
}

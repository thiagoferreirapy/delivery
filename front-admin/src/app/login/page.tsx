"use client";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEmployeeLogin } from "@/lib/queries";
import { homePathForRole } from "@/lib/rbac";
import { ApiError } from "@/lib/api";
import { AuthShell } from "@/components/AuthShell";
import { IconInput } from "@/components/IconInput";
import { Icon } from "@/components/icons";

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
    <AuthShell heading="Entrar no painel" sub="Acesse com sua conta de funcionário">
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <IconInput
          icon={<Icon.mail width={18} height={18} />}
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="username"
        />
        <IconInput
          icon={<Icon.lock width={18} height={18} />}
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />
        {error && <p className="text-sm text-danger">{error}</p>}
        <button className="btn-primary mt-2" disabled={login.isPending}>
          {login.isPending && <Loader2 className="animate-spin" width={16} height={16} />}
          {login.isPending ? "Entrando…" : "Entrar"}
        </button>
      </form>
      <div className="mt-5 rounded-xl bg-black/[0.04] p-3 text-xs text-muted">
        <p className="font-semibold text-ink">Contas de teste</p>
        <p className="mt-0.5">admin · cozinha · expedicao · atendente <span className="text-muted/70">@cabana.com</span></p>
        <p>senha: admin123 / cozinha123 / expedicao123 / atendente123</p>
      </div>
    </AuthShell>
  );
}

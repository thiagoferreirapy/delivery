"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useCourierLogin } from "@/lib/queries";
import { ApiError } from "@/lib/api";
import { AuthShell } from "@/components/AuthShell";
import { IconInput } from "@/components/IconInput";
import { IconPhone, IconKey } from "@/components/icons";

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
    <AuthShell
      heading="Acesso do entregador"
      sub="Entre para ver suas entregas"
      eyebrow="Cabana Entregas"
      title="Suas entregas em tempo real"
      tagline="Rotas, mapa ao vivo e pagamentos num só app."
      videos={["/entregas.mp4"]}
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <IconInput
          icon={<IconPhone width={18} height={18} />}
          placeholder="Telefone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          inputMode="tel"
          autoComplete="username"
        />
        <IconInput
          icon={<IconKey width={18} height={18} />}
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
      <p className="mt-5 rounded-xl bg-black/[0.03] px-3 py-2 text-center text-xs text-muted">
        Acesso criado pelo restaurante · teste: 11999990001 / entregador123
      </p>
    </AuthShell>
  );
}

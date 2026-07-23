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
import { IconUser, IconMail, IconPhone, IconLock } from "@/components/icons";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuthMutations();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await register.mutateAsync({
        name: form.name,
        email: form.email,
        phone: form.phone || undefined,
        password: form.password,
      });
      router.replace("/");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Falha ao cadastrar";
      setError(msg);
      toast.error(msg);
    }
  }

  return (
    <AuthShell heading="Criar conta" sub="É rápido, em segundos você já pede">
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <IconInput icon={<IconUser width={18} height={18} />} placeholder="Nome completo" value={form.name} onChange={set("name")} required autoComplete="name" />
        <IconInput icon={<IconMail width={18} height={18} />} type="email" placeholder="E-mail" value={form.email} onChange={set("email")} required autoComplete="email" />
        <IconInput icon={<IconPhone width={18} height={18} />} placeholder="Telefone (opcional)" value={form.phone} onChange={set("phone")} inputMode="tel" autoComplete="tel" />
        <IconInput icon={<IconLock width={18} height={18} />} type="password" placeholder="Senha (mín. 6)" value={form.password} onChange={set("password")} required minLength={6} autoComplete="new-password" />
        {error && <p className="text-sm text-danger">{error}</p>}
        <button className="btn-primary mt-2" disabled={register.isPending}>
          {register.isPending && <Loader2 className="animate-spin" width={18} height={18} />}
          {register.isPending ? "Criando…" : "Criar conta"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-muted">
        Já tem conta?{" "}
        <Link href="/login" className="font-semibold text-brand">
          Entrar
        </Link>
      </p>
    </AuthShell>
  );
}

"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuthMutations } from "@/lib/queries";
import { ApiError } from "@/lib/api";

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
    <main className="mx-auto flex min-h-dvh max-w-app flex-col justify-center px-6">
      <div className="mb-8 text-center">
        <p className="font-display text-3xl font-bold text-brand">Criar conta</p>
        <p className="mt-1 text-sm text-muted">É rápido</p>
      </div>
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <input className="input" placeholder="Nome completo" value={form.name} onChange={set("name")} required />
        <input className="input" type="email" placeholder="E-mail" value={form.email} onChange={set("email")} required />
        <input className="input" placeholder="Telefone (opcional)" value={form.phone} onChange={set("phone")} />
        <input className="input" type="password" placeholder="Senha (mín. 6)" value={form.password} onChange={set("password")} required minLength={6} />
        {error && <p className="text-sm text-danger">{error}</p>}
        <button className="btn-primary mt-1" disabled={register.isPending}>
          {register.isPending && <Loader2 className="animate-spin" width={18} height={18} />}
          {register.isPending ? "Criando…" : "Criar conta"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-muted">
        Já tem conta?{" "}
        <Link href="/login" className="font-semibold text-brand">
          Entrar
        </Link>
      </p>
    </main>
  );
}

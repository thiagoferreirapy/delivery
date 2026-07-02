"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AddressDTO, AddressInput } from "@cabana/shared";
import { useAddresses, useAddressMutations } from "@/lib/queries";
import { useRequireAuth } from "@/lib/use-require-auth";
import { useAuthStore } from "@/lib/auth-store";
import { disconnectSocket } from "@/lib/socket";
import { TabShell } from "@/components/TabShell";
import { PageHeader, Spinner } from "@/components/ui";
import { Loader2 } from "lucide-react";
import { IconPlus, IconMapPin } from "@/components/icons";

const empty: AddressInput = {
  label: "", cep: "", street: "", number: "", complement: "", neighborhood: "", city: "", state: "", isDefault: false,
};

export default function ProfilePage() {
  const router = useRouter();
  const { ready } = useRequireAuth();
  const user = useAuthStore((s) => s.user);
  const clear = useAuthStore((s) => s.clear);
  const { data: addresses = [], isLoading } = useAddresses();
  const { create, update, remove } = useAddressMutations();

  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [form, setForm] = useState<AddressInput>(empty);
  const set = (k: keyof AddressInput) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: k === "isDefault" ? e.target.checked : e.target.value });

  function startNew() {
    setForm(empty);
    setEditing("new");
  }
  function startEdit(a: AddressDTO) {
    setForm({ ...a, complement: a.complement ?? "" });
    setEditing(a.id);
  }
  async function save() {
    if (editing === "new") await create.mutateAsync(form);
    else if (editing) await update.mutateAsync({ id: editing, input: form });
    setEditing(null);
  }
  function logout() {
    clear();
    disconnectSocket();
    router.replace("/login");
  }

  if (!ready) return <Spinner />;

  return (
    <TabShell>
      <PageHeader title="Perfil" />
      <div className="flex flex-col gap-5 p-4">
        {/* Dados */}
        <section className="card flex items-center gap-3 p-4">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-brand/10 text-lg font-bold text-brand">
            {user?.name?.[0]?.toUpperCase() ?? "?"}
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold text-ink">{user?.name}</p>
            <p className="truncate text-sm text-muted">{user?.email}</p>
          </div>
        </section>

        {/* Endereços */}
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-semibold text-ink">Endereços</h2>
            <button onClick={startNew} className="flex items-center gap-1 text-sm font-semibold text-brand">
              <IconPlus width={16} height={16} /> Novo
            </button>
          </div>

          {isLoading ? (
            <Spinner />
          ) : (
            <div className="flex flex-col gap-2">
              {addresses.map((a) => (
                <div key={a.id} className="card flex items-start gap-3 p-3">
                  <IconMapPin className="mt-0.5 text-brand" width={18} height={18} />
                  <div className="flex-1 text-sm">
                    <p className="font-semibold text-ink">
                      {a.label} {a.isDefault && <span className="ml-1 rounded bg-success/15 px-1.5 py-0.5 text-[10px] font-bold text-success">PADRÃO</span>}
                    </p>
                    <p className="text-muted">{a.street}, {a.number} — {a.neighborhood}, {a.city}/{a.state}</p>
                  </div>
                  <div className="flex flex-col gap-1 text-xs">
                    <button onClick={() => startEdit(a)} className="text-brand">Editar</button>
                    <button onClick={() => remove.mutate(a.id)} className="text-danger">Excluir</button>
                  </div>
                </div>
              ))}
              {addresses.length === 0 && <p className="text-sm text-muted">Nenhum endereço cadastrado.</p>}
            </div>
          )}
        </section>

        <button onClick={logout} className="btn-ghost w-full text-danger">Sair</button>
      </div>

      {/* Bottom-sheet de endereço */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={() => setEditing(null)}>
          <div className="w-full max-w-app rounded-t-3xl bg-cream p-4 pb-8" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-black/15" />
            <h3 className="mb-3 font-display text-lg font-bold text-ink">
              {editing === "new" ? "Novo endereço" : "Editar endereço"}
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <input className="input col-span-2" placeholder="Rótulo (Casa, Trabalho)" value={form.label} onChange={set("label")} />
              <input className="input" placeholder="CEP" value={form.cep} onChange={set("cep")} />
              <input className="input" placeholder="Número" value={form.number} onChange={set("number")} />
              <input className="input col-span-2" placeholder="Rua" value={form.street} onChange={set("street")} />
              <input className="input col-span-2" placeholder="Complemento" value={form.complement ?? ""} onChange={set("complement")} />
              <input className="input col-span-2" placeholder="Bairro" value={form.neighborhood} onChange={set("neighborhood")} />
              <input className="input" placeholder="Cidade" value={form.city} onChange={set("city")} />
              <input className="input" placeholder="UF" maxLength={2} value={form.state} onChange={set("state")} />
              <label className="col-span-2 flex items-center gap-2 text-sm text-ink">
                <input type="checkbox" checked={!!form.isDefault} onChange={set("isDefault")} className="accent-brand" />
                Definir como padrão
              </label>
            </div>
            <button onClick={save} disabled={create.isPending || update.isPending} className="btn-primary mt-4 w-full">
              {(create.isPending || update.isPending) && <Loader2 className="animate-spin" width={18} height={18} />}
              Salvar
            </button>
          </div>
        </div>
      )}
    </TabShell>
  );
}

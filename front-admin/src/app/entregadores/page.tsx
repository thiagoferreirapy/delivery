"use client";
import { useState } from "react";
import type { CourierPublicDTO } from "@cabana/shared";
import { AdminShell } from "@/components/AdminShell";
import { PageTitle, Spinner, Modal, Field, Toggle } from "@/components/ui";
import { Icon } from "@/components/icons";
import { useCouriers, useCourierMutations } from "@/lib/queries";
import { useRequireRole } from "@/lib/use-require-role";

export default function CouriersPage() {
  const { ready } = useRequireRole(["ADMIN"]);
  const { data: couriers = [], isLoading } = useCouriers();
  const { create, update } = useCourierMutations();
  const [editing, setEditing] = useState<CourierPublicDTO | "new" | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", password: "", active: true });

  if (!ready) return null;

  function open(c: CourierPublicDTO | "new") {
    if (c === "new") setForm({ name: "", phone: "", password: "", active: true });
    else setForm({ name: c.name, phone: c.phone, password: "", active: c.active });
    setEditing(c);
  }
  async function save() {
    const input: any = { name: form.name, phone: form.phone, active: form.active };
    if (form.password) input.password = form.password;
    if (editing === "new") await create.mutateAsync(input);
    else if (editing) await update.mutateAsync({ id: editing.id, input });
    setEditing(null);
  }

  return (
    <AdminShell>
      <PageTitle title="Entregadores" subtitle="O entregador não se auto-cadastra" action={<button onClick={() => open("new")} className="btn-primary text-sm"><Icon.plus width={16} height={16} /> Novo</button>} />
      {isLoading ? (
        <Spinner />
      ) : (
        <div className="card divide-y divide-black/5">
          {couriers.map((c) => (
            <div key={c.id} className="flex items-center gap-3 p-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-brand/10 text-lg">🛵</span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-ink">{c.name}</p>
                <p className="text-xs text-muted">{c.phone}</p>
              </div>
              <Toggle checked={c.active} onChange={(v) => update.mutate({ id: c.id, input: { active: v } })} />
              <button onClick={() => open(c)} className="grid h-8 w-8 place-items-center rounded-lg text-brand hover:bg-black/5"><Icon.edit width={18} height={18} /></button>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing === "new" ? "Novo entregador" : "Editar entregador"}>
        <div className="flex flex-col gap-3">
          <Field label="Nome"><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Telefone (login)"><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="11999990001" /></Field>
          <Field label={editing === "new" ? "Senha" : "Nova senha (opcional)"}><input type="password" className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Field>
          <Toggle checked={form.active} onChange={(v) => setForm({ ...form, active: v })} label="Ativo" />
          <button onClick={save} disabled={create.isPending || update.isPending} className="btn-primary mt-1">Salvar</button>
        </div>
      </Modal>
    </AdminShell>
  );
}

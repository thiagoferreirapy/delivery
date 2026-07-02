"use client";
import { useState } from "react";
import type { EmployeeRole } from "@cabana/shared";
import { AdminShell } from "@/components/AdminShell";
import { PageTitle, Spinner, Modal, Field, Toggle } from "@/components/ui";
import { Icon } from "@/components/icons";
import { useEmployees, useEmployeeMutations, type EmployeeDTO } from "@/lib/queries";
import { useRequireRole } from "@/lib/use-require-role";
import { ROLE_LABEL } from "@/lib/rbac";

const ROLES: EmployeeRole[] = ["ADMIN", "KITCHEN", "DISPATCH", "ATTENDANT"];

export default function EmployeesPage() {
  const { ready } = useRequireRole(["ADMIN"]);
  const { data: employees = [], isLoading } = useEmployees();
  const { create, update } = useEmployeeMutations();
  const [editing, setEditing] = useState<EmployeeDTO | "new" | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "KITCHEN" as EmployeeRole, active: true });

  if (!ready) return null;

  function open(e: EmployeeDTO | "new") {
    if (e === "new") setForm({ name: "", email: "", password: "", role: "KITCHEN", active: true });
    else setForm({ name: e.name, email: e.email, password: "", role: e.role as EmployeeRole, active: e.active });
    setEditing(e);
  }
  async function save() {
    const input: any = { name: form.name, email: form.email, role: form.role, active: form.active };
    if (form.password) input.password = form.password;
    if (editing === "new") await create.mutateAsync(input);
    else if (editing) await update.mutateAsync({ id: editing.id, input });
    setEditing(null);
  }

  return (
    <AdminShell>
      <PageTitle title="Funcionários" subtitle="Papéis e acesso" action={<button onClick={() => open("new")} className="btn-primary text-sm"><Icon.plus width={16} height={16} /> Novo</button>} />
      {isLoading ? (
        <Spinner />
      ) : (
        <div className="card divide-y divide-black/5">
          {employees.map((e) => (
            <div key={e.id} className="flex items-center gap-3 p-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-brand/10 font-bold text-brand">{e.name[0]?.toUpperCase()}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-ink">{e.name}</p>
                <p className="text-xs text-muted">{e.email}</p>
              </div>
              <span className="rounded-full bg-black/5 px-2 py-0.5 text-xs font-medium text-ink">{ROLE_LABEL[e.role as EmployeeRole]}</span>
              <Toggle checked={e.active} onChange={(v) => update.mutate({ id: e.id, input: { active: v } })} />
              <button onClick={() => open(e)} className="grid h-8 w-8 place-items-center rounded-lg text-brand hover:bg-black/5"><Icon.edit width={18} height={18} /></button>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing === "new" ? "Novo funcionário" : "Editar funcionário"}>
        <div className="flex flex-col gap-3">
          <Field label="Nome"><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="E-mail"><input type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label={editing === "new" ? "Senha" : "Nova senha (opcional)"}><input type="password" className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Field>
          <Field label="Papel">
            <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as EmployeeRole })}>
              {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
            </select>
          </Field>
          <Toggle checked={form.active} onChange={(v) => setForm({ ...form, active: v })} label="Acesso ativo" />
          <button onClick={save} disabled={create.isPending || update.isPending} className="btn-primary mt-1">Salvar</button>
        </div>
      </Modal>
    </AdminShell>
  );
}

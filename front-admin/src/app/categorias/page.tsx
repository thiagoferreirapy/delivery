"use client";
import { useState } from "react";
import type { CategoryDTO } from "@cabana/shared";
import { AdminShell } from "@/components/AdminShell";
import { PageTitle, Spinner, Modal, Field, Toggle } from "@/components/ui";
import { Icon } from "@/components/icons";
import { useCategories, useCategoryMutations } from "@/lib/queries";
import { useRequireRole } from "@/lib/use-require-role";

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export default function CategoriesPage() {
  const { ready } = useRequireRole(["ADMIN"]);
  const { data: categories = [], isLoading } = useCategories(true);
  const { create, update, remove } = useCategoryMutations();
  const [editing, setEditing] = useState<CategoryDTO | "new" | null>(null);
  const [form, setForm] = useState({ name: "", slug: "", imageUrl: "", sortOrder: 0, active: true });

  if (!ready) return null;

  function open(cat: CategoryDTO | "new") {
    if (cat === "new") setForm({ name: "", slug: "", imageUrl: "", sortOrder: 0, active: true });
    else setForm({ name: cat.name, slug: cat.slug, imageUrl: cat.imageUrl ?? "", sortOrder: cat.sortOrder, active: cat.active });
    setEditing(cat);
  }
  async function save() {
    const input = { ...form, imageUrl: form.imageUrl || undefined, slug: form.slug || slugify(form.name) };
    if (editing === "new") await create.mutateAsync(input);
    else if (editing) await update.mutateAsync({ id: editing.id, input });
    setEditing(null);
  }

  return (
    <AdminShell>
      <PageTitle title="Categorias" action={<button onClick={() => open("new")} className="btn-primary text-sm"><Icon.plus width={16} height={16} /> Nova</button>} />
      {isLoading ? (
        <Spinner />
      ) : (
        <div className="card divide-y divide-black/5">
          {categories.map((c) => (
            <div key={c.id} className="flex items-center gap-3 p-3">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand/10 text-sm font-bold text-brand">{c.sortOrder}</span>
              <div className="flex-1">
                <p className="font-medium text-ink">{c.name} {!c.active && <span className="text-xs text-muted">(inativa)</span>}</p>
                <p className="text-xs text-muted">/{c.slug}</p>
              </div>
              <button onClick={() => open(c)} className="grid h-8 w-8 place-items-center rounded-lg text-brand hover:bg-black/5"><Icon.edit width={18} height={18} /></button>
              <button onClick={() => confirm(`Excluir/desativar "${c.name}"?`) && remove.mutate(c.id)} className="grid h-8 w-8 place-items-center rounded-lg text-danger hover:bg-danger/5"><Icon.x width={18} height={18} /></button>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing === "new" ? "Nova categoria" : "Editar categoria"}>
        <div className="flex flex-col gap-3">
          <Field label="Nome"><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: form.slug || slugify(e.target.value) })} /></Field>
          <Field label="Slug"><input className="input" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></Field>
          <Field label="Imagem (URL)"><input className="input" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://…" /></Field>
          <div className="flex items-center gap-4">
            <Field label="Ordem"><input type="number" className="input w-24" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} /></Field>
            <div className="pt-6"><Toggle checked={form.active} onChange={(v) => setForm({ ...form, active: v })} label="Ativa" /></div>
          </div>
          <button onClick={save} disabled={create.isPending || update.isPending} className="btn-primary mt-1">Salvar</button>
        </div>
      </Modal>
    </AdminShell>
  );
}

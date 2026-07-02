"use client";
import { useState } from "react";
import Image from "next/image";
import type { ProductDTO } from "@cabana/shared";
import { AdminShell } from "@/components/AdminShell";
import { Loader2 } from "lucide-react";
import { PageTitle, Modal, Field, Toggle } from "@/components/ui";
import { ListSkeleton, Skeleton } from "@/components/Skeleton";
import { Icon } from "@/components/icons";
import { useProducts, useProductMutations, useCategories } from "@/lib/queries";
import { useRequireRole } from "@/lib/use-require-role";
import { brl } from "@/lib/format";

const emptyForm = {
  name: "", categoryId: "", description: "", ingredients: "", prepNotes: "",
  price: 0, imageUrl: "", active: true, promoActive: false, promoPercent: 0,
};

export default function ProductsPage() {
  const { ready } = useRequireRole(["ADMIN"]);
  const { data: products = [], isLoading } = useProducts();
  const { data: categories = [] } = useCategories(true);
  const { create, update, remove } = useProductMutations();
  const [editing, setEditing] = useState<ProductDTO | "new" | null>(null);
  const [form, setForm] = useState(emptyForm);

  if (!ready) return null;

  function open(p: ProductDTO | "new") {
    if (p === "new") setForm({ ...emptyForm, categoryId: categories[0]?.id ?? "" });
    else setForm({
      name: p.name, categoryId: p.categoryId, description: p.description ?? "", ingredients: p.ingredients ?? "",
      prepNotes: p.prepNotes ?? "", price: p.price, imageUrl: p.imageUrl ?? "", active: p.active,
      promoActive: p.promoActive, promoPercent: p.promoPercent ?? 0,
    });
    setEditing(p);
  }
  async function save() {
    const input: any = {
      name: form.name, categoryId: form.categoryId, description: form.description || undefined,
      ingredients: form.ingredients || undefined, prepNotes: form.prepNotes || undefined,
      price: Number(form.price), imageUrl: form.imageUrl || undefined, active: form.active,
      promoActive: form.promoActive, promoPercent: form.promoActive ? Number(form.promoPercent) || null : null,
    };
    if (editing === "new") await create.mutateAsync(input);
    else if (editing) await update.mutateAsync({ id: editing.id, input });
    setEditing(null);
  }

  return (
    <AdminShell>
      <PageTitle title="Produtos" action={<button onClick={() => open("new")} className="btn-primary text-sm"><Icon.plus width={16} height={16} /> Novo</button>} />
      {isLoading ? (
        <ListSkeleton leading={<Skeleton className="h-12 w-12 rounded-lg" />} />
      ) : (
        <div className="card divide-y divide-black/5">
          {products.map((p) => (
            <div key={p.id} className="flex items-center gap-3 p-3">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-black/5">
                {p.imageUrl && <Image src={p.imageUrl} alt={p.name} fill sizes="48px" className="object-cover" unoptimized />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-ink">{p.name} {!p.active && <span className="text-xs text-muted">(inativo)</span>}</p>
                <p className="text-xs text-muted">{p.category?.name}</p>
              </div>
              {p.promoActive && p.promoPercent ? (
                <span className="rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold text-cream">{p.promoPercent}%</span>
              ) : null}
              <span className="w-20 text-right text-sm font-semibold text-ink">{brl(p.finalPrice)}</span>
              <button onClick={() => open(p)} className="grid h-8 w-8 place-items-center rounded-lg text-brand hover:bg-black/5"><Icon.edit width={18} height={18} /></button>
              <button onClick={() => confirm(`Excluir/desativar "${p.name}"?`) && remove.mutate(p.id)} className="grid h-8 w-8 place-items-center rounded-lg text-danger hover:bg-danger/5"><Icon.x width={18} height={18} /></button>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing === "new" ? "Novo produto" : "Editar produto"}>
        <div className="grid max-h-[70vh] grid-cols-2 gap-3 overflow-y-auto pr-1">
          <Field label="Nome"><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Categoria">
            <select className="input" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Preço (R$)"><input type="number" step="0.01" className="input" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} /></Field>
          <Field label="Imagem (URL)"><input className="input" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} /></Field>
          <div className="col-span-2"><Field label="Descrição"><input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field></div>
          <div className="col-span-2"><Field label="Ingredientes"><input className="input" value={form.ingredients} onChange={(e) => setForm({ ...form, ingredients: e.target.value })} /></Field></div>
          <div className="col-span-2"><Field label="Modo de preparo"><input className="input" value={form.prepNotes} onChange={(e) => setForm({ ...form, prepNotes: e.target.value })} /></Field></div>
          <div className="flex items-center gap-2 pt-6"><Toggle checked={form.active} onChange={(v) => setForm({ ...form, active: v })} label="Ativo" /></div>
          <div className="flex items-center gap-2 pt-6"><Toggle checked={form.promoActive} onChange={(v) => setForm({ ...form, promoActive: v })} label="Promoção" /></div>
          {form.promoActive && (
            <Field label="Desconto (%)"><input type="number" min={1} max={99} className="input w-28" value={form.promoPercent} onChange={(e) => setForm({ ...form, promoPercent: Number(e.target.value) })} /></Field>
          )}
        </div>
        <button onClick={save} disabled={create.isPending || update.isPending} className="btn-primary mt-3 w-full">
          {(create.isPending || update.isPending) && <Loader2 className="animate-spin" width={16} height={16} />}
          Salvar
        </button>
      </Modal>
    </AdminShell>
  );
}

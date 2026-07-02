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

type ExtraRow = { name: string; price: number };
type RemovableRow = { name: string };

const emptyForm = {
  name: "", categoryId: "", description: "", ingredients: "", prepNotes: "",
  price: 0, imageUrl: "", active: true, promoActive: false, promoPercent: 0,
  maxExtras: "", maxRemovable: "",
  extras: [] as ExtraRow[], removables: [] as RemovableRow[],
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
      maxExtras: p.maxExtras != null ? String(p.maxExtras) : "",
      maxRemovable: p.maxRemovable != null ? String(p.maxRemovable) : "",
      extras: (p.extras ?? []).map((e) => ({ name: e.name, price: e.price })),
      removables: (p.removables ?? []).map((r) => ({ name: r.name })),
    });
    setEditing(p);
  }
  async function save() {
    const input: any = {
      name: form.name, categoryId: form.categoryId, description: form.description || undefined,
      ingredients: form.ingredients || undefined, prepNotes: form.prepNotes || undefined,
      price: Number(form.price), imageUrl: form.imageUrl || undefined, active: form.active,
      promoActive: form.promoActive, promoPercent: form.promoActive ? Number(form.promoPercent) || null : null,
      maxExtras: form.maxExtras === "" ? null : Number(form.maxExtras),
      maxRemovable: form.maxRemovable === "" ? null : Number(form.maxRemovable),
      extras: form.extras.filter((e) => e.name.trim()).map((e) => ({ name: e.name.trim(), price: Number(e.price) || 0 })),
      removables: form.removables.filter((r) => r.name.trim()).map((r) => ({ name: r.name.trim() })),
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

          {/* Ingredientes extras (adicionais, com preço) */}
          <div className="col-span-2 border-t border-black/5 pt-3">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-ink">Adicionais (extras com preço)</h3>
              <button type="button" onClick={() => setForm({ ...form, extras: [...form.extras, { name: "", price: 0 }] })} className="text-sm font-semibold text-brand">+ Adicionar</button>
            </div>
            {form.extras.length === 0 && <p className="text-xs text-muted">Nenhum adicional configurado.</p>}
            <div className="flex flex-col gap-2">
              {form.extras.map((ex, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input className="input flex-1" placeholder="Ex.: Bacon extra" value={ex.name} onChange={(e) => { const a = [...form.extras]; a[i] = { ...a[i], name: e.target.value }; setForm({ ...form, extras: a }); }} />
                  <span className="text-sm text-muted">R$</span>
                  <input type="number" step="0.01" min={0} className="input w-24" value={ex.price} onChange={(e) => { const a = [...form.extras]; a[i] = { ...a[i], price: Number(e.target.value) }; setForm({ ...form, extras: a }); }} />
                  <button type="button" onClick={() => setForm({ ...form, extras: form.extras.filter((_, j) => j !== i) })} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-danger hover:bg-danger/5"><Icon.x width={16} height={16} /></button>
                </div>
              ))}
            </div>
            <div className="mt-2">
              <Field label="Máx. de adicionais (vazio = à vontade)">
                <input type="number" min={0} className="input w-44" value={form.maxExtras} placeholder="à vontade" onChange={(e) => setForm({ ...form, maxExtras: e.target.value })} />
              </Field>
            </div>
          </div>

          {/* Ingredientes removíveis */}
          <div className="col-span-2 border-t border-black/5 pt-3">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-ink">Ingredientes removíveis</h3>
              <button type="button" onClick={() => setForm({ ...form, removables: [...form.removables, { name: "" }] })} className="text-sm font-semibold text-brand">+ Adicionar</button>
            </div>
            {form.removables.length === 0 && <p className="text-xs text-muted">Nenhum ingrediente removível.</p>}
            <div className="flex flex-col gap-2">
              {form.removables.map((rm, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input className="input flex-1" placeholder="Ex.: Cebola" value={rm.name} onChange={(e) => { const a = [...form.removables]; a[i] = { name: e.target.value }; setForm({ ...form, removables: a }); }} />
                  <button type="button" onClick={() => setForm({ ...form, removables: form.removables.filter((_, j) => j !== i) })} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-danger hover:bg-danger/5"><Icon.x width={16} height={16} /></button>
                </div>
              ))}
            </div>
            <div className="mt-2">
              <Field label="Máx. de remoções (vazio = à vontade)">
                <input type="number" min={0} className="input w-44" value={form.maxRemovable} placeholder="à vontade" onChange={(e) => setForm({ ...form, maxRemovable: e.target.value })} />
              </Field>
            </div>
          </div>
        </div>
        <button onClick={save} disabled={create.isPending || update.isPending} className="btn-primary mt-3 w-full">
          {(create.isPending || update.isPending) && <Loader2 className="animate-spin" width={16} height={16} />}
          Salvar
        </button>
      </Modal>
    </AdminShell>
  );
}

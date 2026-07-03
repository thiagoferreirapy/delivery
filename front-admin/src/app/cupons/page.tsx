"use client";
import { useState } from "react";
import type { CouponDTO } from "@cabana/shared";
import { AdminShell } from "@/components/AdminShell";
import { Loader2 } from "lucide-react";
import { PageTitle, Modal, Field, Toggle } from "@/components/ui";
import { ListSkeleton } from "@/components/Skeleton";
import { Icon } from "@/components/icons";
import { useCoupons, useCouponMutations, useProducts, useCategories } from "@/lib/queries";
import { useRequireRole } from "@/lib/use-require-role";
import { brl } from "@/lib/format";

type Scope = "ALL" | "PRODUCTS" | "CATEGORY";
type Kind = "PERCENT" | "FIXED";

const emptyForm = {
  code: "", description: "", type: "PERCENT" as Kind, value: 0, active: true,
  expiresAt: "", minSubtotal: "", maxUses: "",
  appliesTo: "ALL" as Scope, categoryId: "", productIds: [] as string[],
};

const SCOPE_LABEL: Record<Scope, string> = {
  ALL: "Todo o cardápio",
  PRODUCTS: "Produtos específicos",
  CATEGORY: "Categoria",
};

function discountLabel(c: CouponDTO) {
  return c.type === "PERCENT" ? `${c.value}%` : brl(c.value);
}

export default function CouponsPage() {
  const { ready } = useRequireRole(["ADMIN"]);
  const { data: coupons = [], isLoading } = useCoupons();
  const { data: products = [] } = useProducts();
  const { data: categories = [] } = useCategories(true);
  const { create, update, remove } = useCouponMutations();
  const [editing, setEditing] = useState<CouponDTO | "new" | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);

  if (!ready) return null;

  function open(c: CouponDTO | "new") {
    setError(null);
    if (c === "new") setForm(emptyForm);
    else
      setForm({
        code: c.code, description: c.description ?? "", type: c.type, value: c.value, active: c.active,
        expiresAt: c.expiresAt ? c.expiresAt.slice(0, 10) : "",
        minSubtotal: c.minSubtotal != null ? String(c.minSubtotal) : "",
        maxUses: c.maxUses != null ? String(c.maxUses) : "",
        appliesTo: c.appliesTo, categoryId: c.categoryId ?? "", productIds: c.productIds,
      });
    setEditing(c);
  }

  function toggleProduct(id: string) {
    setForm((f) => ({
      ...f,
      productIds: f.productIds.includes(id) ? f.productIds.filter((p) => p !== id) : [...f.productIds, id],
    }));
  }

  async function save() {
    setError(null);
    if (form.code.trim().length < 3) return setError("O código precisa ter ao menos 3 caracteres.");
    if (Number(form.value) <= 0) return setError("Informe um valor de desconto maior que zero.");
    if (form.type === "PERCENT" && Number(form.value) > 90) return setError("O percentual máximo é 90%.");
    if (form.appliesTo === "CATEGORY" && !form.categoryId) return setError("Escolha a categoria do cupom.");
    if (form.appliesTo === "PRODUCTS" && form.productIds.length === 0) return setError("Selecione ao menos um produto.");

    const input: any = {
      code: form.code.trim(),
      description: form.description || undefined,
      type: form.type,
      value: Number(form.value),
      active: form.active,
      expiresAt: form.expiresAt ? new Date(form.expiresAt + "T23:59:59").toISOString() : null,
      minSubtotal: form.minSubtotal === "" ? null : Number(form.minSubtotal),
      maxUses: form.maxUses === "" ? null : Number(form.maxUses),
      appliesTo: form.appliesTo,
      categoryId: form.appliesTo === "CATEGORY" ? form.categoryId : null,
      productIds: form.appliesTo === "PRODUCTS" ? form.productIds : [],
    };
    try {
      if (editing === "new") await create.mutateAsync(input);
      else if (editing) await update.mutateAsync({ id: editing.id, input });
      setEditing(null);
    } catch (e: any) {
      setError(e?.message ?? "Não foi possível salvar o cupom.");
    }
  }

  return (
    <AdminShell>
      <PageTitle
        title="Cupons"
        subtitle="Códigos de desconto aplicados no checkout do cliente"
        action={<button onClick={() => open("new")} className="btn-primary text-sm"><Icon.plus width={16} height={16} /> Novo</button>}
      />
      {isLoading ? (
        <ListSkeleton />
      ) : coupons.length === 0 ? (
        <div className="card p-8 text-center text-sm text-muted">Nenhum cupom cadastrado ainda.</div>
      ) : (
        <div className="card divide-y divide-black/5">
          {coupons.map((c) => (
            <div key={c.id} className="flex items-center gap-3 p-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand/10 text-brand"><Icon.ticket width={20} height={20} /></span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 font-semibold text-ink">
                  {c.code}
                  {!c.active && <span className="text-xs font-normal text-muted">(inativo)</span>}
                </p>
                <p className="truncate text-xs text-muted">
                  {SCOPE_LABEL[c.appliesTo]}
                  {c.expiresAt ? ` · até ${new Date(c.expiresAt).toLocaleDateString("pt-BR")}` : ""}
                  {c.maxUses != null ? ` · ${c.usedCount}/${c.maxUses} usos` : ` · ${c.usedCount} usos`}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-success/15 px-2 py-0.5 text-xs font-bold text-success">-{discountLabel(c)}</span>
              <button onClick={() => open(c)} className="grid h-8 w-8 place-items-center rounded-lg text-brand hover:bg-black/5"><Icon.edit width={18} height={18} /></button>
              <button onClick={() => confirm(`Excluir/desativar o cupom "${c.code}"?`) && remove.mutate(c.id)} className="grid h-8 w-8 place-items-center rounded-lg text-danger hover:bg-danger/5"><Icon.x width={18} height={18} /></button>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing === "new" ? "Novo cupom" : "Editar cupom"}>
        <div className="grid max-h-[70vh] grid-cols-2 gap-3 overflow-y-auto pr-1">
          <Field label="Código"><input className="input uppercase" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "") })} placeholder="CABANA10" /></Field>
          <Field label="Tipo">
            <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as Kind })}>
              <option value="PERCENT">Porcentagem (%)</option>
              <option value="FIXED">Valor fixo (R$)</option>
            </select>
          </Field>
          <Field label={form.type === "PERCENT" ? "Desconto (%)" : "Desconto (R$)"}>
            <input type="number" step={form.type === "PERCENT" ? 1 : 0.01} min={0} className="input" value={form.value} onChange={(e) => setForm({ ...form, value: Number(e.target.value) })} />
          </Field>
          <div className="flex items-center gap-2 pt-6"><Toggle checked={form.active} onChange={(v) => setForm({ ...form, active: v })} label="Ativo" /></div>
          <div className="col-span-2"><Field label="Descrição (opcional)"><input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Ex.: 10% OFF no primeiro pedido" /></Field></div>

          <Field label="Validade (opcional)"><input type="date" className="input" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} /></Field>
          <Field label="Pedido mínimo (R$)"><input type="number" step="0.01" min={0} className="input" value={form.minSubtotal} placeholder="sem mínimo" onChange={(e) => setForm({ ...form, minSubtotal: e.target.value })} /></Field>
          <Field label="Limite de usos"><input type="number" min={1} className="input" value={form.maxUses} placeholder="ilimitado" onChange={(e) => setForm({ ...form, maxUses: e.target.value })} /></Field>

          <div className="col-span-2 border-t border-black/5 pt-3">
            <Field label="Aplica-se a">
              <select className="input" value={form.appliesTo} onChange={(e) => setForm({ ...form, appliesTo: e.target.value as Scope })}>
                <option value="ALL">Todo o cardápio</option>
                <option value="PRODUCTS">Produtos específicos</option>
                <option value="CATEGORY">Uma categoria</option>
              </select>
            </Field>
          </div>

          {form.appliesTo === "CATEGORY" && (
            <div className="col-span-2">
              <Field label="Categoria">
                <select className="input" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                  <option value="">Selecione…</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
            </div>
          )}

          {form.appliesTo === "PRODUCTS" && (
            <div className="col-span-2">
              <p className="label">Produtos ({form.productIds.length} selecionados)</p>
              <div className="max-h-48 overflow-y-auto rounded-xl border border-black/10 p-2">
                {products.map((p) => (
                  <label key={p.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-black/5">
                    <input type="checkbox" checked={form.productIds.includes(p.id)} onChange={() => toggleProduct(p.id)} className="h-4 w-4 accent-brand" />
                    <span className="flex-1 truncate text-ink">{p.name}</span>
                    <span className="text-xs text-muted">{brl(p.finalPrice)}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {error && <p className="mt-3 text-sm text-danger">{error}</p>}
        <button onClick={save} disabled={create.isPending || update.isPending} className="btn-primary mt-3 w-full">
          {(create.isPending || update.isPending) && <Loader2 className="animate-spin" width={16} height={16} />}
          Salvar
        </button>
      </Modal>
    </AdminShell>
  );
}

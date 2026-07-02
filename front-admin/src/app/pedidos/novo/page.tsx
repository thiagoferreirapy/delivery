"use client";
import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { PAYMENT_METHOD_LABEL, type PaymentMethod } from "@cabana/shared";
import { AdminShell } from "@/components/AdminShell";
import { PageTitle, Spinner } from "@/components/ui";
import { Icon } from "@/components/icons";
import { useCustomers, useProducts, useCreateManualOrder, type CustomerDTO } from "@/lib/queries";
import { useRequireRole } from "@/lib/use-require-role";
import { brl } from "@/lib/format";

const METHODS: PaymentMethod[] = ["PIX", "CREDIT_CARD", "DEBIT_CARD", "CASH"];

export default function NewOrderPage() {
  const { ready } = useRequireRole(["ADMIN", "ATTENDANT"]);
  const router = useRouter();
  const [search, setSearch] = useState("");
  const { data: customers = [], isLoading: loadingCustomers } = useCustomers(search);
  const { data: products = [] } = useProducts();
  const createOrder = useCreateManualOrder();

  const [customer, setCustomer] = useState<CustomerDTO | null>(null);
  const [addressId, setAddressId] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("PIX");
  const [qtys, setQtys] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);

  const activeProducts = useMemo(() => products.filter((p) => p.active), [products]);
  const items = Object.entries(qtys).filter(([, q]) => q > 0);
  const total = items.reduce((sum, [pid, q]) => {
    const p = activeProducts.find((x) => x.id === pid);
    return sum + (p ? p.finalPrice * q : 0);
  }, 0);

  if (!ready) return null;

  function setQty(id: string, delta: number) {
    setQtys((s) => ({ ...s, [id]: Math.max(0, (s[id] ?? 0) + delta) }));
  }

  async function submit() {
    setError(null);
    if (!customer) return setError("Selecione um cliente");
    if (!addressId) return setError("Selecione um endereço");
    if (items.length === 0) return setError("Adicione ao menos um item");
    try {
      const order = await createOrder.mutateAsync({
        userId: customer.id,
        addressId,
        paymentMethod: method,
        items: items.map(([productId, quantity]) => ({ productId, quantity })),
      });
      router.replace(`/pedidos/${order.id}`);
    } catch (e: any) {
      setError(e?.message ?? "Falha ao criar pedido");
    }
  }

  return (
    <AdminShell>
      <PageTitle title="Novo pedido" subtitle="Cadastro manual (balcão / telefone)" />
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Cliente */}
        <section className="card p-4">
          <h2 className="mb-2 font-semibold text-ink">1. Cliente</h2>
          {customer ? (
            <div className="flex items-center justify-between rounded-xl bg-black/5 p-3">
              <div>
                <p className="font-semibold text-ink">{customer.name}</p>
                <p className="text-xs text-muted">{customer.email}</p>
              </div>
              <button onClick={() => { setCustomer(null); setAddressId(""); }} className="text-sm text-brand">Trocar</button>
            </div>
          ) : (
            <>
              <label className="mb-2 flex items-center gap-2 rounded-xl border border-black/10 bg-white px-3 py-2">
                <Icon.search className="text-muted" width={16} height={16} />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nome, e-mail ou telefone" className="w-full bg-transparent text-sm outline-none" />
              </label>
              {loadingCustomers ? (
                <Spinner />
              ) : (
                <div className="max-h-56 divide-y divide-black/5 overflow-y-auto">
                  {customers.map((c) => (
                    <button key={c.id} onClick={() => { setCustomer(c); setAddressId(c.addresses[0]?.id ?? ""); }} className="flex w-full flex-col items-start py-2 text-left hover:opacity-80">
                      <span className="text-sm font-medium text-ink">{c.name}</span>
                      <span className="text-xs text-muted">{c.email} · {c.addresses.length} endereço(s)</span>
                    </button>
                  ))}
                  {customers.length === 0 && <p className="py-4 text-center text-sm text-muted">Nenhum cliente.</p>}
                </div>
              )}
            </>
          )}

          {customer && (
            <div className="mt-3">
              <h3 className="label">Endereço</h3>
              <div className="flex flex-col gap-2">
                {customer.addresses.map((a) => (
                  <label key={a.id} className={`flex cursor-pointer items-start gap-2 rounded-xl border p-2 text-sm ${addressId === a.id ? "border-brand bg-brand/5" : "border-black/10"}`}>
                    <input type="radio" checked={addressId === a.id} onChange={() => setAddressId(a.id)} className="mt-1 accent-brand" />
                    <span><b>{a.label}</b> — {a.street}, {a.number}, {a.neighborhood}, {a.city}/{a.state}</span>
                  </label>
                ))}
                {customer.addresses.length === 0 && <p className="text-sm text-danger">Cliente sem endereço cadastrado.</p>}
              </div>
            </div>
          )}
        </section>

        {/* Itens */}
        <section className="card p-4">
          <h2 className="mb-2 font-semibold text-ink">2. Itens</h2>
          <div className="max-h-72 divide-y divide-black/5 overflow-y-auto">
            {activeProducts.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-2 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm text-ink">{p.name}</p>
                  <p className="text-xs text-muted">{brl(p.finalPrice)}</p>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-black/10 px-1.5 py-0.5">
                  <button onClick={() => setQty(p.id, -1)} className="grid h-6 w-6 place-items-center rounded-full hover:bg-black/5">−</button>
                  <span className="w-5 text-center text-sm font-semibold">{qtys[p.id] ?? 0}</span>
                  <button onClick={() => setQty(p.id, 1)} className="grid h-6 w-6 place-items-center rounded-full hover:bg-black/5">+</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Pagamento + submit */}
      <section className="card mt-4 p-4">
        <h2 className="mb-2 font-semibold text-ink">3. Pagamento</h2>
        <div className="mb-3 flex flex-wrap gap-2">
          {METHODS.map((m) => (
            <button key={m} onClick={() => setMethod(m)} className={`rounded-xl border px-3 py-2 text-sm font-medium ${method === m ? "border-brand bg-brand/5 text-brand" : "border-black/10"}`}>
              {PAYMENT_METHOD_LABEL[m]}
            </button>
          ))}
        </div>
        {error && <p className="mb-2 text-sm text-danger">{error}</p>}
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold text-ink tabular-nums">{brl(total)}</span>
          <button onClick={submit} disabled={createOrder.isPending} className="btn-primary">
            {createOrder.isPending && <Loader2 className="animate-spin" width={16} height={16} />}
            {createOrder.isPending ? "Criando…" : "Criar pedido"}
          </button>
        </div>
      </section>
    </AdminShell>
  );
}

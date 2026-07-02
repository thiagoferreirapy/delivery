"use client";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PAYMENT_METHOD_LABEL, type PaymentMethod } from "@cabana/shared";
import { useAddresses, useCreateOrder, useCreatePix, useSimulatePix, useOrder } from "@/lib/queries";
import { useCartStore } from "@/lib/cart-store";
import { useRequireAuth } from "@/lib/use-require-auth";
import { brl } from "@/lib/format";
import { DELIVERY_FEE_DISPLAY } from "@/lib/config";
import { PageHeader, Spinner } from "@/components/ui";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { IconCopy, IconCheck } from "@/components/icons";

const METHODS: PaymentMethod[] = ["PIX", "CREDIT_CARD", "DEBIT_CARD", "CASH"];

export default function CheckoutPage() {
  const router = useRouter();
  const { ready } = useRequireAuth();
  const { data: addresses = [], isLoading: loadingAddr } = useAddresses();
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clear);

  const [addressId, setAddressId] = useState<string>("");
  const [method, setMethod] = useState<PaymentMethod>("PIX");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  // etapa PIX
  const [pixOrderId, setPixOrderId] = useState<string | null>(null);
  const [pix, setPix] = useState<{ copyPaste: string; qrImageUrl: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const createOrder = useCreateOrder();
  const createPix = useCreatePix();
  const simulatePix = useSimulatePix();

  // poll do pedido enquanto aguarda pagamento PIX
  const { data: pixOrder } = useOrder(pixOrderId ?? "", { poll: !!pixOrderId });
  useEffect(() => {
    if (pixOrderId && pixOrder && pixOrder.status !== "PENDING") {
      clearCart();
      router.replace(`/pedido/${pixOrderId}`);
    }
  }, [pixOrder, pixOrderId, router, clearCart]);

  useEffect(() => {
    const def = addresses.find((a) => a.isDefault) ?? addresses[0];
    if (def && !addressId) setAddressId(def.id);
  }, [addresses, addressId]);

  const subtotal = useMemo(() => items.reduce((n, i) => n + i.unitPrice * i.quantity, 0), [items]);
  const total = subtotal + (items.length ? DELIVERY_FEE_DISPLAY : 0);

  if (!ready) return <Spinner />;

  async function placeOrder() {
    setError(null);
    if (!addressId) return setError("Escolha um endereço de entrega");
    if (items.length === 0) return setError("Carrinho vazio");
    try {
      const order = await createOrder.mutateAsync({
        addressId,
        paymentMethod: method,
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          notes: i.notes,
          extras: i.extras.map((e) => ({ id: e.id, quantity: e.quantity })),
          removedIds: i.removed.map((r) => r.id),
        })),
        notes: notes || undefined,
      });
      if (method === "PIX") {
        setPixOrderId(order.id);
        const charge = await createPix.mutateAsync(order.id);
        setPix({ copyPaste: charge.copyPaste, qrImageUrl: charge.qrImageUrl });
      } else {
        clearCart();
        router.replace(`/pedido/${order.id}`);
      }
    } catch (e: any) {
      const msg = e?.message ?? "Falha ao criar pedido";
      setError(msg);
      toast.error(msg);
    }
  }

  // ===== Etapa PIX =====
  if (pix && pixOrderId) {
    return (
      <div className="mx-auto min-h-dvh max-w-app">
        <PageHeader title="Pagamento PIX" back="/carrinho" />
        <div className="flex flex-col items-center gap-4 p-6 text-center">
          <p className="text-sm text-muted">Escaneie o QR ou copie o código para pagar</p>
          <div className="rounded-2xl bg-white p-3 shadow-card">
            <Image src={pix.qrImageUrl} alt="QR Code PIX" width={240} height={240} className="rounded-lg" unoptimized />
          </div>
          <button
            onClick={() => {
              navigator.clipboard?.writeText(pix.copyPaste);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
            className="btn-ghost w-full"
          >
            {copied ? <IconCheck /> : <IconCopy />}
            {copied ? "Copiado!" : "Copiar código PIX"}
          </button>

          <div className="mt-2 flex items-center gap-2 text-sm text-muted">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand/30 border-t-brand" />
            Aguardando confirmação do pagamento…
          </div>

          {/* Ambiente de teste: confirma na hora */}
          <button
            onClick={() => simulatePix.mutate(pixOrderId)}
            className="btn-primary w-full"
            disabled={simulatePix.isPending}
          >
            {simulatePix.isPending && <Loader2 className="animate-spin" width={18} height={18} />}
            Simular pagamento (teste)
          </button>
        </div>
      </div>
    );
  }

  // ===== Formulário =====
  return (
    <div className="mx-auto min-h-dvh max-w-app pb-32">
      <PageHeader title="Finalizar pedido" back="/carrinho" />
      <div className="flex flex-col gap-5 p-4">
        {/* Endereço */}
        <section>
          <h2 className="mb-2 font-semibold text-ink">Endereço de entrega</h2>
          {loadingAddr ? (
            <Spinner />
          ) : addresses.length === 0 ? (
            <Link href="/perfil" className="btn-ghost w-full">Cadastrar endereço</Link>
          ) : (
            <div className="flex flex-col gap-2">
              {addresses.map((a) => (
                <label
                  key={a.id}
                  className={`card flex cursor-pointer items-start gap-3 p-3 ${addressId === a.id ? "ring-2 ring-brand" : ""}`}
                >
                  <input type="radio" name="addr" checked={addressId === a.id} onChange={() => setAddressId(a.id)} className="mt-1 accent-brand" />
                  <span className="text-sm">
                    <span className="font-semibold text-ink">{a.label}</span>
                    <span className="block text-muted">{a.street}, {a.number} — {a.neighborhood}, {a.city}/{a.state}</span>
                  </span>
                </label>
              ))}
            </div>
          )}
        </section>

        {/* Pagamento */}
        <section>
          <h2 className="mb-2 font-semibold text-ink">Forma de pagamento</h2>
          <div className="grid grid-cols-2 gap-2">
            {METHODS.map((m) => (
              <button
                key={m}
                onClick={() => setMethod(m)}
                className={`rounded-2xl border p-3 text-sm font-medium transition-colors ${
                  method === m ? "border-brand bg-brand/5 text-brand" : "border-black/10 bg-white text-ink"
                }`}
              >
                {PAYMENT_METHOD_LABEL[m]}
              </button>
            ))}
          </div>
          {method !== "PIX" && (
            <p className="mt-2 text-xs text-muted">Pagamento na entrega, confirmado pelo entregador.</p>
          )}
        </section>

        {/* Observações */}
        <section>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Observações do pedido (opcional)" className="input min-h-[56px] resize-none" />
        </section>

        {error && <p className="text-sm text-danger">{error}</p>}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-black/5 bg-white/95 px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] backdrop-blur">
        <div className="mx-auto flex max-w-app items-center justify-between gap-3">
          <div className="text-sm">
            <span className="block text-muted">Total</span>
            <span className="text-lg font-semibold text-ink tabular-nums">{brl(total)}</span>
          </div>
          <button onClick={placeOrder} disabled={createOrder.isPending} className="btn-primary flex-1">
            {createOrder.isPending && <Loader2 className="animate-spin" width={18} height={18} />}
            {createOrder.isPending ? "Enviando…" : method === "PIX" ? "Pagar com PIX" : "Confirmar pedido"}
          </button>
        </div>
      </div>
    </div>
  );
}

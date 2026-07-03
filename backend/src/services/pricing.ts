import type { QuoteInput } from "@cabana/shared";
import { prisma } from "../lib/prisma.js";
import { badRequest } from "../lib/errors.js";
import { env } from "../config/env.js";
import { finalPrice, pixPrice, dec } from "../lib/serialize.js";

const round2 = (n: number) => Math.round(n * 100) / 100;

// Linha de item já precificada (pronta para gravar em OrderItem)
export interface PricedItem {
  productId: string;
  quantity: number;
  unitPrice: number; // base (com promo/PIX) + extras, por unidade
  notes: string | null;
  extrasJson: string | null;
  removedJson: string | null;
  lineTotal: number; // unitPrice * quantity
  categoryId: string;
}

export interface PriceResult {
  items: PricedItem[];
  subtotal: number;
  pixSavings: number; // economia dos itens por pagar no PIX (0 se não-PIX)
  discount: number; // desconto do cupom
  deliveryFee: number;
  total: number;
  coupon: { id: string; code: string; description: string | null } | null;
  couponError: string | null; // preenchido quando o código informado é inválido
}

// Cálculo autoritativo de preços. Preços vêm sempre do servidor, nunca do client.
// Extras/remoções são validados aqui (mesma regra do pedido e da prévia).
export async function priceOrder(input: QuoteInput): Promise<PriceResult> {
  const isPix = input.paymentMethod === "PIX";
  const productIds = input.items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, active: true },
    include: { extras: true, removables: true },
  });
  const byId = new Map(products.map((p) => [p.id, p]));

  let subtotal = 0;
  let pixSavings = 0;
  const items: PricedItem[] = input.items.map((item) => {
    const p = byId.get(item.productId);
    if (!p) throw badRequest(`Produto indisponível: ${item.productId}`);

    const promo = finalPrice(dec(p.price), p.promoActive, p.promoPercent ?? null);
    const base = isPix ? pixPrice(promo, p.pixPromoActive, p.pixPromoPercent ?? null) : promo;

    // Extras (validados contra o produto; preço vem do servidor)
    const extraById = new Map(p.extras.map((e) => [e.id, e]));
    const selectedExtras = (item.extras ?? []).map((sel) => {
      const ex = extraById.get(sel.id);
      if (!ex) throw badRequest(`Adicional inválido em ${p.name}`);
      return { name: ex.name, price: dec(ex.price), quantity: sel.quantity };
    });
    const totalExtraQty = selectedExtras.reduce((n, e) => n + e.quantity, 0);
    if (p.maxExtras != null && totalExtraQty > p.maxExtras) {
      throw badRequest(`Máximo de ${p.maxExtras} adicionais em ${p.name}`);
    }
    const extrasSum = selectedExtras.reduce((s, e) => s + e.price * e.quantity, 0);

    // Ingredientes removidos (validados)
    const removableById = new Map(p.removables.map((r) => [r.id, r]));
    const removedNames = (item.removedIds ?? []).map((id) => {
      const r = removableById.get(id);
      if (!r) throw badRequest(`Ingrediente inválido em ${p.name}`);
      return r.name;
    });
    if (p.maxRemovable != null && removedNames.length > p.maxRemovable) {
      throw badRequest(`Máximo de ${p.maxRemovable} remoções em ${p.name}`);
    }

    const unit = round2(base + extrasSum);
    const lineTotal = round2(unit * item.quantity);
    subtotal += lineTotal;
    if (isPix) pixSavings += (promo - base) * item.quantity;

    return {
      productId: p.id,
      quantity: item.quantity,
      unitPrice: unit,
      notes: item.notes ?? null,
      extrasJson: selectedExtras.length ? JSON.stringify(selectedExtras) : null,
      removedJson: removedNames.length ? JSON.stringify(removedNames) : null,
      lineTotal,
      categoryId: p.categoryId,
    };
  });
  subtotal = round2(subtotal);
  pixSavings = round2(pixSavings);

  // ===== Cupom =====
  let coupon: PriceResult["coupon"] = null;
  let couponError: string | null = null;
  let discount = 0;

  const code = input.couponCode?.trim().toUpperCase();
  if (code) {
    const c = await prisma.coupon.findUnique({
      where: { code },
      include: { products: { select: { id: true } } },
    });
    if (!c) couponError = "Cupom não encontrado";
    else if (!c.active) couponError = "Cupom inativo";
    else if (c.expiresAt && c.expiresAt.getTime() < Date.now()) couponError = "Cupom expirado";
    else if (c.maxUses != null && c.usedCount >= c.maxUses) couponError = "Cupom esgotado";
    else if (c.minSubtotal != null && subtotal < dec(c.minSubtotal))
      couponError = `Pedido mínimo de R$ ${dec(c.minSubtotal).toFixed(2)} para este cupom`;
    else {
      // subtotal elegível conforme o escopo do cupom
      let eligible = subtotal;
      if (c.appliesTo === "PRODUCTS") {
        const set = new Set(c.products.map((p) => p.id));
        eligible = round2(
          items.filter((it) => set.has(it.productId)).reduce((s, it) => s + it.lineTotal, 0)
        );
      } else if (c.appliesTo === "CATEGORY") {
        eligible = round2(
          items.filter((it) => it.categoryId === c.categoryId).reduce((s, it) => s + it.lineTotal, 0)
        );
      }
      if (eligible <= 0) couponError = "Cupom não vale para os itens do carrinho";
      else {
        const raw = c.type === "PERCENT" ? (eligible * dec(c.value)) / 100 : dec(c.value);
        discount = round2(Math.min(raw, eligible));
        coupon = { id: c.id, code: c.code, description: c.description ?? null };
      }
    }
  }

  const deliveryFee = env.deliveryFee;
  const total = round2(subtotal - discount + deliveryFee);
  return { items, subtotal, pixSavings, discount, deliveryFee, total, coupon, couponError };
}

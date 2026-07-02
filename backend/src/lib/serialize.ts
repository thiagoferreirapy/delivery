import type {
  ProductDTO,
  CategoryDTO,
  AddressDTO,
  OrderDTO,
  CourierPublicDTO,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from "@cabana/shared";

// Prisma Decimal / Date -> primitivos serializáveis
export const dec = (v: unknown): number => (v == null ? 0 : Number(v));
const iso = (d: Date | null | undefined): string | null =>
  d ? new Date(d).toISOString() : null;

export function finalPrice(price: number, promoActive: boolean, promoPercent: number | null): number {
  if (promoActive && promoPercent && promoPercent > 0) {
    return Math.round(price * (1 - promoPercent / 100) * 100) / 100;
  }
  return price;
}

export function serializeCategory(c: any): CategoryDTO {
  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    imageUrl: c.imageUrl ?? null,
    sortOrder: c.sortOrder,
    active: c.active,
  };
}

export function serializeProduct(p: any): ProductDTO {
  const price = dec(p.price);
  return {
    id: p.id,
    categoryId: p.categoryId,
    category: p.category
      ? { id: p.category.id, name: p.category.name, slug: p.category.slug }
      : undefined,
    name: p.name,
    description: p.description ?? null,
    ingredients: p.ingredients ?? null,
    prepNotes: p.prepNotes ?? null,
    price,
    imageUrl: p.imageUrl ?? null,
    active: p.active,
    promoActive: p.promoActive,
    promoPercent: p.promoPercent ?? null,
    finalPrice: finalPrice(price, p.promoActive, p.promoPercent ?? null),
  };
}

export function serializeAddress(a: any): AddressDTO {
  return {
    id: a.id,
    label: a.label,
    cep: a.cep,
    street: a.street,
    number: a.number,
    complement: a.complement ?? null,
    neighborhood: a.neighborhood,
    city: a.city,
    state: a.state,
    lat: a.lat ?? null,
    lng: a.lng ?? null,
    isDefault: a.isDefault,
  };
}

export function serializeCourier(c: any): CourierPublicDTO {
  return {
    id: c.id,
    name: c.name,
    phone: c.phone,
    active: c.active,
    currentLat: c.currentLat ?? null,
    currentLng: c.currentLng ?? null,
    lastLocationAt: iso(c.lastLocationAt),
  };
}

// Order com relações: items(+product), address, user, courier, payment, delivery, history, rating
export function serializeOrder(o: any): OrderDTO {
  return {
    id: o.id,
    code: o.code,
    status: o.status as OrderStatus,
    paymentMethod: o.paymentMethod as PaymentMethod,
    paymentStatus: (o.payment?.status ?? null) as PaymentStatus | null,
    subtotal: dec(o.subtotal),
    deliveryFee: dec(o.deliveryFee),
    total: dec(o.total),
    notes: o.notes ?? null,
    items: (o.items ?? []).map((it: any) => ({
      id: it.id,
      productId: it.productId,
      name: it.product?.name ?? "Item",
      imageUrl: it.product?.imageUrl ?? null,
      quantity: it.quantity,
      unitPrice: dec(it.unitPrice),
      notes: it.notes ?? null,
    })),
    address: serializeAddress(o.address),
    customer: {
      id: o.user?.id ?? o.userId,
      name: o.user?.name ?? "Cliente",
      phone: o.user?.phone ?? null,
    },
    courier: o.courier ? serializeCourier(o.courier) : null,
    history: (o.history ?? []).map((h: any) => ({
      id: h.id,
      status: h.status as OrderStatus,
      note: h.note ?? null,
      photoUrl: h.photoUrl ?? null,
      changedByEmployee: h.changedByEmployee ?? null,
      createdAt: iso(h.createdAt)!,
    })),
    pickupPhotoUrl: o.delivery?.pickupPhotoUrl ?? null,
    deliveryPhotoUrl: o.delivery?.deliveryPhotoUrl ?? null,
    rating: o.rating ? { stars: o.rating.stars, comment: o.rating.comment ?? null } : null,
    createdAt: iso(o.createdAt)!,
    updatedAt: iso(o.updatedAt)!,
  };
}

// include padrão para carregar um Order completo
export const orderInclude = {
  items: { include: { product: true } },
  address: true,
  user: true,
  courier: true,
  payment: true,
  delivery: true,
  rating: true,
  history: { orderBy: { createdAt: "asc" as const } },
};

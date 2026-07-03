import { z } from "zod";

// ===== Auth =====
export const registerSchema = z.object({
  name: z.string().min(2, "Nome muito curto"),
  email: z.string().email("E-mail inválido"),
  phone: z.string().min(8).optional(),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});
export type RegisterInput = z.infer<typeof registerSchema>;

// Atualização do próprio perfil (cliente) — email não é editável aqui.
export const updateProfileSchema = z.object({
  name: z.string().min(2, "Nome muito curto").optional(),
  phone: z.string().min(8, "Telefone muito curto").optional().nullable(),
});
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Informe a senha atual"),
  newPassword: z.string().min(6, "Mínimo 6 caracteres"),
});
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const loginSchema = z.object({
  email: z.string().min(3), // couriers logam por telefone; aceita string genérica
  password: z.string().min(1),
  scope: z.enum(["CUSTOMER", "EMPLOYEE", "COURIER"]).default("CUSTOMER"),
});
export type LoginInput = z.infer<typeof loginSchema>;

// ===== Endereços =====
export const addressSchema = z.object({
  label: z.string().min(1),
  cep: z.string().min(8),
  street: z.string().min(1),
  number: z.string().min(1),
  complement: z.string().optional().nullable(),
  neighborhood: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(2).max(2),
  lat: z.number().optional().nullable(),
  lng: z.number().optional().nullable(),
  isDefault: z.boolean().optional(),
});
export type AddressInput = z.infer<typeof addressSchema>;

// ===== Catálogo =====
export const categorySchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "slug inválido"),
  imageUrl: z.string().url().optional().nullable(),
  sortOrder: z.number().int().optional(),
  active: z.boolean().optional(),
});
export type CategoryInput = z.infer<typeof categorySchema>;

export const productSchema = z.object({
  categoryId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  ingredients: z.string().optional().nullable(),
  prepNotes: z.string().optional().nullable(),
  price: z.number().nonnegative(),
  imageUrl: z.string().url().optional().nullable(),
  active: z.boolean().optional(),
  promoActive: z.boolean().optional(),
  promoPercent: z.number().int().min(1).max(99).optional().nullable(),
  // Desconto extra no PIX (aplicado sobre o preço já promocional)
  pixPromoActive: z.boolean().optional(),
  pixPromoPercent: z.number().int().min(1).max(99).optional().nullable(),
  // Customização (null/undefined = à vontade)
  maxExtras: z.number().int().min(0).optional().nullable(),
  maxRemovable: z.number().int().min(0).optional().nullable(),
  extras: z
    .array(z.object({ name: z.string().min(1), price: z.number().nonnegative() }))
    .optional(),
  removables: z.array(z.object({ name: z.string().min(1) })).optional(),
});
export type ProductInput = z.infer<typeof productSchema>;

// ===== Pedidos =====
export const orderItemInputSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1),
  notes: z.string().optional().nullable(),
  // extras escolhidos (id do ProductExtra + quantidade) e ingredientes removidos (id do ProductRemovable)
  extras: z
    .array(z.object({ id: z.string().min(1), quantity: z.number().int().min(1) }))
    .optional(),
  removedIds: z.array(z.string().min(1)).optional(),
});

export const createOrderSchema = z.object({
  addressId: z.string().min(1),
  paymentMethod: z.enum(["PIX", "CREDIT_CARD", "DEBIT_CARD", "CASH"]),
  items: z.array(orderItemInputSchema).min(1, "Carrinho vazio"),
  notes: z.string().optional().nullable(),
  // cupom de desconto (código digitado no checkout)
  couponCode: z.string().trim().max(24).optional().nullable(),
  // usado por ATTENDANT/ADMIN no cadastro manual (pedido em nome de cliente)
  userId: z.string().optional(),
});
export type CreateOrderInput = z.infer<typeof createOrderSchema>;

// Prévia de preços (checkout) — mesmo cálculo do pedido, sem gravar nada.
export const quoteSchema = z.object({
  paymentMethod: z.enum(["PIX", "CREDIT_CARD", "DEBIT_CARD", "CASH"]),
  items: z.array(orderItemInputSchema).min(1, "Carrinho vazio"),
  couponCode: z.string().trim().max(24).optional().nullable(),
});
export type QuoteInput = z.infer<typeof quoteSchema>;

// ===== Cupons =====
const couponBaseSchema = z.object({
  code: z
    .string()
    .trim()
    .min(3, "Mínimo 3 caracteres")
    .max(24)
    .regex(/^[A-Za-z0-9]+$/, "Use apenas letras e números"),
  description: z.string().optional().nullable(),
  type: z.enum(["PERCENT", "FIXED"]),
  value: z.number().positive("Valor deve ser maior que zero"),
  active: z.boolean().optional(),
  expiresAt: z.string().datetime().optional().nullable(), // ISO
  minSubtotal: z.number().nonnegative().optional().nullable(),
  maxUses: z.number().int().positive().optional().nullable(),
  appliesTo: z.enum(["ALL", "PRODUCTS", "CATEGORY"]).optional(),
  categoryId: z.string().optional().nullable(),
  productIds: z.array(z.string()).optional(),
});
export const couponSchema = couponBaseSchema.refine(
  (d) => d.type !== "PERCENT" || d.value <= 90,
  { message: "Percentual máximo é 90%", path: ["value"] }
);
export const couponUpdateSchema = couponBaseSchema.partial();
export type CouponInput = z.infer<typeof couponBaseSchema>;

export const updateStatusSchema = z.object({
  status: z.enum([
    "PENDING",
    "CONFIRMED",
    "PREPARING",
    "READY",
    "DISPATCHED",
    "PICKED_UP",
    "IN_ROUTE",
    "DELIVERED",
    "CONFIRMED_BY_CUSTOMER",
    "CANCELLED",
  ]),
  note: z.string().optional().nullable(),
  photoUrl: z.string().optional().nullable(),
});
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;

export const ratingSchema = z.object({
  stars: z.number().int().min(1).max(5),
  comment: z.string().optional().nullable(),
});
export type RatingInput = z.infer<typeof ratingSchema>;

// ===== Expedição =====
export const assignCourierSchema = z.object({
  courierId: z.string().min(1),
  photoUrl: z.string().optional().nullable(),
});
export type AssignCourierInput = z.infer<typeof assignCourierSchema>;

// ===== Entregador =====
export const courierActionSchema = z.object({
  action: z.enum(["pickup", "start-route", "deliver"]),
  photoUrl: z.string().optional().nullable(),
  paymentConfirmed: z.boolean().optional(),
});
export type CourierActionInput = z.infer<typeof courierActionSchema>;

export const locationSchema = z.object({
  lat: z.number(),
  lng: z.number(),
});
export type LocationInput = z.infer<typeof locationSchema>;

// ===== Funcionários / Entregadores (ADMIN) =====
export const employeeSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6).optional(), // opcional no update
  role: z.enum(["ADMIN", "KITCHEN", "DISPATCH", "ATTENDANT"]),
  active: z.boolean().optional(),
});
export type EmployeeInput = z.infer<typeof employeeSchema>;

export const courierSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(8),
  password: z.string().min(6).optional(),
  active: z.boolean().optional(),
});
export type CourierInput = z.infer<typeof courierSchema>;

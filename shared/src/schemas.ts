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

// ===== Grupos de opções (combo, pizza meio a meio, tamanho) =====
export const optionItemSchema = z.object({
  name: z.string().min(1, "Nome da opção é obrigatório"),
  priceDelta: z.number().default(0), // pode ser negativo (desconto)
  linkedProductId: z.string().optional().nullable(), // aponta p/ um produto real do catálogo
  active: z.boolean().optional(),
});

export const optionGroupSchema = z
  .object({
    name: z.string().min(1, "Nome do grupo é obrigatório"),
    type: z.enum(["SINGLE", "MULTI"]).default("SINGLE"),
    kind: z.enum(["ADD", "REMOVE"]).default("ADD"),
    minSelect: z.number().int().min(0).default(0),
    maxSelect: z.number().int().min(1).optional().nullable(),
    pricingRule: z.enum(["SUM", "MAX", "AVG"]).default("SUM"),
    allowQuantity: z.boolean().default(false),
    active: z.boolean().optional(),
    options: z.array(optionItemSchema).min(1, "Adicione ao menos uma opção"),
  })
  .refine((g) => g.maxSelect == null || g.maxSelect >= g.minSelect, {
    message: "Máximo não pode ser menor que o mínimo",
    path: ["maxSelect"],
  })
  // SINGLE é radio: escolher mais de 1 não faz sentido
  .refine((g) => g.type !== "SINGLE" || (g.maxSelect ?? 1) === 1, {
    message: "Grupo de escolha única aceita no máximo 1",
    path: ["maxSelect"],
  })
  .refine((g) => g.type !== "SINGLE" || g.minSelect <= 1, {
    message: "Grupo de escolha única aceita mínimo 0 ou 1",
    path: ["minSelect"],
  })
  // quantidade repetida (2x bacon) só faz sentido em MULTI
  .refine((g) => !g.allowQuantity || g.type === "MULTI", {
    message: "Quantidade por opção só vale em grupos de múltipla escolha",
    path: ["allowQuantity"],
  })
  // não dá pra exigir mais escolhas do que existem opções
  .refine((g) => g.minSelect <= g.options.length, {
    message: "Mínimo maior que o número de opções do grupo",
    path: ["minSelect"],
  })
  // MAX/AVG dividem o preço entre as escolhas — exige poder escolher mais de uma
  .refine((g) => g.pricingRule === "SUM" || g.type === "MULTI", {
    message: "Regra 'maior preço'/'média' só vale em grupos de múltipla escolha",
    path: ["pricingRule"],
  })
  // grupo de remoção nunca cobra
  .refine((g) => g.kind !== "REMOVE" || g.options.every((o) => o.priceDelta === 0), {
    message: "Grupo de remoção não pode ter preço",
    path: ["options"],
  });
export type OptionGroupInput = z.infer<typeof optionGroupSchema>;

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
  optionGroups: z.array(optionGroupSchema).optional(),
});
export type ProductInput = z.infer<typeof productSchema>;

// ===== Loja (horários) =====
const hhmm = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use o formato HH:MM (ex.: 18:30)");

export const openingHourSchema = z.object({
  weekday: z.number().int().min(0).max(6),
  opensAt: hhmm,
  closesAt: hhmm,
  active: z.boolean().optional(),
});

export const storeSchema = z.object({
  name: z.string().min(1).optional(),
  paused: z.boolean().optional(),
  pausedMsg: z.string().optional().nullable(),
  lastOrderMinutes: z.number().int().min(0).max(120).optional(),
  hours: z.array(openingHourSchema).optional(),
});
export type StoreInput = z.infer<typeof storeSchema>;

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
  // escolhas dos OptionGroups: id do OptionItem + quantidade (omitida = 1)
  selections: z
    .array(z.object({ id: z.string().min(1), quantity: z.number().int().min(1).optional() }))
    .optional(),
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

// ===== Chat do pedido =====
export const sendMessageSchema = z.object({
  body: z.string().trim().min(1, "Mensagem vazia").max(1000, "Mensagem muito longa"),
});
export type SendMessageInput = z.infer<typeof sendMessageSchema>;

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

// Valida CPF pelos dígitos verificadores (rejeita inválidos e sequências iguais)
export function isValidCPF(value: string): boolean {
  const s = (value || "").replace(/\D/g, "");
  if (s.length !== 11 || /^(\d)\1{10}$/.test(s)) return false;
  const calc = (len: number) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += parseInt(s.charAt(i), 10) * (len + 1 - i);
    const d = 11 - (sum % 11);
    return d >= 10 ? 0 : d;
  };
  return calc(9) === parseInt(s.charAt(9), 10) && calc(10) === parseInt(s.charAt(10), 10);
}

// Idade >= 18 a partir de uma data (YYYY-MM-DD ou ISO)
export function isAdult(dateStr: string): boolean {
  const b = new Date(dateStr);
  if (isNaN(b.getTime())) return false;
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
  return age >= 18 && age < 120;
}

const cpfField = z.string().transform((v) => v.replace(/\D/g, "")).refine(isValidCPF, "CPF inválido");
const cnhField = z.string().transform((v) => v.replace(/\D/g, "")).refine((v) => v.length === 11, "CNH deve ter 11 dígitos");
const birthField = z
  .string()
  .refine((d) => !isNaN(Date.parse(d)), "Data de nascimento inválida")
  .refine(isAdult, "O entregador deve ter 18 anos ou mais");

// Cadastro completo do entregador (admin). No update tudo vira opcional.
export const courierSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(8),
  password: z.string().min(6).optional(),
  active: z.boolean().optional(),
  birthDate: birthField,
  cpf: cpfField,
  cpfFrontUrl: z.string().url("Envie a foto do CPF (frente)"),
  cpfBackUrl: z.string().url("Envie a foto do CPF (verso)"),
  cnh: cnhField,
  cnhFrontUrl: z.string().url("Envie a foto da CNH (frente)"),
  cnhBackUrl: z.string().url("Envie a foto da CNH (verso)"),
  photoUrl: z.string().url("Envie a foto do entregador"),
});
export const courierUpdateSchema = courierSchema.partial();
export type CourierInput = z.infer<typeof courierSchema>;

// Auto-edição do entregador (no app dele): só nome e foto.
export const courierProfileSchema = z.object({
  name: z.string().min(2, "Nome muito curto").optional(),
  photoUrl: z.string().url().optional().nullable(),
});
export type CourierProfileInput = z.infer<typeof courierProfileSchema>;

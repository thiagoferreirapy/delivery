import type {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  EmployeeRole,
  AuthScope,
} from "./enums.js";

// DTOs de resposta (serializados — Decimal vira number, datas viram ISO string)

export interface AuthUser {
  id: string;
  name: string;
  email?: string;
  phone?: string | null;
  scope: AuthScope;
  role?: EmployeeRole; // apenas EMPLOYEE
  photoUrl?: string | null; // apenas COURIER (foto do entregador)
}

export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
}

export interface CategoryDTO {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  sortOrder: number;
  active: boolean;
}

export interface ProductExtraDTO {
  id: string;
  name: string;
  price: number;
}

export interface ProductRemovableDTO {
  id: string;
  name: string;
}

// ===== Grupos de opções =====
// "SINGLE" = escolhe 1 (radio) | "MULTI" = escolhe vários (checkbox)
export type OptionGroupType = "SINGLE" | "MULTI";
// "ADD" = a escolha compõe/soma | "REMOVE" = tirar ingrediente (sem custo)
export type OptionGroupKind = "ADD" | "REMOVE";
// Como as escolhas do grupo viram preço:
// SUM = soma tudo | MAX = cobra a mais cara | AVG = média (pizza meio a meio)
export type OptionPricingRule = "SUM" | "MAX" | "AVG";

export interface OptionItemDTO {
  id: string;
  name: string;
  priceDelta: number;
  linkedProductId: string | null;
  active: boolean;
}

export interface OptionGroupDTO {
  id: string;
  name: string;
  type: OptionGroupType;
  kind: OptionGroupKind;
  minSelect: number; // > 0 => grupo obrigatório
  maxSelect: number | null; // null = sem teto
  pricingRule: OptionPricingRule;
  allowQuantity: boolean;
  sortOrder: number;
  options: OptionItemDTO[];
}

export interface ProductDTO {
  id: string;
  categoryId: string;
  category?: { id: string; name: string; slug: string };
  name: string;
  description: string | null;
  ingredients: string | null;
  prepNotes: string | null;
  price: number;
  imageUrl: string | null;
  active: boolean;
  promoActive: boolean;
  promoPercent: number | null;
  finalPrice: number; // preço já com promoção aplicada
  // Desconto adicional no PIX
  pixPromoActive: boolean;
  pixPromoPercent: number | null;
  pixFinalPrice: number; // finalPrice já com o desconto PIX aplicado (== finalPrice se não houver)
  // Customização
  maxExtras: number | null; // null = à vontade
  maxRemovable: number | null; // null = à vontade
  extras: ProductExtraDTO[];
  removables: ProductRemovableDTO[];
  // Grupos com regra (combo, sabores de pizza, tamanho). Vazio na maioria dos produtos.
  optionGroups: OptionGroupDTO[];
}

// Item de pedido: extras escolhidos + ingredientes removidos
export interface OrderItemExtra {
  name: string;
  price: number;
  quantity: number;
}

// Snapshot de uma escolha de grupo, como gravada no pedido
export interface OrderItemSelectionOption {
  name: string;
  price: number; // priceDelta no momento do pedido
  quantity: number;
  linkedProductId: string | null;
}

export interface OrderItemSelection {
  groupName: string;
  kind: OptionGroupKind;
  pricingRule: OptionPricingRule;
  options: OrderItemSelectionOption[];
}

// ===== Loja (horários de funcionamento) =====
export interface OpeningHourDTO {
  id: string;
  weekday: number; // 0=domingo .. 6=sábado
  opensAt: string; // "HH:MM"
  closesAt: string; // "HH:MM" — se <= opensAt, vira o dia (ex.: 19:00 -> 02:00)
  active: boolean;
}

export interface StoreDTO {
  name: string;
  paused: boolean; // pausa manual do admin, independente do horário
  pausedMsg: string | null;
  lastOrderMinutes: number; // tolerância p/ aceitar pedido antes de fechar
  hours: OpeningHourDTO[];
  // Derivados pelo servidor (fonte da verdade — o client não recalcula)
  open: boolean;
  closedReason: string | null; // por que está fechada agora
  nextOpenAt: string | null; // ISO do próximo horário de abertura
}

// ===== Cupons =====
export interface CouponDTO {
  id: string;
  code: string;
  description: string | null;
  type: "PERCENT" | "FIXED";
  value: number;
  active: boolean;
  expiresAt: string | null;
  minSubtotal: number | null;
  maxUses: number | null;
  usedCount: number;
  appliesTo: "ALL" | "PRODUCTS" | "CATEGORY";
  categoryId: string | null;
  productIds: string[];
  createdAt: string;
}

// Resultado do cálculo de preços (prévia do checkout e retorno do pedido)
export interface QuoteDTO {
  paymentMethod: PaymentMethod;
  subtotal: number;
  pixSavings: number; // quanto o PIX economizou nos itens (0 se não-PIX)
  discount: number; // desconto do cupom
  deliveryFee: number;
  total: number;
  coupon: { code: string; description: string | null } | null;
  couponError: string | null; // mensagem quando o cupom informado é inválido
}

export interface AddressDTO {
  id: string;
  label: string;
  cep: string;
  street: string;
  number: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string;
  lat: number | null;
  lng: number | null;
  isDefault: boolean;
}

export interface OrderItemDTO {
  id: string;
  productId: string;
  name: string;
  imageUrl: string | null;
  quantity: number;
  unitPrice: number; // já inclui extras e opções
  notes: string | null;
  extras: OrderItemExtra[];
  removed: string[];
  // Escolhas dos grupos (combo/sabores). Vazio em pedidos antigos e em produtos sem grupo.
  selections: OrderItemSelection[];
}

export interface OrderStatusHistoryDTO {
  id: string;
  status: OrderStatus;
  note: string | null;
  photoUrl: string | null;
  changedByEmployee: string | null;
  createdAt: string;
}

export interface CourierPublicDTO {
  id: string;
  name: string;
  phone: string;
  active: boolean;
  currentLat?: number | null;
  currentLng?: number | null;
  lastLocationAt?: string | null;
}

// Cadastro completo do entregador (admin e o próprio entregador). NUNCA é
// exposto ao cliente — só via /couriers (admin) e /courier/profile (o próprio).
export interface CourierFullDTO {
  id: string;
  name: string;
  phone: string;
  active: boolean;
  photoUrl: string | null;
  birthDate: string | null;
  cpf: string | null;
  cpfFrontUrl: string | null;
  cpfBackUrl: string | null;
  cnh: string | null;
  cnhFrontUrl: string | null;
  cnhBackUrl: string | null;
  createdAt: string;
}

export interface OrderDTO {
  id: string;
  code: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus | null;
  subtotal: number;
  deliveryFee: number;
  discount: number; // desconto do cupom aplicado
  total: number;
  couponCode: string | null;
  notes: string | null;
  items: OrderItemDTO[];
  address: AddressDTO;
  customer: { id: string; name: string; phone?: string | null };
  courier: CourierPublicDTO | null;
  history: OrderStatusHistoryDTO[];
  pickupPhotoUrl?: string | null;
  deliveryPhotoUrl?: string | null;
  rating?: { stars: number; comment: string | null } | null;
  createdAt: string;
  updatedAt: string;
}

// ===== Chat do pedido =====
// Dois canais por pedido: STORE (loja<->cliente) e COURIER (entregador<->cliente).
export type MessageSenderType = "EMPLOYEE" | "CUSTOMER" | "COURIER";
export type MessageChannel = "STORE" | "COURIER";

export interface OrderMessageDTO {
  id: string;
  orderId: string;
  channel: MessageChannel;
  senderType: MessageSenderType;
  senderId: string;
  senderName: string;
  body: string;
  readAt: string | null;
  createdAt: string;
}

export interface OrderMessagesResponse {
  messages: OrderMessageDTO[];
  chatOpen: boolean; // false quando o pedido está finalizado
}

export interface OrderMessageEvent {
  orderId: string;
  code?: string;
  message: OrderMessageDTO;
}

export interface MessageReadEvent {
  orderId: string;
  readerType: MessageSenderType;
}

// Payload de eventos socket
export interface OrderStatusEvent {
  orderId: string;
  code: string;
  status: OrderStatus;
  courier?: CourierPublicDTO | null;
  at: string;
}

export interface CourierLocationEvent {
  orderId: string;
  courierId: string;
  lat: number;
  lng: number;
  at: string;
}

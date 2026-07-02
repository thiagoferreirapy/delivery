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
  // Customização
  maxExtras: number | null; // null = à vontade
  maxRemovable: number | null; // null = à vontade
  extras: ProductExtraDTO[];
  removables: ProductRemovableDTO[];
}

// Item de pedido: extras escolhidos + ingredientes removidos
export interface OrderItemExtra {
  name: string;
  price: number;
  quantity: number;
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
  unitPrice: number; // já inclui extras
  notes: string | null;
  extras: OrderItemExtra[];
  removed: string[];
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

export interface OrderDTO {
  id: string;
  code: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus | null;
  subtotal: number;
  deliveryFee: number;
  total: number;
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

// Enums compartilhados client <-> server. Espelham o schema.prisma.

export const OrderStatus = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  PREPARING: "PREPARING",
  READY: "READY",
  DISPATCHED: "DISPATCHED",
  PICKED_UP: "PICKED_UP",
  IN_ROUTE: "IN_ROUTE",
  DELIVERED: "DELIVERED",
  CONFIRMED_BY_CUSTOMER: "CONFIRMED_BY_CUSTOMER",
  CANCELLED: "CANCELLED",
} as const;
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export const PaymentMethod = {
  PIX: "PIX",
  CREDIT_CARD: "CREDIT_CARD",
  DEBIT_CARD: "DEBIT_CARD",
  CASH: "CASH",
} as const;
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export const PaymentStatus = {
  PENDING: "PENDING",
  PAID: "PAID",
  CONFIRMED_ON_DELIVERY: "CONFIRMED_ON_DELIVERY",
  FAILED: "FAILED",
  REFUNDED: "REFUNDED",
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const EmployeeRole = {
  ADMIN: "ADMIN",
  KITCHEN: "KITCHEN",
  DISPATCH: "DISPATCH",
  ATTENDANT: "ATTENDANT",
} as const;
export type EmployeeRole = (typeof EmployeeRole)[keyof typeof EmployeeRole];

// Escopos de autenticação (3 tipos de sujeito autenticável)
export const AuthScope = {
  CUSTOMER: "CUSTOMER",
  EMPLOYEE: "EMPLOYEE",
  COURIER: "COURIER",
} as const;
export type AuthScope = (typeof AuthScope)[keyof typeof AuthScope];

// Rótulos legíveis para UI (pt-BR)
export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "Aguardando pagamento",
  CONFIRMED: "Confirmado",
  PREPARING: "Em preparo",
  READY: "Pronto",
  DISPATCHED: "Encaminhado ao entregador",
  PICKED_UP: "Coletado pelo entregador",
  IN_ROUTE: "A caminho",
  DELIVERED: "Entregue",
  CONFIRMED_BY_CUSTOMER: "Recebimento confirmado",
  CANCELLED: "Cancelado",
};

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  PIX: "PIX",
  CREDIT_CARD: "Cartão de crédito",
  DEBIT_CARD: "Cartão de débito",
  CASH: "Dinheiro",
};

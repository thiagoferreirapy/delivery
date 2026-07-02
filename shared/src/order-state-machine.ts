import { OrderStatus, EmployeeRole } from "./enums.js";

// Ator que pode disparar transições
export type TransitionActor =
  | { kind: "SYSTEM" }
  | { kind: "CUSTOMER"; userId: string }
  | { kind: "COURIER"; courierId: string }
  | { kind: "EMPLOYEE"; role: EmployeeRole };

// Transições válidas: de -> [para...]
export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PREPARING", "CANCELLED"],
  PREPARING: ["READY", "CANCELLED"],
  READY: ["DISPATCHED", "CANCELLED"],
  DISPATCHED: ["PICKED_UP", "CANCELLED"],
  PICKED_UP: ["IN_ROUTE", "CANCELLED"],
  IN_ROUTE: ["DELIVERED"],
  DELIVERED: ["CONFIRMED_BY_CUSTOMER"],
  CONFIRMED_BY_CUSTOMER: [],
  CANCELLED: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_TRANSITIONS[from]?.includes(to) ?? false;
}

// Qual papel/ator tem permissão de fazer cada transição (regra de negócio central)
export function isActorAllowed(
  to: OrderStatus,
  actor: TransitionActor
): boolean {
  switch (to) {
    case "CONFIRMED":
      // pagamento PIX confirmado (sistema/webhook) ou cartão/dinheiro escolhido no checkout
      return actor.kind === "SYSTEM" || actor.kind === "CUSTOMER";
    case "PREPARING":
    case "READY":
      return (
        actor.kind === "EMPLOYEE" &&
        (actor.role === "KITCHEN" || actor.role === "ADMIN")
      );
    case "DISPATCHED":
      return (
        actor.kind === "EMPLOYEE" &&
        (actor.role === "DISPATCH" || actor.role === "ADMIN")
      );
    case "PICKED_UP":
    case "IN_ROUTE":
    case "DELIVERED":
      return actor.kind === "COURIER";
    case "CONFIRMED_BY_CUSTOMER":
      return actor.kind === "CUSTOMER";
    case "CANCELLED":
      return (
        actor.kind === "EMPLOYEE" && actor.role === "ADMIN"
      ) || actor.kind === "SYSTEM";
    default:
      return false;
  }
}

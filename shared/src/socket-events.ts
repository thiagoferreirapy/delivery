// Nomes de eventos e salas do socket.io — fonte única para backend e fronts.

export const SOCKET_EVENTS = {
  ORDER_STATUS: "order:status",
  KITCHEN_NEW: "kitchen:new",
  KITCHEN_UPDATE: "kitchen:update",
  DISPATCH_UPDATE: "dispatch:update",
  COURIER_ASSIGNED: "courier:assigned",
  COURIER_LOCATION: "courier:location",
  ORDER_DELIVERED: "order:delivered",
} as const;

export const rooms = {
  order: (orderId: string) => `order:${orderId}`,
  user: (userId: string) => `user:${userId}`,
  kitchen: () => "kitchen",
  dispatch: () => "dispatch",
  courier: (courierId: string) => `courier:${courierId}`,
};

import {
  canTransition,
  isActorAllowed,
  ORDER_STATUS_LABEL,
  SOCKET_EVENTS,
  rooms,
  type OrderStatus,
  type TransitionActor,
} from "@cabana/shared";
import { prisma } from "../lib/prisma.js";
import { conflict, forbidden, notFound } from "../lib/errors.js";
import { orderInclude, serializeOrder, serializeCourier } from "../lib/serialize.js";
import { emit } from "../realtime/io.js";
import { pushService } from "../integrations/push.js";
import type { OrderDTO } from "@cabana/shared";

// Gera código legível sequencial: CL-0001, CL-0002, ...
export async function generateOrderCode(): Promise<string> {
  const count = await prisma.order.count();
  return `CL-${String(count + 1).padStart(4, "0")}`;
}

interface TransitionParams {
  orderId: string;
  to: OrderStatus;
  actor: TransitionActor;
  note?: string | null;
  photoUrl?: string | null;
  changedById?: string | null; // Employee.id / Courier.id / "system"
}

// Executa uma transição de status validada + histórico + eventos realtime.
export async function transitionOrder(params: TransitionParams): Promise<OrderDTO> {
  const { orderId, to, actor, note, photoUrl, changedById } = params;

  const current = await prisma.order.findUnique({ where: { id: orderId } });
  if (!current) throw notFound("Pedido não encontrado");

  const from = current.status as OrderStatus;
  if (from === to) {
    // idempotência leve: sem mudança
    return loadOrderDTO(orderId);
  }
  if (!canTransition(from, to)) {
    throw conflict(`Transição inválida: ${from} → ${to}`);
  }
  if (!isActorAllowed(to, actor)) {
    throw forbidden(`Ator não autorizado para a transição → ${to}`);
  }

  await prisma.$transaction([
    prisma.order.update({ where: { id: orderId }, data: { status: to } }),
    prisma.orderStatusHistory.create({
      data: {
        orderId,
        status: to,
        note: note ?? null,
        photoUrl: photoUrl ?? null,
        changedByEmployee: changedById ?? null,
      },
    }),
  ]);

  const dto = await loadOrderDTO(orderId);
  await broadcast(dto, from);
  return dto;
}

export async function loadOrderDTO(orderId: string): Promise<OrderDTO> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: orderInclude,
  });
  if (!order) throw notFound("Pedido não encontrado");
  return serializeOrder(order);
}

// Dispara os eventos socket + push conforme o novo status.
async function broadcast(dto: OrderDTO, from: OrderStatus): Promise<void> {
  const statusEvent = {
    orderId: dto.id,
    code: dto.code,
    status: dto.status,
    courier: dto.courier,
    at: new Date().toISOString(),
  };

  // sempre: sala do pedido + sala do cliente
  emit(rooms.order(dto.id), SOCKET_EVENTS.ORDER_STATUS, statusEvent);
  emit(rooms.user(dto.customer.id), SOCKET_EVENTS.ORDER_STATUS, statusEvent);

  switch (dto.status) {
    case "CONFIRMED":
      // novo pedido entra na fila da cozinha
      emit(rooms.kitchen(), SOCKET_EVENTS.KITCHEN_NEW, statusEvent);
      // e avisa o painel de pedidos (admin/atendente na sala "support")
      emit(rooms.support(), SOCKET_EVENTS.ORDER_NEW, statusEvent);
      break;
    case "PREPARING":
      emit(rooms.kitchen(), SOCKET_EVENTS.KITCHEN_UPDATE, statusEvent);
      break;
    case "READY":
      emit(rooms.kitchen(), SOCKET_EVENTS.KITCHEN_UPDATE, statusEvent);
      emit(rooms.dispatch(), SOCKET_EVENTS.DISPATCH_UPDATE, statusEvent);
      break;
    case "DISPATCHED":
      emit(rooms.dispatch(), SOCKET_EVENTS.DISPATCH_UPDATE, statusEvent);
      if (dto.courier) {
        emit(rooms.courier(dto.courier.id), SOCKET_EVENTS.COURIER_ASSIGNED, statusEvent);
        await pushService.notify(
          { scope: "courier", id: dto.courier.id },
          { title: "Nova entrega", body: `Pedido ${dto.code} pronto para coleta.` }
        );
      }
      break;
    case "DELIVERED":
      // pede confirmação de recebimento ao cliente (com a foto)
      emit(rooms.order(dto.id), SOCKET_EVENTS.ORDER_DELIVERED, {
        ...statusEvent,
        deliveryPhotoUrl: dto.deliveryPhotoUrl ?? null,
      });
      await pushService.notify(
        { scope: "user", id: dto.customer.id },
        { title: "Pedido entregue", body: `Confirme o recebimento do pedido ${dto.code}.` }
      );
      break;
    default:
      break;
  }

  // push genérico de atualização de status ao cliente (exceto os já tratados)
  if (dto.status !== "DELIVERED") {
    await pushService.notify(
      { scope: "user", id: dto.customer.id },
      {
        title: `Pedido ${dto.code}`,
        body: ORDER_STATUS_LABEL[dto.status],
        data: { orderId: dto.id, status: dto.status },
      }
    );
  }
}

export { serializeCourier };

import { Router } from "express";
import {
  courierActionSchema,
  locationSchema,
  SOCKET_EVENTS,
  rooms,
} from "@cabana/shared";
import { prisma } from "../lib/prisma.js";
import { parse } from "../lib/validate.js";
import { asyncHandler, badRequest, forbidden, notFound } from "../lib/errors.js";
import { authenticate } from "../middlewares/auth.js";
import { serializeOrder, orderInclude } from "../lib/serialize.js";
import { transitionOrder } from "../services/order-service.js";
import { emit } from "../realtime/io.js";

export const courierRouter = Router();
courierRouter.use(authenticate("COURIER"));

// GET /courier/deliveries — atribuídas ao entregador logado
// (?history=1 inclui entregas concluídas)
courierRouter.get(
  "/deliveries",
  asyncHandler(async (req, res) => {
    const history = req.query.history === "1";
    const active = ["DISPATCHED", "PICKED_UP", "IN_ROUTE"];
    const done = ["DELIVERED", "CONFIRMED_BY_CUSTOMER"];
    const list = await prisma.order.findMany({
      where: { courierId: req.auth!.sub, status: { in: history ? done : active } },
      include: orderInclude,
      orderBy: { createdAt: history ? "desc" : "asc" },
    });
    res.json(list.map(serializeOrder));
  })
);

// PATCH /courier/deliveries/:id — pickup | start-route | deliver
courierRouter.patch(
  "/deliveries/:id",
  asyncHandler(async (req, res) => {
    const { action, photoUrl, paymentConfirmed } = parse(courierActionSchema, req.body);
    const courierId = req.auth!.sub;
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { payment: true },
    });
    if (!order) throw notFound("Entrega não encontrada");
    if (order.courierId !== courierId) throw forbidden("Entrega não atribuída a você");

    if (action === "pickup") {
      const dto = await transitionOrder({
        orderId: order.id,
        to: "PICKED_UP",
        actor: { kind: "COURIER", courierId },
        note: "Entregador confirmou recebimento",
        changedById: courierId,
      });
      return res.json(dto);
    }

    if (action === "start-route") {
      await prisma.delivery.update({
        where: { orderId: order.id },
        data: { startedAt: new Date() },
      });
      const dto = await transitionOrder({
        orderId: order.id,
        to: "IN_ROUTE",
        actor: { kind: "COURIER", courierId },
        note: "Entregador iniciou a rota",
        changedById: courierId,
      });
      return res.json(dto);
    }

    // deliver
    if (!photoUrl) throw badRequest("Foto da entrega é obrigatória");
    const needsCashConfirm =
      order.paymentMethod === "CASH" ||
      order.paymentMethod === "CREDIT_CARD" ||
      order.paymentMethod === "DEBIT_CARD";
    if (needsCashConfirm && !paymentConfirmed) {
      throw badRequest("Confirme o recebimento do pagamento antes de finalizar a entrega");
    }

    await prisma.delivery.update({
      where: { orderId: order.id },
      data: { deliveryPhotoUrl: photoUrl, deliveredAt: new Date() },
    });
    if (needsCashConfirm && order.payment) {
      await prisma.payment.update({
        where: { orderId: order.id },
        data: { confirmedByCourier: true, paidAt: new Date() },
      });
    }
    const dto = await transitionOrder({
      orderId: order.id,
      to: "DELIVERED",
      actor: { kind: "COURIER", courierId },
      note: "Entrega confirmada pelo entregador",
      photoUrl,
      changedById: courierId,
    });
    res.json(dto);
  })
);

// PATCH /courier/location — atualiza posição e transmite ao cliente (tracking)
courierRouter.patch(
  "/location",
  asyncHandler(async (req, res) => {
    const { lat, lng } = parse(locationSchema, req.body);
    const courierId = req.auth!.sub;
    await prisma.courier.update({
      where: { id: courierId },
      data: { currentLat: lat, currentLng: lng, lastLocationAt: new Date() },
    });

    // transmite para as salas dos pedidos em rota deste entregador
    const inRoute = await prisma.order.findMany({
      where: { courierId, status: "IN_ROUTE" },
      select: { id: true, userId: true },
    });
    const at = new Date().toISOString();
    for (const o of inRoute) {
      const payload = { orderId: o.id, courierId, lat, lng, at };
      emit(rooms.order(o.id), SOCKET_EVENTS.COURIER_LOCATION, payload);
      emit(rooms.user(o.userId), SOCKET_EVENTS.COURIER_LOCATION, payload);
    }
    res.json({ ok: true, tracking: inRoute.length });
  })
);

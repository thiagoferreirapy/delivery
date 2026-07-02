import { Router } from "express";
import { assignCourierSchema } from "@cabana/shared";
import { prisma } from "../lib/prisma.js";
import { parse } from "../lib/validate.js";
import { asyncHandler, badRequest, notFound } from "../lib/errors.js";
import { authenticate } from "../middlewares/auth.js";
import { rbac } from "../middlewares/rbac.js";
import { serializeOrder, serializeCourier, orderInclude } from "../lib/serialize.js";
import { transitionOrder } from "../services/order-service.js";

export const dispatchRouter = Router();
dispatchRouter.use(authenticate("EMPLOYEE"), rbac("DISPATCH"));

// GET /dispatch/orders — pedidos prontos aguardando encaminhamento
dispatchRouter.get(
  "/orders",
  asyncHandler(async (_req, res) => {
    const list = await prisma.order.findMany({
      where: { status: "READY" },
      include: orderInclude,
      orderBy: { createdAt: "asc" },
    });
    res.json(list.map(serializeOrder));
  })
);

// GET /dispatch/couriers — entregadores ativos para o dropdown
dispatchRouter.get(
  "/couriers",
  asyncHandler(async (_req, res) => {
    const list = await prisma.courier.findMany({ where: { active: true }, orderBy: { name: "asc" } });
    res.json(list.map(serializeCourier));
  })
);

// POST /dispatch/orders/:id/assign — escolhe entregador + foto -> DISPATCHED
dispatchRouter.post(
  "/orders/:id/assign",
  asyncHandler(async (req, res) => {
    const { courierId, photoUrl } = parse(assignCourierSchema, req.body);
    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order) throw notFound("Pedido não encontrado");
    if (order.status !== "READY") throw badRequest("Pedido não está pronto para encaminhamento");

    const courier = await prisma.courier.findUnique({ where: { id: courierId } });
    if (!courier || !courier.active) throw badRequest("Entregador inválido ou inativo");

    // vincula o entregador e cria/atualiza a entrega com a foto de expedição
    await prisma.order.update({ where: { id: order.id }, data: { courierId } });
    await prisma.delivery.upsert({
      where: { orderId: order.id },
      create: { orderId: order.id, courierId, pickupPhotoUrl: photoUrl ?? null },
      update: { courierId, pickupPhotoUrl: photoUrl ?? null },
    });

    const dto = await transitionOrder({
      orderId: order.id,
      to: "DISPATCHED",
      actor: { kind: "EMPLOYEE", role: req.auth!.role! },
      note: `Encaminhado a ${courier.name}`,
      photoUrl: photoUrl ?? null,
      changedById: req.auth!.sub,
    });
    res.json(dto);
  })
);

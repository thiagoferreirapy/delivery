import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { parse } from "../lib/validate.js";
import { asyncHandler, notFound } from "../lib/errors.js";
import { authenticate } from "../middlewares/auth.js";
import { rbac } from "../middlewares/rbac.js";
import { serializeOrder, orderInclude } from "../lib/serialize.js";
import { transitionOrder } from "../services/order-service.js";

export const kitchenRouter = Router();
kitchenRouter.use(authenticate("EMPLOYEE"), rbac("KITCHEN"));

// GET /kitchen/orders — colunas do kanban: CONFIRMED, PREPARING, READY
kitchenRouter.get(
  "/orders",
  asyncHandler(async (_req, res) => {
    const list = await prisma.order.findMany({
      where: { status: { in: ["CONFIRMED", "PREPARING", "READY"] } },
      include: orderInclude,
      orderBy: { createdAt: "asc" },
    });
    res.json(list.map(serializeOrder));
  })
);

// PATCH /kitchen/orders/:id — start (->PREPARING) | finish (->READY)
const actionSchema = z.object({ action: z.enum(["start", "finish"]) });
kitchenRouter.patch(
  "/orders/:id",
  asyncHandler(async (req, res) => {
    const { action } = parse(actionSchema, req.body);
    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order) throw notFound("Pedido não encontrado");
    const to = action === "start" ? "PREPARING" : "READY";
    const dto = await transitionOrder({
      orderId: order.id,
      to,
      actor: { kind: "EMPLOYEE", role: req.auth!.role! },
      note: action === "start" ? "Cozinha iniciou o preparo" : "Preparo finalizado",
      changedById: req.auth!.sub,
    });
    res.json(dto);
  })
);

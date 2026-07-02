import { Router } from "express";
import {
  createOrderSchema,
  updateStatusSchema,
  ratingSchema,
  type OrderStatus,
  type TransitionActor,
} from "@cabana/shared";
import { prisma } from "../lib/prisma.js";
import { parse } from "../lib/validate.js";
import { asyncHandler, badRequest, forbidden, notFound, conflict } from "../lib/errors.js";
import { authenticate } from "../middlewares/auth.js";
import { env } from "../config/env.js";
import { finalPrice, dec, serializeOrder, orderInclude } from "../lib/serialize.js";
import {
  generateOrderCode,
  loadOrderDTO,
  transitionOrder,
} from "../services/order-service.js";

export const ordersRouter = Router();
ordersRouter.use(authenticate()); // qualquer sujeito autenticado; escopo checado por rota

// Deriva o "ator" da máquina de estados a partir do token
function actorFromReq(req: any): TransitionActor {
  const a = req.auth;
  if (a.scope === "CUSTOMER") return { kind: "CUSTOMER", userId: a.sub };
  if (a.scope === "COURIER") return { kind: "COURIER", courierId: a.sub };
  return { kind: "EMPLOYEE", role: a.role };
}

// POST /orders — cliente cria o seu; ADMIN/ATTENDANT cria em nome de um cliente
ordersRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = parse(createOrderSchema, req.body);
    const auth = req.auth!;

    let userId: string;
    if (auth.scope === "CUSTOMER") {
      userId = auth.sub;
    } else if (auth.scope === "EMPLOYEE" && (auth.role === "ADMIN" || auth.role === "ATTENDANT")) {
      if (!data.userId) throw badRequest("userId é obrigatório no cadastro manual");
      userId = data.userId;
    } else {
      throw forbidden("Sem permissão para criar pedidos");
    }

    const address = await prisma.address.findFirst({ where: { id: data.addressId, userId } });
    if (!address) throw badRequest("Endereço inválido para este cliente");

    // preços vêm do servidor (nunca do client) — com promoção aplicada
    const productIds = data.items.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, active: true },
      include: { extras: true, removables: true },
    });
    const byId = new Map(products.map((p) => [p.id, p]));

    let subtotal = 0;
    const itemsData = data.items.map((item) => {
      const p = byId.get(item.productId);
      if (!p) throw badRequest(`Produto indisponível: ${item.productId}`);
      const base = finalPrice(dec(p.price), p.promoActive, p.promoPercent ?? null);

      // Extras (validados contra o produto; preço vem do servidor)
      const extraById = new Map(p.extras.map((e) => [e.id, e]));
      const selectedExtras = (item.extras ?? []).map((sel) => {
        const ex = extraById.get(sel.id);
        if (!ex) throw badRequest(`Adicional inválido em ${p.name}`);
        return { name: ex.name, price: dec(ex.price), quantity: sel.quantity };
      });
      const totalExtraQty = selectedExtras.reduce((n, e) => n + e.quantity, 0);
      if (p.maxExtras != null && totalExtraQty > p.maxExtras) {
        throw badRequest(`Máximo de ${p.maxExtras} adicionais em ${p.name}`);
      }
      const extrasSum = selectedExtras.reduce((s, e) => s + e.price * e.quantity, 0);

      // Ingredientes removidos (validados)
      const removableById = new Map(p.removables.map((r) => [r.id, r]));
      const removedNames = (item.removedIds ?? []).map((id) => {
        const r = removableById.get(id);
        if (!r) throw badRequest(`Ingrediente inválido em ${p.name}`);
        return r.name;
      });
      if (p.maxRemovable != null && removedNames.length > p.maxRemovable) {
        throw badRequest(`Máximo de ${p.maxRemovable} remoções em ${p.name}`);
      }

      const unit = Math.round((base + extrasSum) * 100) / 100;
      subtotal += unit * item.quantity;
      return {
        productId: p.id,
        quantity: item.quantity,
        unitPrice: unit,
        notes: item.notes ?? null,
        extrasJson: selectedExtras.length ? JSON.stringify(selectedExtras) : null,
        removedJson: removedNames.length ? JSON.stringify(removedNames) : null,
      };
    });
    subtotal = Math.round(subtotal * 100) / 100;
    const deliveryFee = env.deliveryFee;
    const total = Math.round((subtotal + deliveryFee) * 100) / 100;

    const code = await generateOrderCode();
    const isPix = data.paymentMethod === "PIX";

    const order = await prisma.order.create({
      data: {
        code,
        userId,
        addressId: address.id,
        status: "PENDING",
        paymentMethod: data.paymentMethod,
        subtotal,
        deliveryFee,
        total,
        notes: data.notes ?? null,
        items: { create: itemsData },
        payment: {
          create: {
            method: data.paymentMethod,
            amount: total,
            status: isPix ? "PENDING" : "CONFIRMED_ON_DELIVERY",
          },
        },
        history: { create: { status: "PENDING", changedByEmployee: "system" } },
      },
      include: orderInclude,
    });

    // Cartão/dinheiro: pagamento na entrega -> já entra em CONFIRMED
    if (!isPix) {
      const dto = await transitionOrder({
        orderId: order.id,
        to: "CONFIRMED",
        actor: { kind: "CUSTOMER", userId },
        note: "Pagamento na entrega",
        changedById: "system",
      });
      return res.status(201).json(dto);
    }

    res.status(201).json(serializeOrder(order));
  })
);

// GET /orders — cliente vê os seus; funcionário vê tudo (com filtros); entregador vê os atribuídos
ordersRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const auth = req.auth!;
    const { status, courierId, code, from, to } = req.query as Record<string, string | undefined>;
    const where: any = {};

    if (auth.scope === "CUSTOMER") where.userId = auth.sub;
    else if (auth.scope === "COURIER") where.courierId = auth.sub;
    // EMPLOYEE: sem restrição de dono

    if (status) where.status = { in: status.split(",") };
    if (courierId && auth.scope === "EMPLOYEE") where.courierId = courierId;
    if (code) where.code = { contains: code };
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }

    const list = await prisma.order.findMany({
      where,
      include: orderInclude,
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    res.json(list.map(serializeOrder));
  })
);

// GET /orders/:id
ordersRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const order = await prisma.order.findUnique({ where: { id: req.params.id }, include: orderInclude });
    if (!order) throw notFound("Pedido não encontrado");
    const auth = req.auth!;
    if (auth.scope === "CUSTOMER" && order.userId !== auth.sub) throw forbidden();
    if (auth.scope === "COURIER" && order.courierId !== auth.sub) throw forbidden();
    res.json(serializeOrder(order));
  })
);

// PATCH /orders/:id/status — transição genérica (ex.: ADMIN cancela)
ordersRouter.patch(
  "/:id/status",
  asyncHandler(async (req, res) => {
    const { status, note, photoUrl } = parse(updateStatusSchema, req.body);
    const dto = await transitionOrder({
      orderId: req.params.id,
      to: status as OrderStatus,
      actor: actorFromReq(req),
      note,
      photoUrl,
      changedById: req.auth!.sub,
    });
    res.json(dto);
  })
);

// POST /orders/:id/confirm-receipt — cliente confirma recebimento
ordersRouter.post(
  "/:id/confirm-receipt",
  authenticate("CUSTOMER"),
  asyncHandler(async (req, res) => {
    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order) throw notFound("Pedido não encontrado");
    if (order.userId !== req.auth!.sub) throw forbidden();
    const dto = await transitionOrder({
      orderId: order.id,
      to: "CONFIRMED_BY_CUSTOMER",
      actor: { kind: "CUSTOMER", userId: req.auth!.sub },
      note: "Recebimento confirmado pelo cliente",
      changedById: req.auth!.sub,
    });
    res.json(dto);
  })
);

// POST /orders/:id/rating — avaliação (após confirmar recebimento)
ordersRouter.post(
  "/:id/rating",
  authenticate("CUSTOMER"),
  asyncHandler(async (req, res) => {
    const { stars, comment } = parse(ratingSchema, req.body);
    const order = await prisma.order.findUnique({ where: { id: req.params.id }, include: { rating: true } });
    if (!order) throw notFound("Pedido não encontrado");
    if (order.userId !== req.auth!.sub) throw forbidden();
    if (order.status !== "CONFIRMED_BY_CUSTOMER" && order.status !== "DELIVERED") {
      throw conflict("Só é possível avaliar após a entrega");
    }
    if (order.rating) throw conflict("Pedido já avaliado");
    await prisma.rating.create({
      data: { orderId: order.id, userId: req.auth!.sub, stars, comment: comment ?? null },
    });
    res.status(201).json(await loadOrderDTO(order.id));
  })
);

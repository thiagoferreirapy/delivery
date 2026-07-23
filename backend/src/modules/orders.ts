import { Router } from "express";
import {
  createOrderSchema,
  quoteSchema,
  updateStatusSchema,
  ratingSchema,
  type OrderStatus,
  type QuoteDTO,
  type TransitionActor,
} from "@cabana/shared";
import { prisma } from "../lib/prisma.js";
import { parse } from "../lib/validate.js";
import { asyncHandler, badRequest, forbidden, notFound, conflict } from "../lib/errors.js";
import { authenticate } from "../middlewares/auth.js";
import { serializeOrder, orderInclude } from "../lib/serialize.js";
import { priceOrder } from "../services/pricing.js";
import { getStoreState } from "../services/store-hours.js";
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

    // Loja fechada barra o cliente, mas não o balcão: atendente/admin lançam
    // pedido por telefone fora do horário, e isso é intencional.
    if (auth.scope === "CUSTOMER") {
      const state = await getStoreState();
      if (!state.open) throw conflict(state.closedReason ?? "Estamos fechados no momento");
    }

    const address = await prisma.address.findFirst({ where: { id: data.addressId, userId } });
    if (!address) throw badRequest("Endereço inválido para este cliente");

    // Cálculo autoritativo (promoção + PIX + cupom) no servidor
    const pricing = await priceOrder({
      items: data.items,
      paymentMethod: data.paymentMethod,
      couponCode: data.couponCode ?? null,
    });
    // Se o cliente informou um cupom mas ele é inválido, não deixa passar em silêncio
    if (data.couponCode && pricing.couponError) throw badRequest(pricing.couponError);

    const code = await generateOrderCode();
    const isPix = data.paymentMethod === "PIX";

    // Cria o pedido e, se houver cupom, incrementa o uso — atomicamente
    const [order] = await prisma.$transaction([
      prisma.order.create({
        data: {
          code,
          userId,
          addressId: address.id,
          status: "PENDING",
          paymentMethod: data.paymentMethod,
          subtotal: pricing.subtotal,
          deliveryFee: pricing.deliveryFee,
          discount: pricing.discount,
          total: pricing.total,
          couponId: pricing.coupon?.id ?? null,
          couponCode: pricing.coupon?.code ?? null,
          notes: data.notes ?? null,
          items: {
            create: pricing.items.map((it) => ({
              productId: it.productId,
              quantity: it.quantity,
              unitPrice: it.unitPrice,
              notes: it.notes,
              extrasJson: it.extrasJson,
              removedJson: it.removedJson,
              selectionsJson: it.selectionsJson,
            })),
          },
          payment: {
            create: {
              method: data.paymentMethod,
              amount: pricing.total,
              status: isPix ? "PENDING" : "CONFIRMED_ON_DELIVERY",
            },
          },
          history: { create: { status: "PENDING", changedByEmployee: "system" } },
        },
        include: orderInclude,
      }),
      ...(pricing.coupon
        ? [prisma.coupon.update({ where: { id: pricing.coupon.id }, data: { usedCount: { increment: 1 } } })]
        : []),
    ]);

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

// POST /orders/quote — prévia de preços (subtotal, PIX, cupom, total) sem gravar
ordersRouter.post(
  "/quote",
  asyncHandler(async (req, res) => {
    const data = parse(quoteSchema, req.body);
    const pricing = await priceOrder({
      items: data.items,
      paymentMethod: data.paymentMethod,
      couponCode: data.couponCode ?? null,
    });
    const quote: QuoteDTO = {
      paymentMethod: data.paymentMethod,
      subtotal: pricing.subtotal,
      pixSavings: pricing.pixSavings,
      discount: pricing.discount,
      deliveryFee: pricing.deliveryFee,
      total: pricing.total,
      coupon: pricing.coupon
        ? { code: pricing.coupon.code, description: pricing.coupon.description }
        : null,
      couponError: pricing.couponError,
    };
    res.json(quote);
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

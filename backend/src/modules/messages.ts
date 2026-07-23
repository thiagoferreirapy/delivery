import { Router } from "express";
import { sendMessageSchema, SOCKET_EVENTS, rooms, type MessageChannel } from "@cabana/shared";
import { prisma } from "../lib/prisma.js";
import { parse } from "../lib/validate.js";
import { asyncHandler, forbidden, notFound, conflict } from "../lib/errors.js";
import { authenticate } from "../middlewares/auth.js";
import { serializeMessage } from "../lib/serialize.js";
import { emitTo } from "../realtime/io.js";

export const messagesRouter = Router();
messagesRouter.use(authenticate()); // qualquer autenticado; acesso ao pedido/canal checado abaixo

// Papéis da loja autorizados a conversar com o cliente (canal STORE)
const STORE_ROLES = ["ADMIN", "ATTENDANT", "DISPATCH"];
// Canal STORE fica só-leitura nos status finais
const STORE_TERMINAL = new Set(["CONFIRMED_BY_CUSTOMER", "CANCELLED"]);
// Canal COURIER (entregador<->cliente) só é ativo com o pedido em rota
const COURIER_OPEN = new Set(["IN_ROUTE"]);

function parseChannel(req: any): MessageChannel {
  return req.query.channel === "COURIER" ? "COURIER" : "STORE";
}

function isChatOpen(order: any, channel: MessageChannel): boolean {
  return channel === "COURIER" ? COURIER_OPEN.has(order.status) : !STORE_TERMINAL.has(order.status);
}

// Carrega o pedido e valida se o ator pode acessar aquele canal.
async function loadOrderForActor(req: any, channel: MessageChannel) {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: { user: true, courier: true },
  });
  if (!order) throw notFound("Pedido não encontrado");
  const auth = req.auth;

  if (auth.scope === "CUSTOMER") {
    if (order.userId !== auth.sub) throw forbidden();
    if (channel === "COURIER" && !order.courierId) throw forbidden("Pedido ainda sem entregador");
  } else if (auth.scope === "EMPLOYEE") {
    if (channel !== "STORE") throw forbidden("Funcionário só usa o canal da loja");
    if (!STORE_ROLES.includes(auth.role)) throw forbidden("Sem permissão para conversar com o cliente");
  } else if (auth.scope === "COURIER") {
    if (channel !== "COURIER") throw forbidden("Entregador só usa o canal do entregador");
    if (order.courierId !== auth.sub) throw forbidden("Este pedido não é seu");
  } else {
    throw forbidden();
  }
  return order;
}

// GET /orders/:id/messages?channel=STORE|COURIER
messagesRouter.get(
  "/:id/messages",
  asyncHandler(async (req, res) => {
    const channel = parseChannel(req);
    const order = await loadOrderForActor(req, channel);
    const list = await prisma.orderMessage.findMany({
      where: { orderId: order.id, channel },
      orderBy: { createdAt: "asc" },
    });
    res.json({ messages: list.map(serializeMessage), chatOpen: isChatOpen(order, channel) });
  })
);

// POST /orders/:id/messages?channel=...
messagesRouter.post(
  "/:id/messages",
  asyncHandler(async (req, res) => {
    const channel = parseChannel(req);
    const order = await loadOrderForActor(req, channel);
    if (!isChatOpen(order, channel)) throw conflict("Conversa encerrada para este pedido");
    const { body } = parse(sendMessageSchema, req.body);
    const auth = req.auth!;

    let senderType: "EMPLOYEE" | "CUSTOMER" | "COURIER";
    let senderName: string;
    if (auth.scope === "CUSTOMER") {
      senderType = "CUSTOMER";
      senderName = order.user?.name ?? "Cliente";
    } else if (auth.scope === "COURIER") {
      senderType = "COURIER";
      senderName = order.courier?.name ?? auth.name ?? "Entregador";
    } else {
      senderType = "EMPLOYEE";
      senderName = auth.name ?? "Atendente";
    }

    const created = await prisma.orderMessage.create({
      data: { orderId: order.id, channel, senderType, senderId: auth.sub, senderName, body },
    });
    const dto = serializeMessage(created);

    // Salas: sempre pedido + cliente; STORE -> painel (support); COURIER -> entregador.
    const targets = [rooms.order(order.id), rooms.user(order.userId)];
    if (channel === "STORE") targets.push(rooms.support());
    else if (order.courierId) targets.push(rooms.courier(order.courierId));
    emitTo(targets, SOCKET_EVENTS.MESSAGE_NEW, { orderId: order.id, code: order.code, message: dto });

    res.status(201).json(dto);
  })
);

// POST /orders/:id/messages/read?channel=...
messagesRouter.post(
  "/:id/messages/read",
  asyncHandler(async (req, res) => {
    const channel = parseChannel(req);
    const order = await loadOrderForActor(req, channel);
    const auth = req.auth!;
    const myType = auth.scope === "CUSTOMER" ? "CUSTOMER" : auth.scope === "COURIER" ? "COURIER" : "EMPLOYEE";
    // marca lidas as mensagens do outro lado neste canal
    await prisma.orderMessage.updateMany({
      where: { orderId: order.id, channel, senderType: { not: myType }, readAt: null },
      data: { readAt: new Date() },
    });
    const readerRooms = [rooms.order(order.id)];
    if (channel === "STORE") readerRooms.push(rooms.support());
    else if (order.courierId) readerRooms.push(rooms.courier(order.courierId));
    emitTo(readerRooms, SOCKET_EVENTS.MESSAGE_READ, { orderId: order.id, readerType: myType });
    res.json({ ok: true });
  })
);

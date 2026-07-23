import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { rooms, SOCKET_EVENTS } from "@cabana/shared";
import type { AccessTokenPayload } from "../lib/jwt.js";
import { env } from "../config/env.js";
import { isLanOrNgrok } from "../lib/cors.js";

let io: Server | null = null;

export function initSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      credentials: true,
      // Mesma política do Express: lista fixa, IP de rede local (LAN), ngrok, e
      // requests sem origin (curl/app nativo).
      origin(origin, cb) {
        const ok = !origin || env.corsOrigins.includes(origin) || isLanOrNgrok(origin);
        cb(ok ? null : new Error(`Origin não permitida: ${origin}`), ok);
      },
    },
  });

  // auth opcional: se vier token, entra na sala do usuário/entregador automaticamente
  io.use((socket, next) => {
    const token =
      (socket.handshake.auth?.token as string | undefined) ??
      (socket.handshake.query?.token as string | undefined);
    if (token) {
      try {
        const p = jwt.verify(token, env.jwt.accessSecret) as AccessTokenPayload;
        (socket.data as any).user = p;
      } catch {
        // token inválido: segue como convidado (só pode assinar salas de pedido públicas)
      }
    }
    next();
  });

  io.on("connection", (socket) => {
    const user = (socket.data as any).user as AccessTokenPayload | undefined;
    if (user) {
      if (user.scope === "CUSTOMER") socket.join(rooms.user(user.sub));
      if (user.scope === "COURIER") socket.join(rooms.courier(user.sub));
      if (user.scope === "EMPLOYEE") {
        // cozinha e expedição recebem feed conforme papel; ADMIN entra em ambas
        if (user.role === "KITCHEN" || user.role === "ADMIN") socket.join(rooms.kitchen());
        if (user.role === "DISPATCH" || user.role === "ADMIN") socket.join(rooms.dispatch());
        // atendimento ao cliente (chat do pedido): ADMIN, ATTENDANT, DISPATCH
        if (user.role === "ADMIN" || user.role === "ATTENDANT" || user.role === "DISPATCH") {
          socket.join(rooms.support());
        }
      }
    }

    // cliente acompanha um pedido específico (tela de tracking)
    socket.on("order:subscribe", (orderId: string) => {
      if (typeof orderId === "string") socket.join(rooms.order(orderId));
    });
    socket.on("order:unsubscribe", (orderId: string) => {
      if (typeof orderId === "string") socket.leave(rooms.order(orderId));
    });
  });

  return io;
}

export function getIO(): Server {
  if (!io) throw new Error("Socket.io não inicializado");
  return io;
}

// Emit seguro (não quebra se socket ainda não subiu — ex.: seed)
export function emit(room: string, event: string, payload: unknown): void {
  if (!io) return;
  io.to(room).emit(event, payload);
}

// Emit para várias salas em uma única chamada — o socket.io deduplica os
// destinatários que estão em mais de uma sala (evita mensagem dobrada).
export function emitTo(roomList: string[], event: string, payload: unknown): void {
  if (!io || roomList.length === 0) return;
  let chain: any = io;
  for (const r of roomList) chain = chain.to(r);
  chain.emit(event, payload);
}

export { SOCKET_EVENTS, rooms };

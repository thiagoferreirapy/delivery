import type { NextFunction, Request, Response } from "express";
import { AppError } from "../lib/errors.js";

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: "Rota não encontrada" });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof AppError) {
    return res.status(err.status).json({
      error: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
  }
  // Prisma / desconhecidos
  const anyErr = err as any;
  if (anyErr?.code === "P2002") {
    return res.status(409).json({ error: "Registro duplicado (campo único)" });
  }
  if (anyErr?.code === "P2025") {
    return res.status(404).json({ error: "Registro não encontrado" });
  }
  console.error("[erro não tratado]", err);
  res.status(500).json({ error: "Erro interno do servidor" });
}

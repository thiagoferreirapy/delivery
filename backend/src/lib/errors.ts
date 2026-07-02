import type { NextFunction, Request, Response } from "express";

export class AppError extends Error {
  status: number;
  details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export const badRequest = (m: string, d?: unknown) => new AppError(400, m, d);
export const unauthorized = (m = "Não autenticado") => new AppError(401, m);
export const forbidden = (m = "Acesso negado") => new AppError(403, m);
export const notFound = (m = "Não encontrado") => new AppError(404, m);
export const conflict = (m: string) => new AppError(409, m);

// wrapper p/ handlers async — encaminha erros ao middleware de erro
export function asyncHandler<
  T extends (req: Request, res: Response, next: NextFunction) => Promise<unknown>
>(fn: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

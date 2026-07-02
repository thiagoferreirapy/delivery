import type { NextFunction, Request, Response } from "express";
import type { AuthScope } from "@cabana/shared";
import { verifyAccessToken } from "../lib/jwt.js";
import { unauthorized, forbidden } from "../lib/errors.js";

function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) return header.slice(7);
  const cookieToken = (req as any).cookies?.accessToken;
  return typeof cookieToken === "string" ? cookieToken : null;
}

// Exige autenticação; opcionalmente restringe a certos escopos.
export function authenticate(...scopes: AuthScope[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const token = extractToken(req);
    if (!token) return next(unauthorized());
    try {
      const payload = verifyAccessToken(token);
      if (scopes.length && !scopes.includes(payload.scope)) {
        return next(forbidden("Escopo inválido para esta rota"));
      }
      req.auth = payload;
      next();
    } catch {
      next(unauthorized("Token inválido ou expirado"));
    }
  };
}

// Autenticação opcional (não bloqueia se ausente)
export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (token) {
    try {
      req.auth = verifyAccessToken(token);
    } catch {
      /* ignora token inválido */
    }
  }
  next();
}

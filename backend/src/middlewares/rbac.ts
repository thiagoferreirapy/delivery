import type { NextFunction, Request, Response } from "express";
import type { EmployeeRole } from "@cabana/shared";
import { forbidden, unauthorized } from "../lib/errors.js";

// Exige que o sujeito seja EMPLOYEE com um dos papéis informados.
// ADMIN é sempre permitido (superusuário do restaurante).
export function rbac(...roles: EmployeeRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const auth = req.auth;
    if (!auth) return next(unauthorized());
    if (auth.scope !== "EMPLOYEE" || !auth.role) {
      return next(forbidden("Rota restrita a funcionários"));
    }
    if (auth.role === "ADMIN") return next();
    if (!roles.includes(auth.role)) {
      return next(forbidden(`Requer papel: ${roles.join(", ")}`));
    }
    next();
  };
}

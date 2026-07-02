import jwt from "jsonwebtoken";
import type { AuthScope, EmployeeRole } from "@cabana/shared";
import { env } from "../config/env.js";

export interface AccessTokenPayload {
  sub: string; // id do sujeito
  scope: AuthScope; // CUSTOMER | EMPLOYEE | COURIER
  role?: EmployeeRole; // apenas EMPLOYEE
  name: string;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.jwt.accessSecret, {
    expiresIn: env.jwt.accessTtl,
  });
}

export function signRefreshToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshTtl,
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.jwt.accessSecret) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.jwt.refreshSecret) as AccessTokenPayload;
}

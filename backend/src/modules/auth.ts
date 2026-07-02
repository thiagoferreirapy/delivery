import { Router, type Response } from "express";
import {
  loginSchema,
  registerSchema,
  type AuthResponse,
  type AuthUser,
  type EmployeeRole,
} from "@cabana/shared";
import { prisma } from "../lib/prisma.js";
import { parse } from "../lib/validate.js";
import { asyncHandler, badRequest, unauthorized } from "../lib/errors.js";
import { hashPassword, verifyPassword } from "../lib/password.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  type AccessTokenPayload,
} from "../lib/jwt.js";
import { env } from "../config/env.js";

export const authRouter = Router();

function setAuthCookies(res: Response, payload: AccessTokenPayload) {
  const access = signAccessToken(payload);
  const refresh = signRefreshToken(payload);
  const base = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: env.isProd,
    path: "/",
  };
  res.cookie("accessToken", access, { ...base, maxAge: env.jwt.accessTtl * 1000 });
  res.cookie("refreshToken", refresh, {
    ...base,
    maxAge: env.jwt.refreshTtl * 1000,
    path: "/auth",
  });
  return access;
}

function toAuthUser(p: AccessTokenPayload, extra?: Partial<AuthUser>): AuthUser {
  return { id: p.sub, name: p.name, scope: p.scope, role: p.role, ...extra };
}

// POST /auth/register — apenas cliente
authRouter.post(
  "/register",
  asyncHandler(async (req, res) => {
    const data = parse(registerSchema, req.body);
    const exists = await prisma.user.findUnique({ where: { email: data.email } });
    if (exists) throw badRequest("E-mail já cadastrado");
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone ?? null,
        password: await hashPassword(data.password),
      },
    });
    const payload: AccessTokenPayload = { sub: user.id, scope: "CUSTOMER", name: user.name };
    const accessToken = setAuthCookies(res, payload);
    const body: AuthResponse = {
      accessToken,
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone, scope: "CUSTOMER" },
    };
    res.status(201).json(body);
  })
);

// POST /auth/login — CUSTOMER | EMPLOYEE | COURIER (por escopo)
authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password, scope } = parse(loginSchema, req.body);
    let payload: AccessTokenPayload;
    let user: AuthUser;

    if (scope === "CUSTOMER") {
      const u = await prisma.user.findUnique({ where: { email } });
      if (!u || !(await verifyPassword(password, u.password))) throw unauthorized("Credenciais inválidas");
      payload = { sub: u.id, scope: "CUSTOMER", name: u.name };
      user = { id: u.id, name: u.name, email: u.email, phone: u.phone, scope: "CUSTOMER" };
    } else if (scope === "EMPLOYEE") {
      const e = await prisma.employee.findUnique({ where: { email } });
      if (!e || !(await verifyPassword(password, e.password))) throw unauthorized("Credenciais inválidas");
      if (!e.active) throw unauthorized("Acesso desativado. Contate o administrador.");
      payload = { sub: e.id, scope: "EMPLOYEE", role: e.role as EmployeeRole, name: e.name };
      user = { id: e.id, name: e.name, email: e.email, scope: "EMPLOYEE", role: e.role as EmployeeRole };
    } else {
      // COURIER — login por telefone no campo "email"
      const c = await prisma.courier.findUnique({ where: { phone: email } });
      if (!c || !(await verifyPassword(password, c.password))) throw unauthorized("Credenciais inválidas");
      if (!c.active) throw unauthorized("Cadastro de entregador desativado.");
      payload = { sub: c.id, scope: "COURIER", name: c.name };
      user = { id: c.id, name: c.name, phone: c.phone, scope: "COURIER" };
    }

    const accessToken = setAuthCookies(res, payload);
    const body: AuthResponse = { accessToken, user };
    res.json(body);
  })
);

// POST /auth/refresh
authRouter.post(
  "/refresh",
  asyncHandler(async (req, res) => {
    const token = (req as any).cookies?.refreshToken ?? req.body?.refreshToken;
    if (!token) throw unauthorized("Refresh token ausente");
    let payload: AccessTokenPayload;
    try {
      payload = verifyRefreshToken(token);
    } catch {
      throw unauthorized("Refresh token inválido");
    }
    const clean: AccessTokenPayload = {
      sub: payload.sub,
      scope: payload.scope,
      role: payload.role,
      name: payload.name,
    };
    const accessToken = setAuthCookies(res, clean);
    res.json({ accessToken, user: toAuthUser(clean) });
  })
);

// POST /auth/logout
authRouter.post("/logout", (_req, res) => {
  res.clearCookie("accessToken", { path: "/" });
  res.clearCookie("refreshToken", { path: "/auth" });
  res.json({ ok: true });
});

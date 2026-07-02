import { Router } from "express";
import { employeeSchema, courierSchema } from "@cabana/shared";
import { prisma } from "../lib/prisma.js";
import { parse } from "../lib/validate.js";
import { asyncHandler, badRequest, notFound } from "../lib/errors.js";
import { authenticate } from "../middlewares/auth.js";
import { rbac } from "../middlewares/rbac.js";
import { hashPassword } from "../lib/password.js";
import { serializeCourier, dec } from "../lib/serialize.js";

const serializeEmployee = (e: any) => ({
  id: e.id,
  name: e.name,
  email: e.email,
  role: e.role,
  active: e.active,
  createdAt: new Date(e.createdAt).toISOString(),
});

// ===================== Funcionários (ADMIN) =====================
export const employeesRouter = Router();
employeesRouter.use(authenticate("EMPLOYEE"), rbac()); // rbac() = somente ADMIN

employeesRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const list = await prisma.employee.findMany({ orderBy: { createdAt: "desc" } });
    res.json(list.map(serializeEmployee));
  })
);

employeesRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = parse(employeeSchema, req.body);
    if (!data.password) throw badRequest("Senha é obrigatória");
    const e = await prisma.employee.create({
      data: {
        name: data.name,
        email: data.email,
        role: data.role,
        active: data.active ?? true,
        password: await hashPassword(data.password),
      },
    });
    res.status(201).json(serializeEmployee(e));
  })
);

employeesRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const data = parse(employeeSchema.partial(), req.body);
    const patch: any = {};
    if (data.name !== undefined) patch.name = data.name;
    if (data.email !== undefined) patch.email = data.email;
    if (data.role !== undefined) patch.role = data.role;
    if (data.active !== undefined) patch.active = data.active; // conceder/remover acesso
    if (data.password) patch.password = await hashPassword(data.password);
    const e = await prisma.employee.update({ where: { id: req.params.id }, data: patch });
    res.json(serializeEmployee(e));
  })
);

// ===================== Entregadores =====================
// Leitura: ADMIN ou DISPATCH. Escrita: somente ADMIN.
export const couriersRouter = Router();
couriersRouter.use(authenticate("EMPLOYEE"));

couriersRouter.get(
  "/",
  rbac("DISPATCH"),
  asyncHandler(async (_req, res) => {
    const list = await prisma.courier.findMany({ orderBy: { createdAt: "desc" } });
    res.json(list.map(serializeCourier));
  })
);

couriersRouter.post(
  "/",
  rbac(),
  asyncHandler(async (req, res) => {
    const data = parse(courierSchema, req.body);
    if (!data.password) throw badRequest("Senha é obrigatória");
    const c = await prisma.courier.create({
      data: {
        name: data.name,
        phone: data.phone,
        active: data.active ?? true,
        password: await hashPassword(data.password),
      },
    });
    res.status(201).json(serializeCourier(c));
  })
);

couriersRouter.patch(
  "/:id",
  rbac(),
  asyncHandler(async (req, res) => {
    const data = parse(courierSchema.partial(), req.body);
    const patch: any = {};
    if (data.name !== undefined) patch.name = data.name;
    if (data.phone !== undefined) patch.phone = data.phone;
    if (data.active !== undefined) patch.active = data.active;
    if (data.password) patch.password = await hashPassword(data.password);
    const c = await prisma.courier.update({ where: { id: req.params.id }, data: patch });
    res.json(serializeCourier(c));
  })
);

// ===================== Dashboard (ADMIN) =====================
export const adminRouter = Router();
adminRouter.use(authenticate("EMPLOYEE"), rbac());

adminRouter.get(
  "/stats",
  asyncHandler(async (_req, res) => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [todayOrders, allByStatus, ratings] = await Promise.all([
      prisma.order.findMany({
        where: { createdAt: { gte: startOfDay }, status: { not: "CANCELLED" } },
        select: { total: true },
      }),
      prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.rating.aggregate({ _avg: { stars: true }, _count: { _all: true } }),
    ]);

    const revenue = todayOrders.reduce((s, o) => s + dec(o.total), 0);
    const count = todayOrders.length;
    const byStatus: Record<string, number> = {};
    for (const row of allByStatus) byStatus[row.status] = row._count._all;

    res.json({
      ordersToday: count,
      revenueToday: Math.round(revenue * 100) / 100,
      avgTicket: count ? Math.round((revenue / count) * 100) / 100 : 0,
      byStatus,
      avgRating: ratings._avg.stars ? Math.round(ratings._avg.stars * 10) / 10 : null,
      ratingCount: ratings._count._all,
    });
  })
);

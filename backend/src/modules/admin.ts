import { Router } from "express";
import { employeeSchema, courierSchema, courierUpdateSchema } from "@cabana/shared";
import { prisma } from "../lib/prisma.js";
import { parse } from "../lib/validate.js";
import { asyncHandler, badRequest, notFound } from "../lib/errors.js";
import { authenticate } from "../middlewares/auth.js";
import { rbac } from "../middlewares/rbac.js";
import { hashPassword } from "../lib/password.js";
import { serializeCourierFull, dec } from "../lib/serialize.js";

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
    res.json(list.map(serializeCourierFull));
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
        photoUrl: data.photoUrl,
        birthDate: new Date(data.birthDate),
        cpf: data.cpf,
        cpfFrontUrl: data.cpfFrontUrl,
        cpfBackUrl: data.cpfBackUrl,
        cnh: data.cnh,
        cnhFrontUrl: data.cnhFrontUrl,
        cnhBackUrl: data.cnhBackUrl,
      },
    });
    res.status(201).json(serializeCourierFull(c));
  })
);

couriersRouter.patch(
  "/:id",
  rbac(),
  asyncHandler(async (req, res) => {
    const data = parse(courierUpdateSchema, req.body);
    const patch: any = {};
    for (const k of ["name", "phone", "active", "photoUrl", "cpf", "cpfFrontUrl", "cpfBackUrl", "cnh", "cnhFrontUrl", "cnhBackUrl"] as const) {
      if (data[k] !== undefined) patch[k] = data[k];
    }
    if (data.birthDate !== undefined) patch.birthDate = new Date(data.birthDate);
    if (data.password) patch.password = await hashPassword(data.password);
    const c = await prisma.courier.update({ where: { id: req.params.id }, data: patch });
    res.json(serializeCourierFull(c));
  })
);

// ===================== Dashboard (ADMIN) =====================
export const adminRouter = Router();
adminRouter.use(authenticate("EMPLOYEE"), rbac());

const ACTIVE_STATUSES = ["CONFIRMED", "PREPARING", "READY", "DISPATCHED", "PICKED_UP", "IN_ROUTE"];
const round2 = (n: number) => Math.round(n * 100) / 100;

adminRouter.get(
  "/stats",
  asyncHandler(async (_req, res) => {
    const now = new Date();
    const startToday = new Date(now);
    startToday.setHours(0, 0, 0, 0);
    const startYesterday = new Date(startToday);
    startYesterday.setDate(startYesterday.getDate() - 1);
    const DAYS = 14;
    const start14 = new Date(startToday);
    start14.setDate(start14.getDate() - (DAYS - 1));

    const [last14, allByStatus, ratings, paymentGroup, activeOrders, customersTotal, items] = await Promise.all([
      prisma.order.findMany({
        where: { createdAt: { gte: start14 }, status: { not: "CANCELLED" } },
        select: { total: true, createdAt: true, status: true },
      }),
      prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.rating.aggregate({ _avg: { stars: true }, _count: { _all: true } }),
      prisma.order.groupBy({
        by: ["paymentMethod"],
        where: { status: { not: "CANCELLED" } },
        _count: { _all: true },
        _sum: { total: true },
      }),
      prisma.order.count({ where: { status: { in: ACTIVE_STATUSES } } }),
      prisma.user.count(),
      prisma.orderItem.findMany({
        where: { order: { status: { not: "CANCELLED" } } },
        select: { quantity: true, unitPrice: true, product: { select: { name: true } } },
      }),
    ]);

    // Buckets por dia (últimos 14 dias)
    const days: { date: string; orders: number; revenue: number }[] = [];
    const idx = new Map<string, number>();
    for (let i = 0; i < DAYS; i++) {
      const d = new Date(start14);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      idx.set(key, days.length);
      days.push({ date: key, orders: 0, revenue: 0 });
    }

    let ordersToday = 0, revenueToday = 0, ordersYesterday = 0, revenueYesterday = 0, deliveredToday = 0;
    for (const o of last14) {
      const t = new Date(o.createdAt);
      const v = dec(o.total);
      const i = idx.get(t.toISOString().slice(0, 10));
      if (i != null) {
        days[i]!.orders++;
        days[i]!.revenue += v;
      }
      if (t >= startToday) {
        ordersToday++;
        revenueToday += v;
        if (o.status === "DELIVERED" || o.status === "CONFIRMED_BY_CUSTOMER") deliveredToday++;
      } else if (t >= startYesterday) {
        ordersYesterday++;
        revenueYesterday += v;
      }
    }
    for (const d of days) d.revenue = round2(d.revenue);

    const revenue7d = round2(days.slice(-7).reduce((s, d) => s + d.revenue, 0));
    const orders7d = days.slice(-7).reduce((s, d) => s + d.orders, 0);

    const byStatus: Record<string, number> = {};
    for (const row of allByStatus) byStatus[row.status] = row._count._all;

    const paymentMethods = paymentGroup
      .map((g) => ({ method: g.paymentMethod, count: g._count._all, total: round2(dec(g._sum.total)) }))
      .sort((a, b) => b.count - a.count);

    const prodMap = new Map<string, { name: string; qty: number; revenue: number }>();
    for (const it of items) {
      const name = it.product?.name ?? "Item";
      const cur = prodMap.get(name) ?? { name, qty: 0, revenue: 0 };
      cur.qty += it.quantity;
      cur.revenue += dec(it.unitPrice) * it.quantity;
      prodMap.set(name, cur);
    }
    const topProducts = [...prodMap.values()]
      .map((p) => ({ ...p, revenue: round2(p.revenue) }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 6);

    res.json({
      ordersToday,
      revenueToday: round2(revenueToday),
      avgTicket: ordersToday ? round2(revenueToday / ordersToday) : 0,
      ordersYesterday,
      revenueYesterday: round2(revenueYesterday),
      deliveredToday,
      activeOrders,
      customersTotal,
      revenue7d,
      orders7d,
      avgRating: ratings._avg.stars ? Math.round(ratings._avg.stars * 10) / 10 : null,
      ratingCount: ratings._count._all,
      byStatus,
      revenueByDay: days,
      paymentMethods,
      topProducts,
    });
  })
);

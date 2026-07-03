import { Router } from "express";
import { couponSchema, couponUpdateSchema, type CouponInput } from "@cabana/shared";
import { prisma } from "../lib/prisma.js";
import { parse } from "../lib/validate.js";
import { asyncHandler, notFound, badRequest } from "../lib/errors.js";
import { authenticate } from "../middlewares/auth.js";
import { rbac } from "../middlewares/rbac.js";
import { serializeCoupon } from "../lib/serialize.js";

// admin-only (funcionário ADMIN)
export const couponsRouter = Router();
couponsRouter.use(authenticate("EMPLOYEE"), rbac());

const couponInclude = { products: { select: { id: true } } };

// Monta os dados do Prisma a partir do input, normalizando código e escopo.
// isCreate controla se a relação de produtos usa connect (create) ou set (update).
function buildData(input: Partial<CouponInput>, isCreate: boolean) {
  const { productIds, code, expiresAt, appliesTo, categoryId, ...rest } = input;
  const data: any = { ...rest };

  if (code !== undefined) data.code = code.trim().toUpperCase();
  if (expiresAt !== undefined) data.expiresAt = expiresAt ? new Date(expiresAt) : null;
  if (appliesTo !== undefined) data.appliesTo = appliesTo;

  const scope = appliesTo ?? (isCreate ? "ALL" : undefined);

  // no create, esvaziar a relação = não enviar nada (Prisma create não aceita `set`)
  const clearProducts = isCreate ? undefined : { set: [] };

  if (scope === "CATEGORY") {
    if (!categoryId) throw badRequest("Selecione a categoria do cupom");
    data.categoryId = categoryId;
    data.products = clearProducts;
  } else if (scope === "PRODUCTS") {
    if (!productIds || productIds.length === 0) throw badRequest("Selecione ao menos um produto");
    data.categoryId = null;
    data.products = isCreate
      ? { connect: productIds.map((id) => ({ id })) }
      : { set: productIds.map((id) => ({ id })) };
  } else if (scope === "ALL") {
    data.categoryId = null;
    data.products = clearProducts;
  } else {
    // update sem mexer no escopo: ainda permite trocar a lista de produtos
    if (categoryId !== undefined) data.categoryId = categoryId;
    if (productIds !== undefined) data.products = { set: productIds.map((id) => ({ id })) };
  }
  return data;
}

// GET /coupons
couponsRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const list = await prisma.coupon.findMany({
      include: couponInclude,
      orderBy: { createdAt: "desc" },
    });
    res.json(list.map(serializeCoupon));
  })
);

// POST /coupons
couponsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const input = parse(couponSchema, req.body);
    const code = input.code.trim().toUpperCase();
    const exists = await prisma.coupon.findUnique({ where: { code } });
    if (exists) throw badRequest("Já existe um cupom com esse código");
    const c = await prisma.coupon.create({
      data: buildData(input, true),
      include: couponInclude,
    });
    res.status(201).json(serializeCoupon(c));
  })
);

// PATCH /coupons/:id
couponsRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const input = parse(couponUpdateSchema, req.body);
    const existing = await prisma.coupon.findUnique({ where: { id: req.params.id } });
    if (!existing) throw notFound("Cupom não encontrado");
    if (input.code) {
      const code = input.code.trim().toUpperCase();
      const dupe = await prisma.coupon.findFirst({ where: { code, id: { not: existing.id } } });
      if (dupe) throw badRequest("Já existe um cupom com esse código");
    }
    const c = await prisma.coupon.update({
      where: { id: existing.id },
      data: buildData(input, false),
      include: couponInclude,
    });
    res.json(serializeCoupon(c));
  })
);

// DELETE /coupons/:id — se já foi usado em pedidos, apenas desativa (preserva histórico)
couponsRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const existing = await prisma.coupon.findUnique({ where: { id: req.params.id } });
    if (!existing) throw notFound("Cupom não encontrado");
    const used = await prisma.order.count({ where: { couponId: existing.id } });
    if (used > 0) {
      const c = await prisma.coupon.update({
        where: { id: existing.id },
        data: { active: false },
        include: couponInclude,
      });
      return res.json({ ...serializeCoupon(c), softDeleted: true });
    }
    await prisma.coupon.update({ where: { id: existing.id }, data: { products: { set: [] } } });
    await prisma.coupon.delete({ where: { id: existing.id } });
    res.json({ ok: true });
  })
);

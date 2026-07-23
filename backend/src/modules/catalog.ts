import { Router } from "express";
import { categorySchema, productSchema } from "@cabana/shared";
import { prisma } from "../lib/prisma.js";
import { parse } from "../lib/validate.js";
import { asyncHandler, notFound, badRequest } from "../lib/errors.js";
import { authenticate } from "../middlewares/auth.js";
import { rbac } from "../middlewares/rbac.js";
import { serializeCategory, serializeProduct } from "../lib/serialize.js";

// admin-only = funcionário ADMIN
const adminOnly = [authenticate("EMPLOYEE"), rbac()];

// ===================== Categorias =====================
export const categoriesRouter = Router();

// GET /categories  (?all=1 para admin ver inativas)
categoriesRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const all = req.query.all === "1";
    const list = await prisma.category.findMany({
      where: all ? {} : { active: true },
      orderBy: { sortOrder: "asc" },
    });
    res.json(list.map(serializeCategory));
  })
);

categoriesRouter.post(
  "/",
  ...adminOnly,
  asyncHandler(async (req, res) => {
    const data = parse(categorySchema, req.body);
    const c = await prisma.category.create({ data });
    res.status(201).json(serializeCategory(c));
  })
);

categoriesRouter.patch(
  "/:id",
  ...adminOnly,
  asyncHandler(async (req, res) => {
    const data = parse(categorySchema.partial(), req.body);
    const c = await prisma.category.update({ where: { id: req.params.id }, data });
    res.json(serializeCategory(c));
  })
);

categoriesRouter.delete(
  "/:id",
  ...adminOnly,
  asyncHandler(async (req, res) => {
    const count = await prisma.product.count({ where: { categoryId: req.params.id } });
    if (count > 0) {
      // não apaga com produtos vinculados — apenas desativa
      const c = await prisma.category.update({ where: { id: req.params.id }, data: { active: false } });
      return res.json({ ...serializeCategory(c), softDeleted: true });
    }
    await prisma.category.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  })
);

// ===================== Produtos =====================
export const productsRouter = Router();

// include padrão de produto (categoria + extras + removíveis + grupos de opções)
const productInclude = {
  category: true,
  extras: { orderBy: { sortOrder: "asc" as const } },
  removables: { orderBy: { sortOrder: "asc" as const } },
  optionGroups: {
    orderBy: { sortOrder: "asc" as const },
    include: { options: { orderBy: { sortOrder: "asc" as const } } },
  },
};

// Monta o create aninhado de um grupo (usado no POST e no PATCH)
const nestedGroupCreate = (groups: any[]) =>
  groups.map((g: any, i: number) => ({
    name: g.name,
    type: g.type,
    kind: g.kind,
    minSelect: g.minSelect,
    maxSelect: g.maxSelect ?? null,
    pricingRule: g.pricingRule,
    allowQuantity: g.allowQuantity,
    active: g.active ?? true,
    sortOrder: i,
    options: {
      create: (g.options ?? []).map((o: any, j: number) => ({
        name: o.name,
        priceDelta: o.priceDelta ?? 0,
        linkedProductId: o.linkedProductId ?? null,
        active: o.active ?? true,
        sortOrder: j,
      })),
    },
  }));

// separa os campos aninhados (extras/removables/optionGroups) dos campos simples
function splitProductData(data: any) {
  const { extras, removables, optionGroups, ...rest } = data;
  const nested: any = {};
  if (extras !== undefined) {
    nested.extras = {
      deleteMany: {},
      create: (extras ?? []).map((e: any, i: number) => ({ name: e.name, price: e.price, sortOrder: i })),
    };
  }
  if (removables !== undefined) {
    nested.removables = {
      deleteMany: {},
      create: (removables ?? []).map((r: any, i: number) => ({ name: r.name, sortOrder: i })),
    };
  }
  if (optionGroups !== undefined) {
    // deleteMany cascateia para OptionItem (FK onDelete: Cascade)
    nested.optionGroups = { deleteMany: {}, create: nestedGroupCreate(optionGroups ?? []) };
  }
  return { rest, nested };
}

// Uma opção não pode apontar para um produto inexistente/inativo, nem para o
// próprio produto (combo que contém a si mesmo).
async function assertLinkedProducts(groups: any[] | undefined, selfId?: string) {
  if (!groups?.length) return;
  const ids = [
    ...new Set(
      groups.flatMap((g: any) => (g.options ?? []).map((o: any) => o.linkedProductId).filter(Boolean))
    ),
  ] as string[];
  if (!ids.length) return;
  if (selfId && ids.includes(selfId)) throw badRequest("Um produto não pode ser opção de si mesmo");
  const found = await prisma.product.findMany({
    where: { id: { in: ids }, active: true },
    select: { id: true },
  });
  if (found.length !== ids.length) {
    throw badRequest("Alguma opção aponta para um produto inexistente ou inativo");
  }
}

// GET /products  (?categoryId=&search=&all=1)
productsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { categoryId, search, all } = req.query as Record<string, string | undefined>;
    const where: any = {};
    if (all !== "1") where.active = true;
    if (categoryId) where.categoryId = categoryId;
    if (search) where.name = { contains: search };
    const list = await prisma.product.findMany({
      where,
      include: productInclude,
      orderBy: { name: "asc" },
    });
    res.json(list.map(serializeProduct));
  })
);

// GET /products/:id
productsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const p = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: productInclude,
    });
    if (!p) throw notFound("Produto não encontrado");
    res.json(serializeProduct(p));
  })
);

productsRouter.post(
  "/",
  ...adminOnly,
  asyncHandler(async (req, res) => {
    const data = parse(productSchema, req.body);
    const { extras, removables, optionGroups, ...rest } = data;
    await assertLinkedProducts(optionGroups);
    const p = await prisma.product.create({
      data: {
        ...rest,
        extras: extras?.length
          ? { create: extras.map((e, i) => ({ name: e.name, price: e.price, sortOrder: i })) }
          : undefined,
        removables: removables?.length
          ? { create: removables.map((r, i) => ({ name: r.name, sortOrder: i })) }
          : undefined,
        optionGroups: optionGroups?.length ? { create: nestedGroupCreate(optionGroups) } : undefined,
      },
      include: productInclude,
    });
    res.status(201).json(serializeProduct(p));
  })
);

productsRouter.patch(
  "/:id",
  ...adminOnly,
  asyncHandler(async (req, res) => {
    const data = parse(productSchema.partial(), req.body);
    await assertLinkedProducts(data.optionGroups, req.params.id);
    const { rest, nested } = splitProductData(data);
    const p = await prisma.product.update({
      where: { id: req.params.id },
      data: { ...rest, ...nested },
      include: productInclude,
    });
    res.json(serializeProduct(p));
  })
);

productsRouter.delete(
  "/:id",
  ...adminOnly,
  asyncHandler(async (req, res) => {
    const count = await prisma.orderItem.count({ where: { productId: req.params.id } });
    if (count > 0) {
      const p = await prisma.product.update({
        where: { id: req.params.id },
        data: { active: false },
        include: productInclude,
      });
      return res.json({ ...serializeProduct(p), softDeleted: true });
    }
    await prisma.product.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  })
);

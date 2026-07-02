import { Router } from "express";
import { z } from "zod";
import { addressSchema } from "@cabana/shared";
import { prisma } from "../lib/prisma.js";
import { parse } from "../lib/validate.js";
import { asyncHandler, notFound } from "../lib/errors.js";
import { authenticate } from "../middlewares/auth.js";
import { serializeAddress } from "../lib/serialize.js";

export const usersRouter = Router();
usersRouter.use(authenticate("CUSTOMER"));

const updateMeSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().min(8).optional().nullable(),
});

// GET /me
usersRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const u = await prisma.user.findUnique({
      where: { id: req.auth!.sub },
      include: { addresses: { orderBy: { isDefault: "desc" } } },
    });
    if (!u) throw notFound("Usuário não encontrado");
    res.json({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      addresses: u.addresses.map(serializeAddress),
    });
  })
);

// PATCH /me
usersRouter.patch(
  "/",
  asyncHandler(async (req, res) => {
    const data = parse(updateMeSchema, req.body);
    const u = await prisma.user.update({ where: { id: req.auth!.sub }, data });
    res.json({ id: u.id, name: u.name, email: u.email, phone: u.phone });
  })
);

// GET /me/addresses
usersRouter.get(
  "/addresses",
  asyncHandler(async (req, res) => {
    const list = await prisma.address.findMany({
      where: { userId: req.auth!.sub },
      orderBy: { isDefault: "desc" },
    });
    res.json(list.map(serializeAddress));
  })
);

// POST /me/addresses
usersRouter.post(
  "/addresses",
  asyncHandler(async (req, res) => {
    const data = parse(addressSchema, req.body);
    const userId = req.auth!.sub;
    if (data.isDefault) {
      await prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
    }
    const count = await prisma.address.count({ where: { userId } });
    const a = await prisma.address.create({
      data: { ...data, userId, isDefault: data.isDefault ?? count === 0 },
    });
    res.status(201).json(serializeAddress(a));
  })
);

// PATCH /me/addresses/:id
usersRouter.patch(
  "/addresses/:id",
  asyncHandler(async (req, res) => {
    const userId = req.auth!.sub;
    const existing = await prisma.address.findFirst({ where: { id: req.params.id, userId } });
    if (!existing) throw notFound("Endereço não encontrado");
    const data = parse(addressSchema.partial(), req.body);
    if (data.isDefault) {
      await prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
    }
    const a = await prisma.address.update({ where: { id: existing.id }, data });
    res.json(serializeAddress(a));
  })
);

// DELETE /me/addresses/:id
usersRouter.delete(
  "/addresses/:id",
  asyncHandler(async (req, res) => {
    const userId = req.auth!.sub;
    const existing = await prisma.address.findFirst({ where: { id: req.params.id, userId } });
    if (!existing) throw notFound("Endereço não encontrado");
    await prisma.address.delete({ where: { id: existing.id } });
    res.json({ ok: true });
  })
);

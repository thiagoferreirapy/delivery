import { Router } from "express";
import { addressSchema, updateProfileSchema, changePasswordSchema } from "@cabana/shared";
import { prisma } from "../lib/prisma.js";
import { parse } from "../lib/validate.js";
import { asyncHandler, notFound, badRequest, unauthorized } from "../lib/errors.js";
import { authenticate } from "../middlewares/auth.js";
import { serializeAddress } from "../lib/serialize.js";
import { hashPassword, verifyPassword } from "../lib/password.js";
import { geocodeAddress, reverseGeocode } from "../integrations/maps.js";

export const usersRouter = Router();
usersRouter.use(authenticate("CUSTOMER"));

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
    const data = parse(updateProfileSchema, req.body);
    const u = await prisma.user.update({ where: { id: req.auth!.sub }, data });
    res.json({ id: u.id, name: u.name, email: u.email, phone: u.phone });
  })
);

// PATCH /me/password — troca de senha (valida a senha atual)
usersRouter.patch(
  "/password",
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = parse(changePasswordSchema, req.body);
    const u = await prisma.user.findUnique({ where: { id: req.auth!.sub } });
    if (!u) throw notFound("Usuário não encontrado");
    if (!(await verifyPassword(currentPassword, u.password))) {
      throw unauthorized("Senha atual incorreta");
    }
    if (await verifyPassword(newPassword, u.password)) {
      throw badRequest("A nova senha deve ser diferente da atual");
    }
    await prisma.user.update({
      where: { id: u.id },
      data: { password: await hashPassword(newPassword) },
    });
    res.json({ ok: true });
  })
);

// GET /me/geocode — converte campos de endereço em lat/lng (Nominatim, via backend)
usersRouter.get(
  "/geocode",
  asyncHandler(async (req, res) => {
    const q = req.query as Record<string, string | undefined>;
    const geo = await geocodeAddress({
      street: q.street,
      number: q.number,
      neighborhood: q.neighborhood,
      city: q.city,
      state: q.state,
    });
    res.json(geo); // { lat, lng } ou null
  })
);

// GET /me/reverse-geocode?lat=&lng= — coordenadas -> campos do endereço
usersRouter.get(
  "/reverse-geocode",
  asyncHandler(async (req, res) => {
    const lat = parseFloat(String(req.query.lat));
    const lng = parseFloat(String(req.query.lng));
    if (Number.isNaN(lat) || Number.isNaN(lng)) return res.json(null);
    const parts = await reverseGeocode({ lat, lng });
    res.json(parts);
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
    // Geocodifica se o cliente não marcou o pino manualmente
    let { lat, lng } = data;
    if (lat == null || lng == null) {
      const geo = await geocodeAddress(data);
      if (geo) {
        lat = geo.lat;
        lng = geo.lng;
      }
    }
    const a = await prisma.address.create({
      data: { ...data, lat: lat ?? null, lng: lng ?? null, userId, isDefault: data.isDefault ?? count === 0 },
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
    // Se não veio pino manual, re-geocodifica a partir do endereço final (mesclado)
    const patch: typeof data = { ...data };
    if (data.lat == null || data.lng == null) {
      const merged = { ...existing, ...data };
      const geo = await geocodeAddress(merged);
      if (geo) {
        patch.lat = geo.lat;
        patch.lng = geo.lng;
      }
    }
    const a = await prisma.address.update({ where: { id: existing.id }, data: patch });
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

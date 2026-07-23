import { Router } from "express";
import { storeSchema } from "@cabana/shared";
import { prisma } from "../lib/prisma.js";
import { parse } from "../lib/validate.js";
import { asyncHandler, badRequest } from "../lib/errors.js";
import { authenticate } from "../middlewares/auth.js";
import { rbac } from "../middlewares/rbac.js";
import { loadStoreDTO, getStoreSettings, toMinutes } from "../services/store-hours.js";

export const storeRouter = Router();

const adminOnly = [authenticate("EMPLOYEE"), rbac()];

// GET /store — público: o cliente precisa saber se a loja está aberta
storeRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    res.json(await loadStoreDTO());
  })
);

// PATCH /store — admin edita nome, pausa e horários
storeRouter.patch(
  "/",
  ...adminOnly,
  asyncHandler(async (req, res) => {
    const data = parse(storeSchema, req.body);
    const { hours, ...rest } = data;

    // Faixa com abertura == fechamento seria uma janela de duração zero (ou 24h,
    // dependendo da leitura). Rejeita para não virar ambiguidade silenciosa.
    for (const h of hours ?? []) {
      if (toMinutes(h.opensAt) === toMinutes(h.closesAt)) {
        throw badRequest(`Abertura e fechamento não podem ser iguais (${h.opensAt})`);
      }
    }

    await getStoreSettings(); // garante o singleton antes do update
    await prisma.$transaction([
      prisma.storeSettings.update({ where: { id: "default" }, data: rest }),
      ...(hours !== undefined
        ? [
            prisma.openingHour.deleteMany({ where: { storeId: "default" } }),
            prisma.openingHour.createMany({
              data: hours.map((h) => ({
                storeId: "default",
                weekday: h.weekday,
                opensAt: h.opensAt,
                closesAt: h.closesAt,
                active: h.active ?? true,
              })),
            }),
          ]
        : []),
    ]);

    res.json(await loadStoreDTO());
  })
);

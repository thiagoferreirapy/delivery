import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../lib/errors.js";
import { authenticate } from "../middlewares/auth.js";
import { rbac } from "../middlewares/rbac.js";
import { serializeAddress } from "../lib/serialize.js";

// Lista/busca de clientes para o cadastro de pedido manual (balcão/telefone).
// Acesso: ADMIN e ATTENDANT.
export const customersRouter = Router();
customersRouter.use(authenticate("EMPLOYEE"), rbac("ATTENDANT"));

// GET /customers?search=
customersRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const search = (req.query.search as string | undefined)?.trim();
    const where = search
      ? {
          OR: [
            { name: { contains: search } },
            { email: { contains: search } },
            { phone: { contains: search } },
          ],
        }
      : {};
    const users = await prisma.user.findMany({
      where,
      include: { addresses: { orderBy: { isDefault: "desc" } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    res.json(
      users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        addresses: u.addresses.map(serializeAddress),
      }))
    );
  })
);

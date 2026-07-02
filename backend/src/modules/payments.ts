import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { parse } from "../lib/validate.js";
import { asyncHandler, badRequest, forbidden, notFound } from "../lib/errors.js";
import { authenticate } from "../middlewares/auth.js";
import { pixService, pixAutoConfirmEnabled, pixAutoConfirmMs } from "../integrations/pix.js";
import { transitionOrder } from "../services/order-service.js";
import { dec } from "../lib/serialize.js";

export const paymentsRouter = Router();

// Confirma um pagamento PIX (usado pelo webhook e pela confirmação automática do mock)
export async function confirmPixPayment(orderId: string): Promise<boolean> {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { payment: true } });
  if (!order || !order.payment) return false;
  if (order.payment.status === "PAID" || order.status !== "PENDING") return false;

  await prisma.payment.update({
    where: { orderId },
    data: { status: "PAID", paidAt: new Date() },
  });
  await transitionOrder({
    orderId,
    to: "CONFIRMED",
    actor: { kind: "SYSTEM" },
    note: "Pagamento PIX confirmado",
    changedById: "system",
  });
  return true;
}

// POST /payments/pix/:orderId — gera cobrança PIX (QR + copia-e-cola)
paymentsRouter.post(
  "/pix/:orderId",
  authenticate("CUSTOMER"),
  asyncHandler(async (req, res) => {
    const order = await prisma.order.findUnique({
      where: { id: req.params.orderId },
      include: { payment: true },
    });
    if (!order) throw notFound("Pedido não encontrado");
    if (order.userId !== req.auth!.sub) throw forbidden();
    if (order.paymentMethod !== "PIX") throw badRequest("Pedido não é PIX");

    const charge = await pixService.createCharge(order.id, dec(order.total));
    await prisma.payment.update({
      where: { orderId: order.id },
      data: { pixQrCode: charge.copyPaste, pixQrImageUrl: charge.qrImageUrl, status: "PENDING" },
    });

    // Mock: agenda confirmação automática (simula o webhook do provedor)
    if (pixAutoConfirmEnabled) {
      setTimeout(() => {
        confirmPixPayment(order.id).catch((e) => console.error("[pix auto-confirm]", e));
      }, pixAutoConfirmMs);
    }

    res.json({
      orderId: order.id,
      qrCode: charge.qrCode,
      copyPaste: charge.copyPaste,
      qrImageUrl: charge.qrImageUrl,
      autoConfirmMs: pixAutoConfirmEnabled ? pixAutoConfirmMs : null,
    });
  })
);

// POST /payments/pix/webhook — confirma pagamento (real: provedor; dev: botão "Simular pagamento")
const webhookSchema = z.object({ orderId: z.string().min(1) });
paymentsRouter.post(
  "/pix/webhook",
  asyncHandler(async (req, res) => {
    const { orderId } = parse(webhookSchema, req.body);
    const ok = await confirmPixPayment(orderId);
    res.json({ ok, orderId });
  })
);

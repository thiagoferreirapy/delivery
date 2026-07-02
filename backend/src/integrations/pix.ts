import { env } from "../config/env.js";

// ===== PixService =====
// Interface + mock funcional + adapter real stubbado.
// Mock gera um payload "copia-e-cola" plausível e uma imagem de QR.
// A confirmação automática é agendada pelo módulo de pagamentos (setTimeout)
// OU disparada manualmente via POST /payments/pix/webhook ("Simular pagamento").

export interface PixCharge {
  qrCode: string; // payload BR Code (copia-e-cola)
  copyPaste: string;
  qrImageUrl: string;
}

export interface PixService {
  createCharge(orderId: string, amount: number): Promise<PixCharge>;
}

function fakeBrCode(orderId: string, amount: number): string {
  const val = amount.toFixed(2);
  // Estrutura simplificada estilo EMV/BR Code (apenas para exibição no mock)
  return [
    "00020126",
    "0014BR.GOV.BCB.PIX",
    `0136cabana-lanches-${orderId.slice(0, 8)}`,
    "52040000",
    "5303986",
    `54${String(val.length).padStart(2, "0")}${val}`,
    "5802BR",
    "5913CABANA LANCHES",
    "6009SAO PAULO",
    "6304MOCK",
  ].join("");
}

class MockPixService implements PixService {
  async createCharge(orderId: string, amount: number): Promise<PixCharge> {
    const payload = fakeBrCode(orderId, amount);
    return {
      qrCode: payload,
      copyPaste: payload,
      // QR real do payload via serviço público (apenas no mock/dev)
      qrImageUrl: `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(
        payload
      )}`,
    };
  }
}

// Adapter real: Asaas / Mercado Pago / Gerencianet. Assinatura pronta.
class RealPixService implements PixService {
  private mock = new MockPixService();
  async createCharge(orderId: string, amount: number): Promise<PixCharge> {
    if (!env.pix.apiKey) {
      console.warn(`[PixService] driver=${env.pix.driver} sem PIX_API_KEY — usando mock.`);
      return this.mock.createCharge(orderId, amount);
    }
    // TODO(real): chamar a API do provedor com env.pix.apiKey, criar cobrança,
    // retornar { qrCode, copyPaste, qrImageUrl }. Webhook do provedor bate em
    // POST /payments/pix/webhook para confirmar.
    return this.mock.createCharge(orderId, amount);
  }
}

export const pixService: PixService =
  env.pix.driver === "mock" ? new MockPixService() : new RealPixService();

export const pixAutoConfirmEnabled = env.pix.driver === "mock" && env.pix.autoConfirmMs > 0;
export const pixAutoConfirmMs = env.pix.autoConfirmMs;

// ===== CardPaymentService =====
// Cartão hoje é CONFIRMAÇÃO MANUAL NA ENTREGA (pelo entregador).
// Interface vazia stubbada para futura maquininha/gateway (ex.: Stone, PagSeguro).

export interface CardChargeResult {
  approved: boolean;
  transactionId?: string;
  message: string;
}

export interface CardPaymentService {
  charge(orderId: string, amount: number): Promise<CardChargeResult>;
}

class StubCardPaymentService implements CardPaymentService {
  async charge(orderId: string, amount: number): Promise<CardChargeResult> {
    // Sem gateway plugado: pagamento é confirmado presencialmente pelo entregador.
    return {
      approved: false,
      message:
        "Pagamento com cartão é confirmado na entrega pelo entregador (sem gateway online configurado).",
    };
  }
}

export const cardPaymentService: CardPaymentService = new StubCardPaymentService();

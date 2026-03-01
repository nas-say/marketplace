import "server-only";

export const CASH_BETA_PAYOUT_FEE_BPS = 500;

export interface CashBetaPayoutBreakdown {
  grossMinor: number;
  feeMinor: number;
  netMinor: number;
}

export function calculateCashBetaPayout(grossMinorInput: number): CashBetaPayoutBreakdown {
  const grossMinor = Number.isFinite(grossMinorInput) ? Math.max(0, Math.round(grossMinorInput)) : 0;
  const feeMinor = Math.ceil((grossMinor * CASH_BETA_PAYOUT_FEE_BPS) / 10_000);
  const netMinor = Math.max(0, grossMinor - feeMinor);

  return {
    grossMinor,
    feeMinor,
    netMinor,
  };
}


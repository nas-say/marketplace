import type { AdminCashPayoutItem } from "@/lib/db/admin";
import { getPayoutAgeHours } from "@/lib/admin/payout-sla";

export interface PayoutReconciliationIssueSet {
  mathMismatchCount: number;
  paidMissingTimestampCount: number;
  unfundedPendingCount: number;
  overduePending72hCount: number;
  unexpectedCurrencyCount: number;
}

export interface PayoutReconciliationSummary {
  monthKey: string;
  grossMinor: number;
  feeMinor: number;
  netMinor: number;
  paidNetMinor: number;
  failedNetMinor: number;
  pendingNetMinor: number;
  paidCount: number;
  failedCount: number;
  pendingCount: number;
  issues: PayoutReconciliationIssueSet;
}

function toMonthKey(iso: string): string {
  if (!iso || iso.length < 7) return new Date().toISOString().slice(0, 7);
  return iso.slice(0, 7);
}

export function summarizePayoutReconciliation(
  rows: AdminCashPayoutItem[],
  generatedAtIso: string,
  monthKey: string = toMonthKey(generatedAtIso)
): PayoutReconciliationSummary {
  const monthRows = rows.filter((row) => toMonthKey(row.approvedAt) === monthKey);

  let grossMinor = 0;
  let feeMinor = 0;
  let netMinor = 0;
  let paidNetMinor = 0;
  let failedNetMinor = 0;
  let pendingNetMinor = 0;
  let paidCount = 0;
  let failedCount = 0;
  let pendingCount = 0;

  const issues: PayoutReconciliationIssueSet = {
    mathMismatchCount: 0,
    paidMissingTimestampCount: 0,
    unfundedPendingCount: 0,
    overduePending72hCount: 0,
    unexpectedCurrencyCount: 0,
  };

  for (const row of monthRows) {
    const gross = Math.max(0, row.payoutGrossMinor);
    const fee = Math.max(0, row.payoutFeeMinor);
    const net = Math.max(0, row.payoutNetMinor);
    grossMinor += gross;
    feeMinor += fee;
    netMinor += net;

    if (gross !== fee + net) {
      issues.mathMismatchCount += 1;
    }

    if (row.rewardCurrency !== "INR") {
      issues.unexpectedCurrencyCount += 1;
    }

    if (row.payoutStatus === "paid") {
      paidCount += 1;
      paidNetMinor += net;
      if (!row.payoutPaidAt) {
        issues.paidMissingTimestampCount += 1;
      }
      continue;
    }

    if (row.payoutStatus === "failed") {
      failedCount += 1;
      failedNetMinor += net;
      continue;
    }

    pendingCount += 1;
    pendingNetMinor += net;

    if (row.rewardPoolStatus !== "funded") {
      issues.unfundedPendingCount += 1;
    }

    const ageHours = getPayoutAgeHours(row.approvedAt, generatedAtIso);
    if (ageHours !== null && ageHours >= 72) {
      issues.overduePending72hCount += 1;
    }
  }

  return {
    monthKey,
    grossMinor,
    feeMinor,
    netMinor,
    paidNetMinor,
    failedNetMinor,
    pendingNetMinor,
    paidCount,
    failedCount,
    pendingCount,
    issues,
  };
}

import { test } from "node:test";
import assert from "node:assert/strict";
import { summarizePayoutReconciliation } from "@/lib/admin/payout-reconciliation";
import type { AdminCashPayoutItem } from "@/lib/db/admin";

function row(partial: Partial<AdminCashPayoutItem>): AdminCashPayoutItem {
  return {
    betaTestId: "bt_1",
    betaTestTitle: "Test",
    creatorId: "creator_1",
    payoutGrossMinor: 10_000,
    payoutFeeMinor: 500,
    payoutNetMinor: 9_500,
    rewardCurrency: "INR",
    rewardPoolStatus: "funded",
    applicantUserId: "user_1",
    applicantName: null,
    applicantEmail: "user@example.com",
    upiId: null,
    approvedAt: "2026-03-01T10:00:00.000Z",
    payoutStatus: "pending",
    payoutPaidAt: null,
    payoutNote: null,
    ...partial,
  };
}

test("summarizePayoutReconciliation aggregates month totals and statuses", () => {
  const summary = summarizePayoutReconciliation(
    [
      row({ payoutStatus: "paid", payoutPaidAt: "2026-03-01T12:00:00.000Z" }),
      row({ applicantUserId: "user_2", payoutStatus: "failed" }),
      row({ applicantUserId: "user_3", payoutStatus: "pending" }),
    ],
    "2026-03-04T00:00:00.000Z",
    "2026-03"
  );

  assert.equal(summary.paidCount, 1);
  assert.equal(summary.failedCount, 1);
  assert.equal(summary.pendingCount, 1);
  assert.equal(summary.grossMinor, 30_000);
  assert.equal(summary.feeMinor, 1_500);
  assert.equal(summary.netMinor, 28_500);
});

test("summarizePayoutReconciliation flags reconciliation anomalies", () => {
  const summary = summarizePayoutReconciliation(
    [
      row({
        payoutGrossMinor: 10_000,
        payoutFeeMinor: 500,
        payoutNetMinor: 9_400,
      }),
      row({
        applicantUserId: "user_2",
        payoutStatus: "paid",
        payoutPaidAt: null,
      }),
      row({
        applicantUserId: "user_3",
        rewardPoolStatus: "pending",
        approvedAt: "2026-03-01T00:00:00.000Z",
      }),
      row({
        applicantUserId: "user_4",
        rewardCurrency: "USD",
      }),
    ],
    "2026-03-04T00:00:00.000Z",
    "2026-03"
  );

  assert.equal(summary.issues.mathMismatchCount, 1);
  assert.equal(summary.issues.paidMissingTimestampCount, 1);
  assert.equal(summary.issues.unfundedPendingCount, 1);
  assert.equal(summary.issues.overduePending72hCount, 1);
  assert.equal(summary.issues.unexpectedCurrencyCount, 1);
});

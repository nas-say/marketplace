import { NextResponse } from "next/server";
import { getAdminDashboardSnapshot } from "@/lib/db/admin";
import { summarizePayoutReconciliation } from "@/lib/admin/payout-reconciliation";
import { upsertAdminNotificationByDedupeKey } from "@/lib/db/admin-notifications";

export const runtime = "nodejs";

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return process.env.NODE_ENV !== "production";
  }
  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${secret}`;
}

function levelForSummary(summary: ReturnType<typeof summarizePayoutReconciliation>): "critical" | "warning" | "info" {
  const issuesTotal =
    summary.issues.mathMismatchCount +
    summary.issues.paidMissingTimestampCount +
    summary.issues.unfundedPendingCount +
    summary.issues.unexpectedCurrencyCount;

  if (issuesTotal > 0) return "critical";
  if (summary.issues.overduePending72hCount > 0 || summary.pendingCount > 0) return "warning";
  return "info";
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const snapshot = await getAdminDashboardSnapshot();
  const monthKey = snapshot.generatedAt.slice(0, 7);
  const summary = summarizePayoutReconciliation(snapshot.cashPayoutQueue, snapshot.generatedAt, monthKey);
  const level = levelForSummary(summary);

  const upserted = await upsertAdminNotificationByDedupeKey({
    dedupeKey: `payout-reconciliation:${monthKey}`,
    source: "payout.reconciliation",
    level,
    title: `Payout reconciliation (${monthKey})`,
    message: `Paid ${summary.paidCount} • Pending ${summary.pendingCount} • Failed ${summary.failedCount} • Net pending INR ${(summary.pendingNetMinor / 100).toFixed(2)} • Issues ${
      summary.issues.mathMismatchCount +
      summary.issues.paidMissingTimestampCount +
      summary.issues.unfundedPendingCount +
      summary.issues.unexpectedCurrencyCount +
      summary.issues.overduePending72hCount
    }`,
    href: "/admin#payout-queue",
    metadata: {
      generatedAt: snapshot.generatedAt,
      monthKey,
      summary,
    },
  });

  return NextResponse.json({
    ok: upserted,
    generatedAt: snapshot.generatedAt,
    monthKey,
    summary,
  });
}

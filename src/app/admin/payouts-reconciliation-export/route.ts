import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { isAdminUser } from "@/lib/admin-access";
import { applyPayoutFilters, parsePayoutFilters, sortPayoutRows } from "@/lib/admin/payout-filters";
import { getAdminDashboardSnapshot } from "@/lib/db/admin";

export const runtime = "nodejs";

interface MonthlyTotals {
  month: string;
  currency: string;
  totalCount: number;
  grossMinor: number;
  feeMinor: number;
  netMinor: number;
  pendingCount: number;
  pendingNetMinor: number;
  paidCount: number;
  paidNetMinor: number;
  failedCount: number;
  failedNetMinor: number;
}

function csvEscape(value: string): string {
  if (value.includes(",") || value.includes("\"") || value.includes("\n")) {
    return `"${value.replace(/"/g, "\"\"")}"`;
  }
  return value;
}

function monthKeyFromIso(isoValue: string): string {
  const parsed = new Date(isoValue);
  if (Number.isNaN(parsed.getTime())) return "unknown";
  const year = parsed.getUTCFullYear();
  const month = String(parsed.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!isAdminUser(userId)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const snapshot = await getAdminDashboardSnapshot();
  const { searchParams } = new URL(request.url);
  const filters = parsePayoutFilters({
    status: searchParams.get("status"),
    betaTest: searchParams.get("betaTest"),
    from: searchParams.get("from"),
    to: searchParams.get("to"),
  });
  const rows = applyPayoutFilters(sortPayoutRows(snapshot.cashPayoutQueue), filters);

  const grouped = new Map<string, MonthlyTotals>();
  for (const row of rows) {
    const month = monthKeyFromIso(row.approvedAt);
    const currency = row.rewardCurrency || "INR";
    const groupKey = `${month}:${currency}`;
    const existing = grouped.get(groupKey) ?? {
      month,
      currency,
      totalCount: 0,
      grossMinor: 0,
      feeMinor: 0,
      netMinor: 0,
      pendingCount: 0,
      pendingNetMinor: 0,
      paidCount: 0,
      paidNetMinor: 0,
      failedCount: 0,
      failedNetMinor: 0,
    };

    existing.totalCount += 1;
    existing.grossMinor += Math.max(0, row.payoutGrossMinor);
    existing.feeMinor += Math.max(0, row.payoutFeeMinor);
    existing.netMinor += Math.max(0, row.payoutNetMinor);

    if (row.payoutStatus === "paid") {
      existing.paidCount += 1;
      existing.paidNetMinor += Math.max(0, row.payoutNetMinor);
    } else if (row.payoutStatus === "failed") {
      existing.failedCount += 1;
      existing.failedNetMinor += Math.max(0, row.payoutNetMinor);
    } else {
      existing.pendingCount += 1;
      existing.pendingNetMinor += Math.max(0, row.payoutNetMinor);
    }

    grouped.set(groupKey, existing);
  }

  const headers = [
    "month",
    "currency",
    "totalCount",
    "grossMinor",
    "feeMinor",
    "netMinor",
    "pendingCount",
    "pendingNetMinor",
    "paidCount",
    "paidNetMinor",
    "failedCount",
    "failedNetMinor",
  ];

  const sortedGroups = [...grouped.values()].sort((a, b) => {
    if (a.month === b.month) return a.currency.localeCompare(b.currency);
    return b.month.localeCompare(a.month);
  });

  const lines = [headers.join(",")];
  for (const row of sortedGroups) {
    lines.push(
      [
        row.month,
        row.currency,
        String(row.totalCount),
        String(row.grossMinor),
        String(row.feeMinor),
        String(row.netMinor),
        String(row.pendingCount),
        String(row.pendingNetMinor),
        String(row.paidCount),
        String(row.paidNetMinor),
        String(row.failedCount),
        String(row.failedNetMinor),
      ]
        .map((value) => csvEscape(value))
        .join(",")
    );
  }

  const csv = `${lines.join("\n")}\n`;
  const filename = `sideflip-payouts-reconciliation-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

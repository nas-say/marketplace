import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { isAdminUser } from "@/lib/admin-access";
import { applyPayoutFilters, parsePayoutFilters, sortPayoutRows } from "@/lib/admin/payout-filters";
import { getAdminDashboardSnapshot } from "@/lib/db/admin";

export const runtime = "nodejs";

function csvEscape(value: string): string {
  if (value.includes(",") || value.includes("\"") || value.includes("\n")) {
    return `"${value.replace(/"/g, "\"\"")}"`;
  }
  return value;
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

  const headers = [
    "betaTestId",
    "betaTestTitle",
    "userId",
    "email",
    "upi",
    "grossMinor",
    "feeMinor",
    "netMinor",
    "status",
    "note",
    "approvedAt",
    "paidAt",
  ];

  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(
      [
        row.betaTestId,
        row.betaTestTitle,
        row.applicantUserId,
        row.applicantEmail ?? "",
        row.upiId ?? "",
        String(row.payoutGrossMinor),
        String(row.payoutFeeMinor),
        String(row.payoutNetMinor),
        row.payoutStatus,
        row.payoutNote ?? "",
        row.approvedAt,
        row.payoutPaidAt ?? "",
      ]
        .map((value) => csvEscape(value))
        .join(",")
    );
  }

  const csv = `${lines.join("\n")}\n`;
  const dateTag = new Date().toISOString().slice(0, 10);
  const filename = `sideflip-payouts-${dateTag}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

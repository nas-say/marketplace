import { NextResponse } from "next/server";
import { summarizePayoutSla } from "@/lib/admin/payout-sla";
import { getAdminDashboardSnapshot } from "@/lib/db/admin";
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

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const snapshot = await getAdminDashboardSnapshot();
  const summary = summarizePayoutSla(snapshot.cashPayoutQueue, snapshot.generatedAt);
  const dayKey = snapshot.generatedAt.slice(0, 10);

  const level =
    summary.over72h > 0 || summary.failedCount > 0
      ? "critical"
      : summary.over48h > 0
      ? "warning"
      : "info";

  const upserted = await upsertAdminNotificationByDedupeKey({
    dedupeKey: `daily-payout-summary:${dayKey}`,
    source: "payout.daily_summary",
    level,
    title: `Daily payout summary (${dayKey})`,
    message: `Pending ${summary.pendingCount} • >24h ${summary.over24h} • >48h ${summary.over48h} • >72h ${summary.over72h} • Failed ${summary.failedCount}`,
    href: "/admin#payout-queue",
    metadata: {
      generatedAt: snapshot.generatedAt,
      summary,
    },
  });

  return NextResponse.json({
    ok: upserted,
    generatedAt: snapshot.generatedAt,
    summary,
  });
}

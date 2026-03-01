import type { AdminCashPayoutItem } from "@/lib/db/admin";

export type PayoutSlaTier = "under_24h" | "over_24h" | "over_48h" | "over_72h";

export interface PayoutSlaSummary {
  pendingCount: number;
  failedCount: number;
  over24h: number;
  over48h: number;
  over72h: number;
  oldestPendingHours: number;
}

export function getPayoutAgeHours(approvedAtIso: string, nowIso: string): number | null {
  const approvedAt = Date.parse(approvedAtIso);
  const now = Date.parse(nowIso);
  if (Number.isNaN(approvedAt) || Number.isNaN(now)) return null;
  return Math.max(0, Math.floor((now - approvedAt) / (1000 * 60 * 60)));
}

export function getPayoutSlaTier(ageHours: number | null): PayoutSlaTier {
  if (ageHours === null) return "under_24h";
  if (ageHours >= 72) return "over_72h";
  if (ageHours >= 48) return "over_48h";
  if (ageHours >= 24) return "over_24h";
  return "under_24h";
}

export function summarizePayoutSla(rows: AdminCashPayoutItem[], nowIso: string): PayoutSlaSummary {
  const pendingRows = rows.filter((row) => row.payoutStatus === "pending");
  const failedRows = rows.filter((row) => row.payoutStatus === "failed");

  let over24h = 0;
  let over48h = 0;
  let over72h = 0;
  let oldestPendingHours = 0;

  for (const row of pendingRows) {
    const ageHours = getPayoutAgeHours(row.approvedAt, nowIso);
    if (ageHours === null) continue;
    oldestPendingHours = Math.max(oldestPendingHours, ageHours);
    if (ageHours >= 24) over24h += 1;
    if (ageHours >= 48) over48h += 1;
    if (ageHours >= 72) over72h += 1;
  }

  return {
    pendingCount: pendingRows.length,
    failedCount: failedRows.length,
    over24h,
    over48h,
    over72h,
    oldestPendingHours,
  };
}

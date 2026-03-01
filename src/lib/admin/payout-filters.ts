import type { AdminCashPayoutItem } from "@/lib/db/admin";

export type PayoutStatusFilter = "all" | "pending" | "paid" | "failed";

export interface PayoutFilters {
  status: PayoutStatusFilter;
  betaTestQuery: string;
  fromDate: string;
  toDate: string;
  fromEpochMs: number | null;
  toEpochMs: number | null;
}

const VALID_STATUS_FILTERS = new Set<PayoutStatusFilter>(["all", "pending", "paid", "failed"]);

function readFirstValue(input: unknown): string {
  if (typeof input === "string") return input;
  if (Array.isArray(input)) {
    const first = input[0];
    return typeof first === "string" ? first : "";
  }
  return "";
}

function parseDateStart(value: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const parsed = Date.parse(`${value}T00:00:00.000Z`);
  return Number.isNaN(parsed) ? null : parsed;
}

function parseDateEnd(value: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const parsed = Date.parse(`${value}T23:59:59.999Z`);
  return Number.isNaN(parsed) ? null : parsed;
}

function payoutStatusRank(status: string): number {
  if (status === "pending") return 0;
  if (status === "failed") return 1;
  return 2;
}

export function sortPayoutRows(rows: AdminCashPayoutItem[]): AdminCashPayoutItem[] {
  return [...rows].sort((a, b) => {
    const byStatus = payoutStatusRank(a.payoutStatus) - payoutStatusRank(b.payoutStatus);
    if (byStatus !== 0) return byStatus;
    return new Date(b.approvedAt).getTime() - new Date(a.approvedAt).getTime();
  });
}

export function parsePayoutFilters(input: {
  status?: unknown;
  betaTest?: unknown;
  from?: unknown;
  to?: unknown;
}): PayoutFilters {
  const rawStatus = readFirstValue(input.status).trim().toLowerCase();
  const status = VALID_STATUS_FILTERS.has(rawStatus as PayoutStatusFilter)
    ? (rawStatus as PayoutStatusFilter)
    : "all";
  const betaTestQuery = readFirstValue(input.betaTest).trim().slice(0, 120);
  const fromDate = readFirstValue(input.from).trim();
  const toDate = readFirstValue(input.to).trim();

  return {
    status,
    betaTestQuery,
    fromDate,
    toDate,
    fromEpochMs: parseDateStart(fromDate),
    toEpochMs: parseDateEnd(toDate),
  };
}

export function applyPayoutFilters(
  rows: AdminCashPayoutItem[],
  filters: PayoutFilters
): AdminCashPayoutItem[] {
  const query = filters.betaTestQuery.toLowerCase();
  return rows.filter((row) => {
    if (filters.status !== "all" && row.payoutStatus !== filters.status) {
      return false;
    }

    if (
      query.length > 0 &&
      !row.betaTestTitle.toLowerCase().includes(query) &&
      !row.betaTestId.toLowerCase().includes(query)
    ) {
      return false;
    }

    if (filters.fromEpochMs !== null || filters.toEpochMs !== null) {
      const approvedEpoch = Date.parse(row.approvedAt);
      if (Number.isNaN(approvedEpoch)) return false;
      if (filters.fromEpochMs !== null && approvedEpoch < filters.fromEpochMs) return false;
      if (filters.toEpochMs !== null && approvedEpoch > filters.toEpochMs) return false;
    }

    return true;
  });
}

export function hasActivePayoutFilters(filters: PayoutFilters): boolean {
  return (
    filters.status !== "all" ||
    filters.betaTestQuery.length > 0 ||
    filters.fromDate.length > 0 ||
    filters.toDate.length > 0
  );
}

export function payoutFiltersToSearchParams(filters: PayoutFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.status !== "all") params.set("status", filters.status);
  if (filters.betaTestQuery) params.set("betaTest", filters.betaTestQuery);
  if (filters.fromDate) params.set("from", filters.fromDate);
  if (filters.toDate) params.set("to", filters.toDate);
  return params;
}

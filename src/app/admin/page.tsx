import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/shared/page-header";
import { isAdminUser } from "@/lib/admin-access";
import {
  applyPayoutFilters,
  hasActivePayoutFilters,
  parsePayoutFilters,
  payoutFiltersToSearchParams,
  sortPayoutRows,
} from "@/lib/admin/payout-filters";
import { getPayoutAgeHours, getPayoutSlaTier, summarizePayoutSla, type PayoutSlaTier } from "@/lib/admin/payout-sla";
import { getAdminDashboardSnapshot } from "@/lib/db/admin";
import {
  createDailyPayoutSummaryNotificationAction,
  reopenAdminNotificationAction,
  resolveAdminNotificationAction,
  snoozeAdminNotificationAction,
  updateCashPayoutStatusAction,
} from "./actions";

type NotificationLevel = "critical" | "warning" | "info" | "success";

interface AdminDashboardNotification {
  id: string;
  level: NotificationLevel;
  title: string;
  message: string;
  href?: string;
  createdAt?: string;
}

function formatDate(value: string): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCurrencyMinor(amountMinor: number, currency: string): string {
  const normalized = (currency || "INR").toUpperCase();
  const amount = amountMinor / 100;
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: normalized,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${normalized} ${(amountMinor / 100).toFixed(2)}`;
  }
}

function payoutStatusClass(status: string): string {
  if (status === "paid") return "bg-green-500/10 text-green-400 border-green-500/30";
  if (status === "failed") return "bg-red-500/10 text-red-400 border-red-500/30";
  return "bg-amber-500/10 text-amber-300 border-amber-500/30";
}

function verificationStatusClass(status: string): string {
  if (status === "manual_requested") return "bg-indigo-500/10 text-indigo-300 border-indigo-500/30";
  if (status === "rejected") return "bg-red-500/10 text-red-400 border-red-500/30";
  return "bg-zinc-500/10 text-zinc-300 border-zinc-500/30";
}

function notificationBadgeClass(level: NotificationLevel): string {
  if (level === "critical") return "bg-red-500/10 text-red-300 border-red-500/40";
  if (level === "warning") return "bg-amber-500/10 text-amber-300 border-amber-500/40";
  if (level === "success") return "bg-green-500/10 text-green-300 border-green-500/40";
  return "bg-blue-500/10 text-blue-300 border-blue-500/40";
}

function notificationStatusClass(status: "open" | "snoozed" | "resolved"): string {
  if (status === "snoozed") return "bg-zinc-500/10 text-zinc-300 border-zinc-500/40";
  if (status === "resolved") return "bg-green-500/10 text-green-300 border-green-500/40";
  return "bg-indigo-500/10 text-indigo-300 border-indigo-500/40";
}

function payoutSlaBadgeClass(tier: PayoutSlaTier): string {
  if (tier === "over_72h") return "bg-red-500/10 text-red-300 border-red-500/40";
  if (tier === "over_48h") return "bg-amber-500/10 text-amber-300 border-amber-500/40";
  if (tier === "over_24h") return "bg-blue-500/10 text-blue-300 border-blue-500/40";
  return "bg-green-500/10 text-green-300 border-green-500/40";
}

function payoutSlaLabel(tier: PayoutSlaTier): string {
  if (tier === "over_72h") return ">72h";
  if (tier === "over_48h") return ">48h";
  if (tier === "over_24h") return ">24h";
  return "<24h";
}

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdminPage({ searchParams }: Props) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  if (!isAdminUser(userId)) notFound();

  const query = await searchParams;
  const payoutFilters = parsePayoutFilters({
    status: query.status,
    betaTest: query.betaTest,
    from: query.from,
    to: query.to,
  });
  const hasActiveFilters = hasActivePayoutFilters(payoutFilters);

  const snapshot = await getAdminDashboardSnapshot();
  const allPayoutRows = sortPayoutRows(snapshot.cashPayoutQueue);
  const payoutRows = applyPayoutFilters(allPayoutRows, payoutFilters);

  const payoutFilterParams = payoutFiltersToSearchParams(payoutFilters);
  const payoutFilterQuery = payoutFilterParams.toString();
  const payoutExportHref = payoutFilterQuery
    ? `/admin/payouts-export?${payoutFilterQuery}`
    : "/admin/payouts-export";
  const reconciliationExportHref = payoutFilterQuery
    ? `/admin/payouts-reconciliation-export?${payoutFilterQuery}`
    : "/admin/payouts-reconciliation-export";

  const verificationRows = snapshot.listingVerificationQueue.slice(0, 100);
  const premiumRows = snapshot.premiumApprovalQueue.slice(0, 100);
  const betaPaymentRows = snapshot.recentBetaPayments.slice(0, 100);
  const connectPurchaseRows = snapshot.recentConnectPurchases.slice(0, 100);
  const interestRows = snapshot.recentInterestSignals.slice(0, 100);
  const recentUsers = snapshot.recentUsers.slice(0, 100);
  const slaSummary = summarizePayoutSla(allPayoutRows, snapshot.generatedAt);

  const adminNotifications: AdminDashboardNotification[] = [];
  if (slaSummary.pendingCount > 0) {
    adminNotifications.push({
      id: "pending-payouts",
      level: "warning",
      title: `${slaSummary.pendingCount} payout(s) pending`,
      message: "Review payout queue and mark paid/failed with reference note.",
      href: "/admin#payout-queue",
    });
  }
  if (slaSummary.over48h > 0) {
    adminNotifications.push({
      id: "stale-payouts",
      level: "critical",
      title: `${slaSummary.over48h} payout(s) pending for over 48h`,
      message: "These payouts are likely delayed and need immediate action.",
      href: "/admin#payout-queue",
    });
  }
  if (slaSummary.failedCount > 0) {
    adminNotifications.push({
      id: "failed-payouts",
      level: "critical",
      title: `${slaSummary.failedCount} payout(s) marked failed`,
      message: "Check failed payout notes and retry once issue is resolved.",
      href: "/admin#payout-queue",
    });
  }
  if (snapshot.overview.pendingVerificationListings > 0) {
    adminNotifications.push({
      id: "pending-verifications",
      level: "info",
      title: `${snapshot.overview.pendingVerificationListings} listing(s) pending verification`,
      message: "Review repo/domain/manual ownership checks to keep marketplace quality high.",
      href: "/admin#verification-queue",
    });
  }
  if (snapshot.overview.manualReviewRequests > 0) {
    adminNotifications.push({
      id: "manual-review-requests",
      level: "warning",
      title: `${snapshot.overview.manualReviewRequests} manual review request(s) waiting`,
      message: "Creators requested manual ownership review with additional context.",
      href: "/admin#verification-queue",
    });
  }
  if (snapshot.overview.pendingCashPools > 0) {
    adminNotifications.push({
      id: "pending-cash-pools",
      level: "warning",
      title: `${snapshot.overview.pendingCashPools} cash beta test(s) not funded`,
      message: "These beta tests remain drafts until reward pools are funded.",
      href: "/admin",
    });
  }

  const auditNotifications: AdminDashboardNotification[] = snapshot.recentPayoutAudit
    .slice(0, 6)
    .map((row) => ({
      id: `audit-${row.id}`,
      level: row.nextStatus === "failed" ? "critical" : "info",
      title: `Payout ${row.nextStatus}: ${row.betaTestTitle}`,
      message: `${row.applicantName ?? row.applicantUserId} • ${row.previousStatus} -> ${row.nextStatus}`,
      href: "/admin#payout-audit",
      createdAt: row.createdAt,
    }));

  const dashboardNotifications =
    adminNotifications.length > 0
      ? [...adminNotifications, ...auditNotifications].slice(0, 12)
      : [
          {
            id: "no-alerts",
            level: "success" as const,
            title: "No active operational alerts",
            message: "Payouts and verification queues are under control.",
          },
          ...auditNotifications,
        ].slice(0, 12);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      <PageHeader
        title="Admin Dashboard"
        description="Global product visibility, payout queue, verification queue, and payment telemetry."
      />

      {!snapshot.payoutStatusTrackingAvailable && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-200">
          Payout status tracking columns are missing in Supabase. Run the latest SQL migration before marking payouts
          as paid.
        </div>
      )}

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Users</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-50">{snapshot.overview.totalUsers}</p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Listings</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-50">{snapshot.overview.totalListings}</p>
          <p className="mt-1 text-xs text-zinc-400">
            {snapshot.overview.activeListings} active • {snapshot.overview.pendingVerificationListings} pending verify
          </p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Beta Tests</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-50">{snapshot.overview.totalBetaTests}</p>
          <p className="mt-1 text-xs text-zinc-400">
            {snapshot.overview.openBetaTests} open • {snapshot.overview.fundedCashBetaTests} funded
          </p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Cash Payouts Left</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-50">{snapshot.overview.pendingCashPayouts}</p>
          <p className="mt-1 text-xs text-zinc-400">
            {formatCurrencyMinor(snapshot.overview.pendingCashPayoutAmountMinor, "INR")}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            5% fee share: {formatCurrencyMinor(snapshot.overview.pendingCashPlatformFeeMinor, "INR")}
          </p>
        </div>
      </section>

      <section className="rounded-lg border border-zinc-800 bg-zinc-900">
        <div className="border-b border-zinc-800 px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-zinc-100">Persistent Admin Inbox</h2>
              <p className="text-xs text-zinc-500">Operational notifications with resolve/snooze controls.</p>
            </div>
            <form action={createDailyPayoutSummaryNotificationAction}>
              <Button size="sm" variant="outline" className="border-zinc-700 text-zinc-300">
                Create Daily Payout Summary
              </Button>
            </form>
          </div>
        </div>
        {!snapshot.adminNotificationsAvailable && (
          <div className="px-4 py-4 text-sm text-amber-200 bg-amber-500/10 border-t border-amber-500/30">
            Admin notifications table is not available yet. Run the latest SQL migration in Supabase.
          </div>
        )}
        {snapshot.adminNotificationsAvailable && (
          <div className="divide-y divide-zinc-800">
            {snapshot.activeAdminNotifications.length === 0 && (
              <div className="px-4 py-4 text-sm text-zinc-500">No active persistent notifications.</div>
            )}
            {snapshot.activeAdminNotifications.map((item) => (
              <div key={item.id} className="flex flex-wrap items-start justify-between gap-3 px-4 py-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={notificationBadgeClass(item.level)}>{item.level}</Badge>
                    <Badge className={notificationStatusClass(item.status)}>{item.status}</Badge>
                    <p className="text-sm font-medium text-zinc-100">{item.title}</p>
                  </div>
                  <p className="mt-1 text-sm text-zinc-400">{item.message}</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Source: {item.source}
                    {item.snoozedUntil ? ` • Snoozed until ${formatDate(item.snoozedUntil)}` : ""}
                  </p>
                </div>
                <div className="flex flex-col items-start gap-2 sm:items-end">
                  <span className="text-xs text-zinc-500">{formatDate(item.createdAt)}</span>
                  <div className="flex flex-wrap items-center gap-2">
                    {item.href && (
                      <Link href={item.href} className="text-xs text-indigo-300 hover:text-indigo-200">
                        Open
                      </Link>
                    )}
                    <form action={resolveAdminNotificationAction}>
                      <input type="hidden" name="notificationId" value={item.id} />
                      <Button type="submit" size="sm" variant="outline" className="h-7 border-green-500/40 px-2 text-xs text-green-300">
                        Resolve
                      </Button>
                    </form>
                    {item.status === "snoozed" ? (
                      <form action={reopenAdminNotificationAction}>
                        <input type="hidden" name="notificationId" value={item.id} />
                        <Button type="submit" size="sm" variant="outline" className="h-7 border-zinc-600 px-2 text-xs text-zinc-300">
                          Reopen
                        </Button>
                      </form>
                    ) : (
                      <>
                        <form action={snoozeAdminNotificationAction}>
                          <input type="hidden" name="notificationId" value={item.id} />
                          <input type="hidden" name="hours" value="24" />
                          <Button type="submit" size="sm" variant="outline" className="h-7 border-zinc-600 px-2 text-xs text-zinc-300">
                            Snooze 24h
                          </Button>
                        </form>
                        <form action={snoozeAdminNotificationAction}>
                          <input type="hidden" name="notificationId" value={item.id} />
                          <input type="hidden" name="hours" value="72" />
                          <Button type="submit" size="sm" variant="outline" className="h-7 border-zinc-600 px-2 text-xs text-zinc-300">
                            Snooze 72h
                          </Button>
                        </form>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-lg border border-zinc-800 bg-zinc-900">
        <div className="border-b border-zinc-800 px-4 py-3">
          <h2 className="text-base font-semibold text-zinc-100">Admin Notifications</h2>
          <p className="text-xs text-zinc-500">Live operational alerts and recent payout activity.</p>
        </div>
        <div className="divide-y divide-zinc-800">
          {dashboardNotifications.map((item) => (
            <div key={item.id} className="flex flex-wrap items-start justify-between gap-3 px-4 py-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={notificationBadgeClass(item.level)}>{item.level}</Badge>
                  <p className="text-sm font-medium text-zinc-100">{item.title}</p>
                </div>
                <p className="mt-1 text-sm text-zinc-400">{item.message}</p>
              </div>
              <div className="flex flex-col items-start gap-1 text-xs text-zinc-500 sm:items-end">
                {item.createdAt && <span>{formatDate(item.createdAt)}</span>}
                {item.href && (
                  <Link href={item.href} className="text-indigo-300 hover:text-indigo-200">
                    Open
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="payout-queue" className="rounded-lg border border-zinc-800 bg-zinc-900">
        <div className="border-b border-zinc-800 px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-zinc-100">Cash Payout Queue</h2>
              <p className="text-xs text-zinc-500">
                Approved cash applications. Add UTR/reason note, then mark each payout status.
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                SLA snapshot: &gt;24h {slaSummary.over24h} • &gt;48h {slaSummary.over48h} • &gt;72h{" "}
                {slaSummary.over72h}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link href={payoutExportHref} className="shrink-0">
                <Button size="sm" variant="outline" className="border-zinc-700 text-zinc-300">
                  Export Queue CSV
                </Button>
              </Link>
              <Link href={reconciliationExportHref} className="shrink-0">
                <Button size="sm" variant="outline" className="border-zinc-700 text-zinc-300">
                  Export Monthly Reconciliation
                </Button>
              </Link>
            </div>
          </div>
          <form method="get" className="mt-3 flex flex-wrap items-end gap-2">
            <label className="flex flex-col gap-1 text-xs text-zinc-500">
              Status
              <select
                name="status"
                defaultValue={payoutFilters.status === "all" ? "" : payoutFilters.status}
                className="h-8 rounded-md border border-zinc-700 bg-zinc-950 px-2 text-xs text-zinc-200"
              >
                <option value="">All</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="paid">Paid</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs text-zinc-500">
              Beta Test
              <Input
                name="betaTest"
                defaultValue={payoutFilters.betaTestQuery}
                placeholder="Title or ID"
                className="h-8 w-48 border-zinc-700 bg-zinc-950 text-xs"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-zinc-500">
              From
              <Input
                type="date"
                name="from"
                defaultValue={payoutFilters.fromDate}
                className="h-8 border-zinc-700 bg-zinc-950 text-xs"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-zinc-500">
              To
              <Input
                type="date"
                name="to"
                defaultValue={payoutFilters.toDate}
                className="h-8 border-zinc-700 bg-zinc-950 text-xs"
              />
            </label>
            <Button type="submit" size="sm">
              Apply Filters
            </Button>
            {hasActiveFilters && (
              <Link href="/admin">
                <Button type="button" size="sm" variant="outline" className="border-zinc-700 text-zinc-300">
                  Clear
                </Button>
              </Link>
            )}
          </form>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-zinc-950 text-zinc-400">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Beta Test</th>
                <th className="px-3 py-2 text-left font-medium">Applicant</th>
                <th className="px-3 py-2 text-left font-medium">Reward</th>
                <th className="px-3 py-2 text-left font-medium">UPI</th>
                <th className="px-3 py-2 text-left font-medium">Status</th>
                <th className="px-3 py-2 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {payoutRows.length === 0 && (
                <tr>
                  <td className="px-3 py-4 text-zinc-500" colSpan={6}>
                    {hasActiveFilters ? "No payout rows match current filters." : "No approved cash applications yet."}
                  </td>
                </tr>
              )}
              {payoutRows.map((row) => (
                <tr key={`${row.betaTestId}:${row.applicantUserId}`} className="border-t border-zinc-800">
                  <td className="px-3 py-3 align-top">
                    <Link href={`/beta/${row.betaTestId}`} className="text-indigo-300 hover:text-indigo-200">
                      {row.betaTestTitle}
                    </Link>
                    <p className="text-xs text-zinc-500">Approved {formatDate(row.approvedAt)}</p>
                  </td>
                  <td className="px-3 py-3 align-top">
                    <p className="text-zinc-200">{row.applicantName ?? row.applicantUserId}</p>
                    <p className="text-xs text-zinc-500">{row.applicantEmail ?? "No email captured"}</p>
                  </td>
                  <td className="px-3 py-3 align-top">
                    <p className="text-zinc-200">Gross: {formatCurrencyMinor(row.payoutGrossMinor, row.rewardCurrency)}</p>
                    <p className="text-amber-300 text-xs">Fee (5%): {formatCurrencyMinor(row.payoutFeeMinor, row.rewardCurrency)}</p>
                    <p className="text-green-300 text-xs">Net payout: {formatCurrencyMinor(row.payoutNetMinor, row.rewardCurrency)}</p>
                    <p className="text-xs text-zinc-500">Pool: {row.rewardPoolStatus}</p>
                  </td>
                  <td className="px-3 py-3 align-top">
                    <p className="text-zinc-200">{row.upiId ?? "No UPI captured"}</p>
                    {row.payoutNote && <p className="text-xs text-zinc-500">Note: {row.payoutNote}</p>}
                  </td>
                  <td className="px-3 py-3 align-top">
                    <Badge className={payoutStatusClass(row.payoutStatus)}>{row.payoutStatus}</Badge>
                    {row.payoutStatus === "pending" && (() => {
                      const ageHours = getPayoutAgeHours(row.approvedAt, snapshot.generatedAt);
                      const tier = getPayoutSlaTier(ageHours);
                      return (
                        <div className="mt-1">
                          <Badge className={payoutSlaBadgeClass(tier)}>
                            SLA {payoutSlaLabel(tier)}
                            {ageHours !== null ? ` • ${ageHours}h` : ""}
                          </Badge>
                        </div>
                      );
                    })()}
                    <p className="mt-1 text-xs text-zinc-500">
                      {row.payoutPaidAt ? `Paid at ${formatDate(row.payoutPaidAt)}` : "Not paid yet"}
                    </p>
                  </td>
                  <td className="px-3 py-3 align-top">
                    <form action={updateCashPayoutStatusAction} className="flex min-w-[220px] flex-col gap-2">
                      <input type="hidden" name="betaTestId" value={row.betaTestId} />
                      <input type="hidden" name="applicantUserId" value={row.applicantUserId} />
                      <Input
                        name="payoutNote"
                        defaultValue={row.payoutNote ?? ""}
                        placeholder="UTR / reference / reason"
                        className="h-8 border-zinc-700 bg-zinc-950 text-xs"
                      />
                      <Button type="submit" name="nextStatus" value="paid" size="sm" className="w-full bg-green-600 hover:bg-green-500">
                        Mark Paid
                      </Button>
                      <Button type="submit" name="nextStatus" value="failed" size="sm" variant="outline" className="w-full border-red-500/40 text-red-300">
                        Mark Failed
                      </Button>
                      <Button type="submit" name="nextStatus" value="pending" size="sm" variant="outline" className="w-full border-zinc-700 text-zinc-300">
                        Reset Pending
                      </Button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section id="payout-audit" className="rounded-lg border border-zinc-800 bg-zinc-900">
        <div className="border-b border-zinc-800 px-4 py-3">
          <h2 className="text-base font-semibold text-zinc-100">Payout Audit Trail</h2>
          <p className="text-xs text-zinc-500">Immutable log of payout-status changes made by admins.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-zinc-950 text-zinc-400">
              <tr>
                <th className="px-3 py-2 text-left font-medium">When</th>
                <th className="px-3 py-2 text-left font-medium">Beta Test</th>
                <th className="px-3 py-2 text-left font-medium">Applicant</th>
                <th className="px-3 py-2 text-left font-medium">Transition</th>
                <th className="px-3 py-2 text-left font-medium">Admin</th>
                <th className="px-3 py-2 text-left font-medium">Note</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.recentPayoutAudit.length === 0 && (
                <tr>
                  <td className="px-3 py-4 text-zinc-500" colSpan={6}>
                    No payout audit entries yet.
                  </td>
                </tr>
              )}
              {snapshot.recentPayoutAudit.map((row) => (
                <tr key={row.id} className="border-t border-zinc-800">
                  <td className="px-3 py-3 text-zinc-500">{formatDate(row.createdAt)}</td>
                  <td className="px-3 py-3 text-zinc-200">{row.betaTestTitle}</td>
                  <td className="px-3 py-3 text-zinc-200">{row.applicantName ?? row.applicantUserId}</td>
                  <td className="px-3 py-3 text-zinc-300">
                    {row.previousStatus} → {row.nextStatus}
                  </td>
                  <td className="px-3 py-3 text-zinc-400">{row.adminName ?? row.adminUserId}</td>
                  <td className="px-3 py-3 text-zinc-500">{row.payoutNote ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section id="verification-queue" className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900">
          <div className="border-b border-zinc-800 px-4 py-3">
            <h2 className="text-base font-semibold text-zinc-100">
              Listing Verification Queue ({snapshot.overview.pendingVerificationListings} pending listings)
            </h2>
          </div>
          <div className="max-h-[460px] overflow-auto">
            {verificationRows.length === 0 && (
              <p className="px-4 py-4 text-sm text-zinc-500">No pending verification records.</p>
            )}
            <div className="divide-y divide-zinc-800">
              {verificationRows.map((row) => (
                <div key={row.verificationId || `${row.listingId}:${row.createdAt}`} className="px-4 py-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <Link href={`/listing/${row.listingId}`} className="text-indigo-300 hover:text-indigo-200">
                      {row.listingTitle}
                    </Link>
                    <Badge className={verificationStatusClass(row.status)}>{row.status}</Badge>
                  </div>
                  <p className="mt-1 text-zinc-400">
                    Seller: {row.sellerName ?? row.sellerId} • Method: {row.method}
                  </p>
                  {row.target && <p className="text-zinc-500">Target: {row.target}</p>}
                  {row.lastError && <p className="text-red-300">Last error: {row.lastError}</p>}
                  {row.note && <p className="text-amber-200">Note: {row.note}</p>}
                  <p className="text-xs text-zinc-500">Updated {formatDate(row.createdAt)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-900">
          <div className="border-b border-zinc-800 px-4 py-3">
            <h2 className="text-base font-semibold text-zinc-100">
              Premium Access Approvals ({snapshot.overview.acceptedPremiumApplicants})
            </h2>
          </div>
          <div className="max-h-[460px] overflow-auto">
            {premiumRows.length === 0 && (
              <p className="px-4 py-4 text-sm text-zinc-500">No accepted premium-access applicants.</p>
            )}
            <div className="divide-y divide-zinc-800">
              {premiumRows.map((row) => (
                <div key={`${row.betaTestId}:${row.applicantUserId}`} className="px-4 py-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <Link href={`/beta/${row.betaTestId}`} className="text-indigo-300 hover:text-indigo-200">
                      {row.betaTestTitle}
                    </Link>
                    <span className="text-xs text-zinc-500">{formatDate(row.approvedAt)}</span>
                  </div>
                  <p className="mt-1 text-zinc-300">{row.applicantName ?? row.applicantUserId}</p>
                  <p className="text-zinc-500">{row.applicantEmail ?? "No email captured"}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900">
          <div className="border-b border-zinc-800 px-4 py-3">
            <h2 className="text-base font-semibold text-zinc-100">Beta Reward Payments</h2>
          </div>
          <div className="max-h-[360px] overflow-auto divide-y divide-zinc-800">
            {betaPaymentRows.length === 0 && (
              <p className="px-4 py-4 text-sm text-zinc-500">No beta funding payments yet.</p>
            )}
            {betaPaymentRows.map((row) => (
              <div key={row.paymentId} className="px-4 py-3 text-sm">
                <p className="text-zinc-200">
                  {formatCurrencyMinor(row.amountMinor, row.currency)} • {row.status}
                </p>
                <p className="text-zinc-500">Creator: {row.creatorName ?? row.creatorId}</p>
                <p className="text-zinc-500">Order: {row.orderId}</p>
                <p className="text-zinc-500">{formatDate(row.createdAt)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-900">
          <div className="border-b border-zinc-800 px-4 py-3">
            <h2 className="text-base font-semibold text-zinc-100">Connect Purchases</h2>
          </div>
          <div className="max-h-[360px] overflow-auto divide-y divide-zinc-800">
            {connectPurchaseRows.length === 0 && (
              <p className="px-4 py-4 text-sm text-zinc-500">No connects purchases yet.</p>
            )}
            {connectPurchaseRows.map((row) => (
              <div key={row.id} className="px-4 py-3 text-sm">
                <p className="text-zinc-200">+{row.connects} connects</p>
                <p className="text-zinc-500">User: {row.userName ?? row.userId}</p>
                {row.description && <p className="text-zinc-500">{row.description}</p>}
                <p className="text-zinc-500">{formatDate(row.createdAt)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-900">
          <div className="border-b border-zinc-800 px-4 py-3">
            <h2 className="text-base font-semibold text-zinc-100">Interest Waitlist</h2>
          </div>
          <div className="max-h-[360px] overflow-auto divide-y divide-zinc-800">
            {interestRows.length === 0 && (
              <p className="px-4 py-4 text-sm text-zinc-500">No payment-interest signals yet.</p>
            )}
            {interestRows.map((row) => (
              <div key={row.id} className="px-4 py-3 text-sm">
                <p className="text-zinc-200">{row.feature}</p>
                <p className="text-zinc-500">User: {row.userName ?? row.userId}</p>
                <p className="text-zinc-500">
                  {row.countryCode ?? "??"} • {row.currency ?? "unknown"}
                </p>
                <p className="text-zinc-500">{formatDate(row.createdAt)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-zinc-800 bg-zinc-900">
        <div className="border-b border-zinc-800 px-4 py-3">
          <h2 className="text-base font-semibold text-zinc-100">Recent Signups</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-zinc-950 text-zinc-400">
              <tr>
                <th className="px-3 py-2 text-left font-medium">User</th>
                <th className="px-3 py-2 text-left font-medium">Clerk ID</th>
                <th className="px-3 py-2 text-left font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {recentUsers.length === 0 && (
                <tr>
                  <td className="px-3 py-4 text-zinc-500" colSpan={3}>
                    No profile records found.
                  </td>
                </tr>
              )}
              {recentUsers.map((row) => (
                <tr key={row.userId} className="border-t border-zinc-800">
                  <td className="px-3 py-3 text-zinc-200">{row.displayName ?? "Unnamed user"}</td>
                  <td className="px-3 py-3 text-zinc-500">{row.userId}</td>
                  <td className="px-3 py-3 text-zinc-500">{formatDate(row.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/shared/page-header";
import { isAdminUser } from "@/lib/admin-access";
import { getAdminDashboardSnapshot } from "@/lib/db/admin";
import { updateCashPayoutStatusAction } from "./actions";

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

export default async function AdminPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  if (!isAdminUser(userId)) notFound();

  const snapshot = await getAdminDashboardSnapshot();
  const payoutRows = [...snapshot.cashPayoutQueue].sort((a, b) => {
    const rank = (status: string) => (status === "pending" ? 0 : status === "failed" ? 1 : 2);
    const byStatus = rank(a.payoutStatus) - rank(b.payoutStatus);
    if (byStatus !== 0) return byStatus;
    return new Date(b.approvedAt).getTime() - new Date(a.approvedAt).getTime();
  });

  const verificationRows = snapshot.listingVerificationQueue.slice(0, 100);
  const premiumRows = snapshot.premiumApprovalQueue.slice(0, 100);
  const betaPaymentRows = snapshot.recentBetaPayments.slice(0, 100);
  const connectPurchaseRows = snapshot.recentConnectPurchases.slice(0, 100);
  const interestRows = snapshot.recentInterestSignals.slice(0, 100);
  const recentUsers = snapshot.recentUsers.slice(0, 100);

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
              <h2 className="text-base font-semibold text-zinc-100">Cash Payout Queue</h2>
              <p className="text-xs text-zinc-500">
                Approved cash applications. Add UTR/reason note, then mark each payout status.
              </p>
            </div>
            <Link href="/admin/payouts-export" className="shrink-0">
              <Button size="sm" variant="outline" className="border-zinc-700 text-zinc-300">
                Export CSV
              </Button>
            </Link>
          </div>
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
                    No approved cash applications yet.
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

      <section className="rounded-lg border border-zinc-800 bg-zinc-900">
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

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
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

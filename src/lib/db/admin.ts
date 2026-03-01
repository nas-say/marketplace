import "server-only";
import { createServiceClient } from "@/lib/supabase";

type PayoutStatus = "pending" | "paid" | "failed";

interface JoinedBetaTestRow {
  id?: string;
  title?: string;
  reward_type?: string;
  reward_currency?: string;
  reward_amount_minor?: number;
  reward_pool_status?: string;
  creator_id?: string;
}

interface RawCashPayoutRow {
  beta_test_id?: string;
  clerk_user_id?: string;
  applicant_email?: string | null;
  upi_id?: string | null;
  created_at?: string;
  status?: string;
  payout_status?: string | null;
  payout_paid_at?: string | null;
  payout_note?: string | null;
  beta_tests?: JoinedBetaTestRow | JoinedBetaTestRow[] | null;
}

interface RawVerificationRow {
  id?: string;
  listing_id?: string;
  seller_id?: string;
  method?: string;
  target?: string | null;
  status?: string;
  note?: string | null;
  last_error?: string | null;
  created_at?: string;
  verified_at?: string | null;
  listings?: {
    id?: string;
    title?: string;
    status?: string;
  } | null;
}

export interface AdminOverview {
  totalUsers: number;
  totalListings: number;
  activeListings: number;
  soldListings: number;
  pendingVerificationListings: number;
  totalBetaTests: number;
  openBetaTests: number;
  fundedCashBetaTests: number;
  pendingCashPools: number;
  acceptedCashApplicants: number;
  pendingCashPayouts: number;
  pendingCashPayoutAmountMinor: number;
  acceptedPremiumApplicants: number;
  manualReviewRequests: number;
}

export interface AdminCashPayoutItem {
  betaTestId: string;
  betaTestTitle: string;
  creatorId: string;
  rewardAmountMinor: number;
  rewardCurrency: string;
  rewardPoolStatus: string;
  applicantUserId: string;
  applicantName: string | null;
  applicantEmail: string | null;
  upiId: string | null;
  approvedAt: string;
  payoutStatus: PayoutStatus;
  payoutPaidAt: string | null;
  payoutNote: string | null;
}

export interface AdminPremiumApprovalItem {
  betaTestId: string;
  betaTestTitle: string;
  creatorId: string;
  applicantUserId: string;
  applicantName: string | null;
  applicantEmail: string | null;
  approvedAt: string;
}

export interface AdminListingVerificationItem {
  verificationId: string;
  listingId: string;
  listingTitle: string;
  listingStatus: string;
  sellerId: string;
  sellerName: string | null;
  method: string;
  target: string | null;
  status: string;
  note: string | null;
  lastError: string | null;
  createdAt: string;
  verifiedAt: string | null;
}

export interface AdminBetaPaymentItem {
  betaTestId: string;
  creatorId: string;
  creatorName: string | null;
  amountMinor: number;
  currency: string;
  status: string;
  paymentId: string;
  orderId: string;
  createdAt: string;
}

export interface AdminConnectPurchaseItem {
  id: string;
  userId: string;
  userName: string | null;
  connects: number;
  description: string | null;
  createdAt: string;
}

export interface AdminInterestSignalItem {
  id: string;
  userId: string;
  userName: string | null;
  feature: string;
  countryCode: string | null;
  currency: string | null;
  createdAt: string;
}

export interface AdminRecentUserItem {
  userId: string;
  displayName: string | null;
  createdAt: string;
}

export interface AdminDashboardSnapshot {
  overview: AdminOverview;
  payoutStatusTrackingAvailable: boolean;
  cashPayoutQueue: AdminCashPayoutItem[];
  premiumApprovalQueue: AdminPremiumApprovalItem[];
  listingVerificationQueue: AdminListingVerificationItem[];
  recentBetaPayments: AdminBetaPaymentItem[];
  recentConnectPurchases: AdminConnectPurchaseItem[];
  recentInterestSignals: AdminInterestSignalItem[];
  recentUsers: AdminRecentUserItem[];
}

function normalizePayoutStatus(input: unknown): PayoutStatus {
  if (input === "paid") return "paid";
  if (input === "failed") return "failed";
  return "pending";
}

function firstJoinedBetaTest(value: RawCashPayoutRow["beta_tests"]): JoinedBetaTestRow | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function isMissingColumnError(error: { code?: string } | null | undefined): boolean {
  return error?.code === "42703";
}

async function exactCount(queryPromise: PromiseLike<unknown>): Promise<number> {
  try {
    const result = (await queryPromise) as { count?: number | null; error?: unknown };
    const count = result.count;
    const error = result.error;
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

export async function getAdminDashboardSnapshot(): Promise<AdminDashboardSnapshot> {
  const client = createServiceClient();

  const [
    totalUsers,
    totalListings,
    activeListings,
    soldListings,
    pendingVerificationListings,
    totalBetaTests,
    openBetaTests,
    fundedCashBetaTests,
    pendingCashPools,
    manualReviewRequests,
  ] = await Promise.all([
    exactCount(client.from("profiles").select("id", { head: true, count: "exact" })),
    exactCount(client.from("listings").select("id", { head: true, count: "exact" })),
    exactCount(
      client.from("listings").select("id", { head: true, count: "exact" }).eq("status", "active")
    ),
    exactCount(
      client.from("listings").select("id", { head: true, count: "exact" }).eq("status", "sold")
    ),
    exactCount(
      client
        .from("listings")
        .select("id", { head: true, count: "exact" })
        .eq("status", "pending_verification")
    ),
    exactCount(client.from("beta_tests").select("id", { head: true, count: "exact" })),
    exactCount(
      client.from("beta_tests").select("id", { head: true, count: "exact" }).neq("status", "closed")
    ),
    exactCount(
      client
        .from("beta_tests")
        .select("id", { head: true, count: "exact" })
        .eq("reward_type", "cash")
        .eq("reward_pool_status", "funded")
    ),
    exactCount(
      client
        .from("beta_tests")
        .select("id", { head: true, count: "exact" })
        .eq("reward_type", "cash")
        .gt("reward_pool_total_minor", 0)
        .neq("reward_pool_status", "funded")
    ),
    exactCount(
      client
        .from("listing_ownership_verifications")
        .select("id", { head: true, count: "exact" })
        .eq("status", "manual_requested")
    ),
  ]);

  const verificationQueuePromise = client
    .from("listing_ownership_verifications")
    .select(
      "id, listing_id, seller_id, method, target, status, note, last_error, created_at, verified_at, listings(id, title, status)"
    )
    .in("status", ["pending", "manual_requested", "rejected"])
    .order("created_at", { ascending: false })
    .limit(300);

  const payoutSelectWithStatus =
    "beta_test_id, clerk_user_id, applicant_email, upi_id, created_at, status, payout_status, payout_paid_at, payout_note, beta_tests!inner(id, title, reward_type, reward_currency, reward_amount_minor, reward_pool_status, creator_id)";
  const payoutSelectLegacy =
    "beta_test_id, clerk_user_id, applicant_email, upi_id, created_at, status, beta_tests!inner(id, title, reward_type, reward_currency, reward_amount_minor, reward_pool_status, creator_id)";

  let payoutStatusTrackingAvailable = true;
  let payoutRowsRaw: RawCashPayoutRow[] = [];

  const payoutResult = await client
    .from("beta_applications")
    .select(payoutSelectWithStatus)
    .eq("status", "accepted")
    .eq("beta_tests.reward_type", "cash")
    .order("created_at", { ascending: false })
    .limit(600);

  if (!payoutResult.error) {
    payoutRowsRaw = (payoutResult.data ?? []) as RawCashPayoutRow[];
  } else if (isMissingColumnError(payoutResult.error)) {
    payoutStatusTrackingAvailable = false;
    const fallbackResult = await client
      .from("beta_applications")
      .select(payoutSelectLegacy)
      .eq("status", "accepted")
      .eq("beta_tests.reward_type", "cash")
      .order("created_at", { ascending: false })
      .limit(600);
    payoutRowsRaw = (fallbackResult.data ?? []) as RawCashPayoutRow[];
  }

  const [premiumQueueResult, verificationQueueResult, betaPaymentsResult, connectPurchasesResult, signalsResult, recentUsersResult] =
    await Promise.all([
      client
        .from("beta_applications")
        .select(
          "beta_test_id, clerk_user_id, applicant_email, created_at, beta_tests!inner(id, title, reward_type, creator_id)"
        )
        .eq("status", "accepted")
        .eq("beta_tests.reward_type", "premium_access")
        .order("created_at", { ascending: false })
        .limit(300),
      verificationQueuePromise,
      client
        .from("beta_reward_payments")
        .select("beta_test_id, creator_id, order_id, payment_id, amount_minor, currency, status, created_at")
        .order("created_at", { ascending: false })
        .limit(200),
      client
        .from("connects_transactions")
        .select("id, clerk_user_id, amount, description, created_at")
        .eq("type", "purchase_razorpay")
        .order("created_at", { ascending: false })
        .limit(200),
      client
        .from("payment_interest_signals")
        .select("id, clerk_user_id, feature, country_code, currency, created_at")
        .order("created_at", { ascending: false })
        .limit(200),
      client
        .from("profiles")
        .select("clerk_user_id, display_name, created_at")
        .order("created_at", { ascending: false })
        .limit(100),
    ]);

  const cashPayoutQueueBase = payoutRowsRaw
    .map((row): AdminCashPayoutItem | null => {
      const betaTest = firstJoinedBetaTest(row.beta_tests);
      if (!row.beta_test_id || !row.clerk_user_id || !row.created_at || !betaTest?.id || !betaTest.title) {
        return null;
      }

      return {
        betaTestId: row.beta_test_id,
        betaTestTitle: betaTest.title,
        creatorId: betaTest.creator_id ?? "",
        rewardAmountMinor: Number(betaTest.reward_amount_minor ?? 0),
        rewardCurrency: String(betaTest.reward_currency ?? "INR"),
        rewardPoolStatus: String(betaTest.reward_pool_status ?? "pending"),
        applicantUserId: row.clerk_user_id,
        applicantName: null,
        applicantEmail: typeof row.applicant_email === "string" ? row.applicant_email : null,
        upiId: typeof row.upi_id === "string" ? row.upi_id : null,
        approvedAt: row.created_at,
        payoutStatus: normalizePayoutStatus(row.payout_status),
        payoutPaidAt: typeof row.payout_paid_at === "string" ? row.payout_paid_at : null,
        payoutNote: typeof row.payout_note === "string" ? row.payout_note : null,
      };
    })
    .filter((row): row is AdminCashPayoutItem => row !== null);

  const premiumQueueBase = ((premiumQueueResult.data ?? []) as RawCashPayoutRow[])
    .map((row): AdminPremiumApprovalItem | null => {
      const betaTest = firstJoinedBetaTest(row.beta_tests);
      if (!row.beta_test_id || !row.clerk_user_id || !row.created_at || !betaTest?.title || !betaTest?.id) {
        return null;
      }
      return {
        betaTestId: row.beta_test_id,
        betaTestTitle: betaTest.title,
        creatorId: betaTest.creator_id ?? "",
        applicantUserId: row.clerk_user_id,
        applicantName: null,
        applicantEmail: typeof row.applicant_email === "string" ? row.applicant_email : null,
        approvedAt: row.created_at,
      };
    })
    .filter((row): row is AdminPremiumApprovalItem => row !== null);

  const rawVerifications = (verificationQueueResult.data ?? []) as RawVerificationRow[];
  const seenListingIds = new Set<string>();
  const listingVerificationQueueBase: AdminListingVerificationItem[] = [];

  for (const row of rawVerifications) {
    if (!row.listing_id || seenListingIds.has(row.listing_id)) continue;
    seenListingIds.add(row.listing_id);
    listingVerificationQueueBase.push({
      verificationId: row.id ?? "",
      listingId: row.listing_id,
      listingTitle: row.listings?.title ?? row.listing_id,
      listingStatus: row.listings?.status ?? "pending_verification",
      sellerId: row.seller_id ?? "",
      sellerName: null,
      method: row.method ?? "manual",
      target: typeof row.target === "string" ? row.target : null,
      status: row.status ?? "pending",
      note: typeof row.note === "string" ? row.note : null,
      lastError: typeof row.last_error === "string" ? row.last_error : null,
      createdAt: row.created_at ?? "",
      verifiedAt: typeof row.verified_at === "string" ? row.verified_at : null,
    });
  }

  const betaPaymentsBase: AdminBetaPaymentItem[] = ((betaPaymentsResult.data ?? []) as Record<string, unknown>[])
    .map((row) => ({
      betaTestId: (row.beta_test_id as string) ?? "",
      creatorId: (row.creator_id as string) ?? "",
      creatorName: null,
      amountMinor: Number(row.amount_minor ?? 0),
      currency: String(row.currency ?? "INR"),
      status: String(row.status ?? "captured"),
      paymentId: (row.payment_id as string) ?? "",
      orderId: (row.order_id as string) ?? "",
      createdAt: (row.created_at as string) ?? "",
    }))
    .filter((row) => row.betaTestId.length > 0 && row.paymentId.length > 0);

  const connectPurchasesBase: AdminConnectPurchaseItem[] = (
    (connectPurchasesResult.data ?? []) as Record<string, unknown>[]
  )
    .map((row) => ({
      id: (row.id as string) ?? "",
      userId: (row.clerk_user_id as string) ?? "",
      userName: null,
      connects: Number(row.amount ?? 0),
      description: (row.description as string | null) ?? null,
      createdAt: (row.created_at as string) ?? "",
    }))
    .filter((row) => row.id.length > 0 && row.userId.length > 0);

  const interestSignalsBase: AdminInterestSignalItem[] = ((signalsResult.data ?? []) as Record<string, unknown>[])
    .map((row) => ({
      id: (row.id as string) ?? "",
      userId: (row.clerk_user_id as string) ?? "",
      userName: null,
      feature: (row.feature as string) ?? "",
      countryCode: (row.country_code as string | null) ?? null,
      currency: (row.currency as string | null) ?? null,
      createdAt: (row.created_at as string) ?? "",
    }))
    .filter((row) => row.id.length > 0 && row.userId.length > 0);

  const recentUsers: AdminRecentUserItem[] = ((recentUsersResult.data ?? []) as Record<string, unknown>[])
    .map((row) => ({
      userId: (row.clerk_user_id as string) ?? "",
      displayName: (row.display_name as string | null) ?? null,
      createdAt: (row.created_at as string) ?? "",
    }))
    .filter((row) => row.userId.length > 0);

  const allUserIds = Array.from(
    new Set([
      ...cashPayoutQueueBase.map((row) => row.applicantUserId),
      ...cashPayoutQueueBase.map((row) => row.creatorId),
      ...premiumQueueBase.map((row) => row.applicantUserId),
      ...premiumQueueBase.map((row) => row.creatorId),
      ...listingVerificationQueueBase.map((row) => row.sellerId),
      ...betaPaymentsBase.map((row) => row.creatorId),
      ...connectPurchasesBase.map((row) => row.userId),
      ...interestSignalsBase.map((row) => row.userId),
    ].filter((value) => value.length > 0))
  );

  const nameByUserId = new Map<string, string>();
  if (allUserIds.length > 0) {
    const { data: profileRows } = await client
      .from("profiles")
      .select("clerk_user_id, display_name")
      .in("clerk_user_id", allUserIds);
    for (const row of (profileRows ?? []) as Record<string, unknown>[]) {
      const userId = row.clerk_user_id;
      const displayName = row.display_name;
      if (typeof userId === "string" && typeof displayName === "string" && displayName.trim().length > 0) {
        nameByUserId.set(userId, displayName.trim());
      }
    }
  }

  const cashPayoutQueue = cashPayoutQueueBase.map((row) => ({
    ...row,
    applicantName: nameByUserId.get(row.applicantUserId) ?? null,
  }));

  const premiumApprovalQueue = premiumQueueBase.map((row) => ({
    ...row,
    applicantName: nameByUserId.get(row.applicantUserId) ?? null,
  }));

  const listingVerificationQueue = listingVerificationQueueBase.map((row) => ({
    ...row,
    sellerName: nameByUserId.get(row.sellerId) ?? null,
  }));

  const recentBetaPayments = betaPaymentsBase.map((row) => ({
    ...row,
    creatorName: nameByUserId.get(row.creatorId) ?? null,
  }));

  const recentConnectPurchases = connectPurchasesBase.map((row) => ({
    ...row,
    userName: nameByUserId.get(row.userId) ?? null,
  }));

  const recentInterestSignals = interestSignalsBase.map((row) => ({
    ...row,
    userName: nameByUserId.get(row.userId) ?? null,
  }));

  const pendingCashPayoutRows = cashPayoutQueue.filter((row) => row.payoutStatus !== "paid");
  const pendingCashPayoutAmountMinor = pendingCashPayoutRows.reduce(
    (sum, row) => sum + Math.max(0, row.rewardAmountMinor),
    0
  );

  return {
    overview: {
      totalUsers,
      totalListings,
      activeListings,
      soldListings,
      pendingVerificationListings,
      totalBetaTests,
      openBetaTests,
      fundedCashBetaTests,
      pendingCashPools,
      acceptedCashApplicants: cashPayoutQueue.length,
      pendingCashPayouts: pendingCashPayoutRows.length,
      pendingCashPayoutAmountMinor,
      acceptedPremiumApplicants: premiumApprovalQueue.length,
      manualReviewRequests,
    },
    payoutStatusTrackingAvailable,
    cashPayoutQueue,
    premiumApprovalQueue,
    listingVerificationQueue,
    recentBetaPayments,
    recentConnectPurchases,
    recentInterestSignals,
    recentUsers,
  };
}

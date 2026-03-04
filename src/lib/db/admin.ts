import "server-only";
import { createServiceClient } from "@/lib/supabase";
import { calculateCashBetaPayout } from "@/lib/payments/beta-payouts";
import {
  BETA_REWARD_FUNDING_INTEREST_FEATURE,
  BETA_REWARD_FUNDING_WAITLIST_VIEW_FEATURE,
  CONNECTS_PAYMENT_INTEREST_FEATURE,
  CONNECTS_PAYMENT_WAITLIST_VIEW_FEATURE,
  PAYMENT_INTEREST_FEATURES,
  PAYMENT_INTEREST_MARK_FEATURES,
} from "@/lib/payments/interest-features";
import { getActiveAdminNotifications, type AdminNotificationItem } from "@/lib/db/admin-notifications";

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
  payout_gross_minor?: number | string | null;
  payout_fee_minor?: number | string | null;
  payout_net_minor?: number | string | null;
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

interface RawPayoutAuditRow {
  id?: string;
  beta_test_id?: string;
  applicant_user_id?: string;
  previous_status?: string;
  next_status?: string;
  payout_note?: string | null;
  admin_user_id?: string;
  created_at?: string;
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
  pendingCashPlatformFeeMinor: number;
  acceptedPremiumApplicants: number;
  manualReviewRequests: number;
}

export interface AdminCashPayoutItem {
  betaTestId: string;
  betaTestTitle: string;
  creatorId: string;
  payoutGrossMinor: number;
  payoutFeeMinor: number;
  payoutNetMinor: number;
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

export interface AdminMarketplaceFunnelCounts {
  listingsCreated: number;
  listingsVerified: number;
  listingUnlocks: number;
  connectPurchases: number;
}

export interface AdminBetaFunnelCounts {
  betaTestsPosted: number;
  betaApplications: number;
  betaAccepted: number;
  betaFeedbackSubmitted: number;
}

export interface AdminGrowthBreakdownItem {
  label: string;
  count: number;
}

export interface AdminWaitlistCountryConversion {
  countryCode: string;
  connectsViews: number;
  connectsInterested: number;
  betaFundingViews: number;
  betaFundingInterested: number;
}

export interface AdminWaitlistConversionSnapshot {
  connectsViews: number;
  connectsInterested: number;
  betaFundingViews: number;
  betaFundingInterested: number;
  topCountries: AdminWaitlistCountryConversion[];
}

export interface AdminGrowthFunnelSnapshot {
  shortWindowDays: number;
  longWindowDays: number;
  marketplace7d: AdminMarketplaceFunnelCounts;
  marketplace30d: AdminMarketplaceFunnelCounts;
  beta7d: AdminBetaFunnelCounts;
  beta30d: AdminBetaFunnelCounts;
  waitlistConversion: AdminWaitlistConversionSnapshot;
  topInterestCountries: AdminGrowthBreakdownItem[];
  topInterestCurrencies: AdminGrowthBreakdownItem[];
}

export interface AdminPayoutAuditItem {
  id: string;
  betaTestId: string;
  betaTestTitle: string;
  applicantUserId: string;
  applicantName: string | null;
  previousStatus: "pending" | "paid" | "failed";
  nextStatus: "pending" | "paid" | "failed";
  payoutNote: string | null;
  adminUserId: string;
  adminName: string | null;
  createdAt: string;
}

export interface AdminDashboardSnapshot {
  generatedAt: string;
  adminNotificationsAvailable: boolean;
  activeAdminNotifications: AdminNotificationItem[];
  overview: AdminOverview;
  growthFunnel: AdminGrowthFunnelSnapshot;
  payoutStatusTrackingAvailable: boolean;
  cashPayoutQueue: AdminCashPayoutItem[];
  premiumApprovalQueue: AdminPremiumApprovalItem[];
  recentPayoutAudit: AdminPayoutAuditItem[];
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

function normalizeStrictPayoutStatus(input: unknown): "pending" | "paid" | "failed" {
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

function toMinorNumber(input: unknown): number | null {
  if (typeof input === "number" && Number.isFinite(input)) return Math.max(0, Math.round(input));
  if (typeof input === "string" && input.trim().length > 0) {
    const parsed = Number(input);
    if (Number.isFinite(parsed)) return Math.max(0, Math.round(parsed));
  }
  return null;
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
  const adminNotificationsPromise = getActiveAdminNotifications(120);
  const shortWindowDays = 7;
  const longWindowDays = 30;
  const shortWindowDate = new Date(Date.now() - shortWindowDays * 24 * 60 * 60 * 1000).toISOString();
  const longWindowDate = new Date(Date.now() - longWindowDays * 24 * 60 * 60 * 1000).toISOString();

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
    listingsCreated7d,
    listingsVerified7d,
    listingUnlocks7d,
    connectPurchases7d,
    betaTestsPosted7d,
    betaApplications7d,
    betaAccepted7d,
    betaFeedbackSubmitted7d,
    listingsCreated30d,
    listingsVerified30d,
    listingUnlocks30d,
    connectPurchases30d,
    betaTestsPosted30d,
    betaApplications30d,
    betaAccepted30d,
    betaFeedbackSubmitted30d,
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
    exactCount(
      client.from("listings").select("id", { head: true, count: "exact" }).gte("created_at", shortWindowDate)
    ),
    exactCount(
      client
        .from("listings")
        .select("id", { head: true, count: "exact" })
        .eq("ownership_verified", true)
        .gte("ownership_verified_at", shortWindowDate)
    ),
    exactCount(
      client
        .from("unlocked_listings")
        .select("id", { head: true, count: "exact" })
        .gte("created_at", shortWindowDate)
    ),
    exactCount(
      client
        .from("connects_transactions")
        .select("id", { head: true, count: "exact" })
        .eq("type", "purchase_razorpay")
        .gte("created_at", shortWindowDate)
    ),
    exactCount(
      client.from("beta_tests").select("id", { head: true, count: "exact" }).gte("created_at", shortWindowDate)
    ),
    exactCount(
      client
        .from("beta_applications")
        .select("beta_test_id", { head: true, count: "exact" })
        .gte("created_at", shortWindowDate)
    ),
    exactCount(
      client
        .from("beta_applications")
        .select("beta_test_id", { head: true, count: "exact" })
        .eq("status", "accepted")
        .gte("created_at", shortWindowDate)
    ),
    exactCount(
      client.from("beta_feedback").select("id", { head: true, count: "exact" }).gte("created_at", shortWindowDate)
    ),
    exactCount(
      client.from("listings").select("id", { head: true, count: "exact" }).gte("created_at", longWindowDate)
    ),
    exactCount(
      client
        .from("listings")
        .select("id", { head: true, count: "exact" })
        .eq("ownership_verified", true)
        .gte("ownership_verified_at", longWindowDate)
    ),
    exactCount(
      client
        .from("unlocked_listings")
        .select("id", { head: true, count: "exact" })
        .gte("created_at", longWindowDate)
    ),
    exactCount(
      client
        .from("connects_transactions")
        .select("id", { head: true, count: "exact" })
        .eq("type", "purchase_razorpay")
        .gte("created_at", longWindowDate)
    ),
    exactCount(
      client.from("beta_tests").select("id", { head: true, count: "exact" }).gte("created_at", longWindowDate)
    ),
    exactCount(
      client
        .from("beta_applications")
        .select("beta_test_id", { head: true, count: "exact" })
        .gte("created_at", longWindowDate)
    ),
    exactCount(
      client
        .from("beta_applications")
        .select("beta_test_id", { head: true, count: "exact" })
        .eq("status", "accepted")
        .gte("created_at", longWindowDate)
    ),
    exactCount(
      client.from("beta_feedback").select("id", { head: true, count: "exact" }).gte("created_at", longWindowDate)
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
    "beta_test_id, clerk_user_id, applicant_email, upi_id, created_at, status, payout_status, payout_paid_at, payout_note, payout_gross_minor, payout_fee_minor, payout_net_minor, beta_tests!inner(id, title, reward_type, reward_currency, reward_amount_minor, reward_pool_status, creator_id)";
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

  const [
    premiumQueueResult,
    verificationQueueResult,
    betaPaymentsResult,
    connectPurchasesResult,
    signalsResult,
    recentUsersResult,
    payoutAuditResult,
    interestBreakdownResult,
  ] =
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
        .in("feature", PAYMENT_INTEREST_MARK_FEATURES)
        .order("created_at", { ascending: false })
        .limit(200),
      client
        .from("profiles")
        .select("clerk_user_id, display_name, created_at")
        .order("created_at", { ascending: false })
        .limit(100),
      client
        .from("beta_payout_audit_log")
        .select("id, beta_test_id, applicant_user_id, previous_status, next_status, payout_note, admin_user_id, created_at")
        .order("created_at", { ascending: false })
        .limit(200),
      client
        .from("payment_interest_signals")
        .select("feature, country_code, currency, created_at")
        .in("feature", PAYMENT_INTEREST_FEATURES)
        .gte("created_at", longWindowDate)
        .order("created_at", { ascending: false })
        .limit(2000),
    ]);

  const cashPayoutQueueBase = payoutRowsRaw
    .map((row): AdminCashPayoutItem | null => {
      const betaTest = firstJoinedBetaTest(row.beta_tests);
      if (!row.beta_test_id || !row.clerk_user_id || !row.created_at || !betaTest?.id || !betaTest.title) {
        return null;
      }

      const fallbackPayout = calculateCashBetaPayout(Number(betaTest.reward_amount_minor ?? 0));
      const payoutGrossMinor = toMinorNumber(row.payout_gross_minor) ?? fallbackPayout.grossMinor;
      const payoutFeeMinor = toMinorNumber(row.payout_fee_minor) ?? fallbackPayout.feeMinor;
      const payoutNetMinor = toMinorNumber(row.payout_net_minor) ?? fallbackPayout.netMinor;

      return {
        betaTestId: row.beta_test_id,
        betaTestTitle: betaTest.title,
        creatorId: betaTest.creator_id ?? "",
        payoutGrossMinor,
        payoutFeeMinor,
        payoutNetMinor,
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

  const payoutAuditBase = ((payoutAuditResult.data ?? []) as RawPayoutAuditRow[])
    .map((row): AdminPayoutAuditItem | null => {
      if (
        !row.id ||
        !row.beta_test_id ||
        !row.applicant_user_id ||
        !row.admin_user_id ||
        !row.created_at
      ) {
        return null;
      }
      return {
        id: row.id,
        betaTestId: row.beta_test_id,
        betaTestTitle: row.beta_test_id,
        applicantUserId: row.applicant_user_id,
        applicantName: null,
        previousStatus: normalizeStrictPayoutStatus(row.previous_status),
        nextStatus: normalizeStrictPayoutStatus(row.next_status),
        payoutNote: typeof row.payout_note === "string" ? row.payout_note : null,
        adminUserId: row.admin_user_id,
        adminName: null,
        createdAt: row.created_at,
      };
    })
    .filter((row): row is AdminPayoutAuditItem => row !== null);

  const allUserIds = Array.from(
    new Set([
      ...cashPayoutQueueBase.map((row) => row.applicantUserId),
      ...cashPayoutQueueBase.map((row) => row.creatorId),
      ...premiumQueueBase.map((row) => row.applicantUserId),
      ...premiumQueueBase.map((row) => row.creatorId),
      ...payoutAuditBase.map((row) => row.applicantUserId),
      ...payoutAuditBase.map((row) => row.adminUserId),
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

  const payoutAuditBetaTestIds = Array.from(new Set(payoutAuditBase.map((row) => row.betaTestId)));
  const titleByBetaTestId = new Map<string, string>();
  if (payoutAuditBetaTestIds.length > 0) {
    const { data: betaTestRows } = await client
      .from("beta_tests")
      .select("id, title")
      .in("id", payoutAuditBetaTestIds);
    for (const row of (betaTestRows ?? []) as Record<string, unknown>[]) {
      const id = row.id;
      const title = row.title;
      if (typeof id === "string" && typeof title === "string" && title.trim().length > 0) {
        titleByBetaTestId.set(id, title.trim());
      }
    }
  }

  const recentPayoutAudit = payoutAuditBase.map((row) => ({
    ...row,
    betaTestTitle: titleByBetaTestId.get(row.betaTestId) ?? row.betaTestId,
    applicantName: nameByUserId.get(row.applicantUserId) ?? null,
    adminName: nameByUserId.get(row.adminUserId) ?? null,
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
    (sum, row) => sum + Math.max(0, row.payoutNetMinor),
    0
  );
  const pendingCashPlatformFeeMinor = pendingCashPayoutRows.reduce(
    (sum, row) => sum + Math.max(0, row.payoutFeeMinor),
    0
  );

  const interestBreakdownRows = (interestBreakdownResult.data ?? []) as Record<string, unknown>[];
  const countryCounts = new Map<string, number>();
  const currencyCounts = new Map<string, number>();
  const waitlistCountryMap = new Map<
    string,
    { connectsViews: number; connectsInterested: number; betaFundingViews: number; betaFundingInterested: number }
  >();
  let connectsViews = 0;
  let connectsInterested = 0;
  let betaFundingViews = 0;
  let betaFundingInterested = 0;

  for (const row of interestBreakdownRows) {
    const feature = typeof row.feature === "string" ? row.feature : "";
    const country =
      typeof row.country_code === "string" && row.country_code.trim().length > 0
        ? row.country_code.trim().toUpperCase()
        : "Unknown";
    const currency =
      typeof row.currency === "string" && row.currency.trim().length > 0
        ? row.currency.trim().toUpperCase()
        : "UNKNOWN";

    if (
      feature === CONNECTS_PAYMENT_INTEREST_FEATURE ||
      feature === BETA_REWARD_FUNDING_INTEREST_FEATURE
    ) {
      countryCounts.set(country, (countryCounts.get(country) ?? 0) + 1);
      currencyCounts.set(currency, (currencyCounts.get(currency) ?? 0) + 1);
    }

    const countryRow = waitlistCountryMap.get(country) ?? {
      connectsViews: 0,
      connectsInterested: 0,
      betaFundingViews: 0,
      betaFundingInterested: 0,
    };
    if (feature === CONNECTS_PAYMENT_WAITLIST_VIEW_FEATURE) {
      countryRow.connectsViews += 1;
      connectsViews += 1;
    } else if (feature === CONNECTS_PAYMENT_INTEREST_FEATURE) {
      countryRow.connectsInterested += 1;
      connectsInterested += 1;
    } else if (feature === BETA_REWARD_FUNDING_WAITLIST_VIEW_FEATURE) {
      countryRow.betaFundingViews += 1;
      betaFundingViews += 1;
    } else if (feature === BETA_REWARD_FUNDING_INTEREST_FEATURE) {
      countryRow.betaFundingInterested += 1;
      betaFundingInterested += 1;
    }
    waitlistCountryMap.set(country, countryRow);
  }

  const topInterestCountries = Array.from(countryCounts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 8)
    .map(([label, count]) => ({ label, count }));

  const topInterestCurrencies = Array.from(currencyCounts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 8)
    .map(([label, count]) => ({ label, count }));

  const topWaitlistCountries = Array.from(waitlistCountryMap.entries())
    .filter(([, row]) => row.connectsViews + row.connectsInterested + row.betaFundingViews + row.betaFundingInterested > 0)
    .sort((a, b) => {
      const aInterested = a[1].connectsInterested + a[1].betaFundingInterested;
      const bInterested = b[1].connectsInterested + b[1].betaFundingInterested;
      if (aInterested !== bInterested) return bInterested - aInterested;

      const aViews = a[1].connectsViews + a[1].betaFundingViews;
      const bViews = b[1].connectsViews + b[1].betaFundingViews;
      if (aViews !== bViews) return bViews - aViews;

      return a[0].localeCompare(b[0]);
    })
    .slice(0, 8)
    .map(([countryCode, row]) => ({
      countryCode,
      connectsViews: row.connectsViews,
      connectsInterested: row.connectsInterested,
      betaFundingViews: row.betaFundingViews,
      betaFundingInterested: row.betaFundingInterested,
    }));

  const growthFunnel: AdminGrowthFunnelSnapshot = {
    shortWindowDays,
    longWindowDays,
    marketplace7d: {
      listingsCreated: listingsCreated7d,
      listingsVerified: listingsVerified7d,
      listingUnlocks: listingUnlocks7d,
      connectPurchases: connectPurchases7d,
    },
    marketplace30d: {
      listingsCreated: listingsCreated30d,
      listingsVerified: listingsVerified30d,
      listingUnlocks: listingUnlocks30d,
      connectPurchases: connectPurchases30d,
    },
    beta7d: {
      betaTestsPosted: betaTestsPosted7d,
      betaApplications: betaApplications7d,
      betaAccepted: betaAccepted7d,
      betaFeedbackSubmitted: betaFeedbackSubmitted7d,
    },
    beta30d: {
      betaTestsPosted: betaTestsPosted30d,
      betaApplications: betaApplications30d,
      betaAccepted: betaAccepted30d,
      betaFeedbackSubmitted: betaFeedbackSubmitted30d,
    },
    waitlistConversion: {
      connectsViews,
      connectsInterested,
      betaFundingViews,
      betaFundingInterested,
      topCountries: topWaitlistCountries,
    },
    topInterestCountries,
    topInterestCurrencies,
  };
  const persistedNotifications = await adminNotificationsPromise;

  return {
    generatedAt: new Date().toISOString(),
    adminNotificationsAvailable: persistedNotifications.available,
    activeAdminNotifications: persistedNotifications.items,
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
      pendingCashPlatformFeeMinor,
      acceptedPremiumApplicants: premiumApprovalQueue.length,
      manualReviewRequests,
    },
    growthFunnel,
    payoutStatusTrackingAvailable,
    cashPayoutQueue,
    premiumApprovalQueue,
    recentPayoutAudit,
    listingVerificationQueue,
    recentBetaPayments,
    recentConnectPurchases,
    recentInterestSignals,
    recentUsers,
  };
}

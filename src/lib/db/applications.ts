import { createServiceClient, createServerClient } from "@/lib/supabase";
import { rowToBetaTest } from "@/lib/db/beta-tests";
import type { BetaTest } from "@/types/beta-test";

type ApplyResult = { success: boolean; alreadyApplied: boolean; blockedReason?: string };
export interface CreatorBetaApplication {
  applicantUserId: string;
  applicantName: string | null;
  applicantEmail: string | null;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
}

function isMissingRpcFunctionError(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error) return false;
  if (error.code === "42883" || error.code === "PGRST202") return true;
  return typeof error.message === "string" && error.message.includes("Could not find the function");
}

async function applyToBetaTestLegacy(clerkUserId: string, betaTestId: string): Promise<ApplyResult> {
  const client = createServiceClient();

  const { data: betaTest } = await client
    .from("beta_tests")
    .select("*")
    .eq("id", betaTestId)
    .maybeSingle();

  const fundingRequired =
    betaTest &&
    betaTest.reward_type === "cash" &&
    Number(betaTest.reward_pool_total_minor ?? 0) > 0 &&
    betaTest.reward_pool_status !== "funded";

  if (fundingRequired) {
    return {
      success: false,
      alreadyApplied: false,
      blockedReason: "Applications are locked until the creator funds the reward pool.",
    };
  }

  if (
    betaTest &&
    typeof betaTest.spots_filled === "number" &&
    typeof betaTest.spots_total === "number" &&
    betaTest.spots_filled >= betaTest.spots_total
  ) {
    return { success: false, alreadyApplied: false, blockedReason: "This beta test is full." };
  }

  const { error } = await client
    .from("beta_applications")
    .insert({ clerk_user_id: clerkUserId, beta_test_id: betaTestId });

  if (error?.code === "23505") return { success: false, alreadyApplied: true };
  if (error) return { success: false, alreadyApplied: false };

  await client.rpc("increment_spots_filled", { beta_test_id: betaTestId });
  return { success: true, alreadyApplied: false };
}

export async function applyToBetaTest(
  clerkUserId: string,
  betaTestId: string
): Promise<ApplyResult> {
  const client = createServiceClient();
  const { data, error } = await client.rpc("apply_to_beta_test_atomic", {
    p_clerk_user_id: clerkUserId,
    p_beta_test_id: betaTestId,
  });

  if (!error) {
    if (data === "applied") return { success: true, alreadyApplied: false };
    if (data === "already_applied") return { success: false, alreadyApplied: true };
    if (data === "funding_locked") {
      return {
        success: false,
        alreadyApplied: false,
        blockedReason: "Applications are locked until the creator funds the reward pool.",
      };
    }
    if (data === "full") return { success: false, alreadyApplied: false, blockedReason: "This beta test is full." };
    return { success: false, alreadyApplied: false };
  }

  if (!isMissingRpcFunctionError(error)) {
    return { success: false, alreadyApplied: false };
  }

  return applyToBetaTestLegacy(clerkUserId, betaTestId);
}

export async function getUserApplicationIds(clerkUserId: string): Promise<string[]> {
  const client = await createServerClient();
  const { data, error } = await client
    .from("beta_applications")
    .select("beta_test_id")
    .eq("clerk_user_id", clerkUserId);
  if (error || !data) return [];
  return data.map((row) => row.beta_test_id as string);
}

export async function getUserApplications(
  clerkUserId: string
): Promise<Array<{ betaTestId: string; status: string; createdAt: string; betaTest: BetaTest | null }>> {
  const client = createServiceClient();
  const { data, error } = await client
    .from("beta_applications")
    .select("beta_test_id, status, created_at, beta_tests(*)")
    .eq("clerk_user_id", clerkUserId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return (data as Record<string, unknown>[]).map((row) => ({
    betaTestId: row.beta_test_id as string,
    status: row.status as string,
    createdAt: row.created_at as string,
    betaTest: (row as { beta_tests: Record<string, unknown> | null }).beta_tests
      ? rowToBetaTest((row as { beta_tests: Record<string, unknown> }).beta_tests)
      : null,
  }));
}

export async function getBetaApplicationsForCreator(
  betaTestId: string,
  creatorUserId: string
): Promise<CreatorBetaApplication[]> {
  const client = createServiceClient();

  const { data: betaTest, error: betaError } = await client
    .from("beta_tests")
    .select("id")
    .eq("id", betaTestId)
    .eq("creator_id", creatorUserId)
    .maybeSingle();

  if (betaError || !betaTest) return [];

  const { data, error } = await client
    .from("beta_applications")
    .select("clerk_user_id, status, created_at, applicant_email")
    .eq("beta_test_id", betaTestId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  const rows = data as Record<string, unknown>[];
  const applicantIds = Array.from(
    new Set(
      rows
        .map((row) => row.clerk_user_id)
        .filter((value): value is string => typeof value === "string" && value.length > 0)
    )
  );

  const nameByUserId = new Map<string, string>();
  if (applicantIds.length > 0) {
    const { data: profileRows } = await client
      .from("profiles")
      .select("clerk_user_id, display_name")
      .in("clerk_user_id", applicantIds);

    for (const profileRow of (profileRows ?? []) as Record<string, unknown>[]) {
      const clerkUserId = profileRow.clerk_user_id;
      const displayName = profileRow.display_name;
      if (typeof clerkUserId === "string" && typeof displayName === "string" && displayName.trim().length > 0) {
        nameByUserId.set(clerkUserId, displayName.trim());
      }
    }
  }

  return rows.map((row) => {
    const applicantUserId = row.clerk_user_id as string;
    const rawStatus = row.status;
    const status =
      rawStatus === "accepted" || rawStatus === "rejected" ? rawStatus : "pending";
    return {
      applicantUserId,
      applicantName: nameByUserId.get(applicantUserId) ?? null,
      applicantEmail: typeof row.applicant_email === "string" ? row.applicant_email : null,
      status,
      createdAt: row.created_at as string,
    };
  });
}

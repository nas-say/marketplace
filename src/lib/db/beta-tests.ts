import { createServerClient, createServiceClient } from "@/lib/supabase";
import { BetaTest } from "@/types/beta-test";

const SUPPORTED_REWARD_CURRENCIES = new Set(["INR", "USD", "EUR", "GBP"]);

function toRewardCurrency(value: unknown): BetaTest["reward"]["currency"] {
  if (typeof value !== "string") return "INR";
  const normalized = value.toUpperCase();
  if (SUPPORTED_REWARD_CURRENCIES.has(normalized)) {
    return normalized as BetaTest["reward"]["currency"];
  }
  return "INR";
}

function toRewardType(value: unknown): BetaTest["reward"]["type"] {
  if (value === "cash" || value === "credits" || value === "free_access") return value;
  return "cash";
}

function toPoolStatus(value: unknown): BetaTest["reward"]["poolStatus"] {
  if (value === "not_required" || value === "pending" || value === "partial" || value === "funded") {
    return value;
  }
  return "not_required";
}

function rowToBetaTest(row: Record<string, unknown>): BetaTest {
  const filled = Number(row.spots_filled ?? 0);
  const total = Number(row.spots_total ?? 20);
  let status = (row.status as BetaTest["status"]) ?? "accepting";
  // Auto-upgrade status based on fill rate if still "accepting"
  if (status === "accepting" && filled / total >= 0.8) status = "almost_full";

  const rewardAmountMinor = Number(row.reward_amount_minor ?? 0);
  const poolTotalMinor = Number(row.reward_pool_total_minor ?? 0);
  const poolFundedMinor = Number(row.reward_pool_funded_minor ?? 0);

  return {
    id: row.id as string,
    slug: row.id as string,
    title: row.title as string,
    description: (row.description as string) ?? "",
    category: (row.category as BetaTest["category"]) ?? "saas",
    platform: (row.platform as BetaTest["platform"]) ?? ["web"],
    screenshots: [],
    feedbackTypes: (row.feedback_types as BetaTest["feedbackTypes"]) ?? [],
    spots: { total, filled },
    reward: {
      type: toRewardType(row.reward_type),
      amount: rewardAmountMinor,
      description: (row.reward_description as string) ?? "",
      currency: toRewardCurrency(row.reward_currency),
      poolTotalMinor,
      poolFundedMinor,
      poolStatus: toPoolStatus(row.reward_pool_status),
    },
    testingInstructions: (row.testing_instructions as string) ?? "",
    requirements: (row.requirements as string) ?? "",
    deadline: (row.deadline as string) ?? new Date(Date.now() + 30 * 864e5).toISOString(),
    status,
    creatorId: (row.creator_id as string) ?? "",
    createdAt: row.created_at as string,
    updatedAt: (row.updated_at as string) ?? (row.created_at as string),
  };
}

export async function getBetaTests(): Promise<BetaTest[]> {
  const client = await createServerClient();
  const { data, error } = await client
    .from("beta_tests")
    .select("*")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map(rowToBetaTest);
}

export async function getActiveBetaTests(): Promise<BetaTest[]> {
  const client = await createServerClient();
  const { data, error } = await client
    .from("beta_tests")
    .select("*")
    .neq("status", "closed")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map(rowToBetaTest);
}

export async function getBetaTestById(id: string): Promise<BetaTest | null> {
  const client = await createServerClient();
  const { data, error } = await client
    .from("beta_tests")
    .select("*")
    .eq("id", id)
    .single();
  if (error || !data) return null;
  return rowToBetaTest(data);
}

export async function createBetaTest(
  clerkUserId: string,
  payload: {
    title: string;
    description: string;
    spotsTotal: number;
    rewardDescription: string;
    rewardType?: BetaTest["reward"]["type"];
    rewardCurrency?: BetaTest["reward"]["currency"];
    rewardAmountMinor?: number;
    testingInstructions: string;
    deadline: string;
  }
): Promise<{ id: string } | null> {
  const rewardType = payload.rewardType ?? "cash";
  const rewardCurrency = payload.rewardCurrency ?? "INR";
  const rewardAmountMinor = Math.max(0, payload.rewardAmountMinor ?? 0);
  const poolTotalMinor =
    rewardType === "cash" && rewardCurrency === "INR" && rewardAmountMinor > 0
      ? rewardAmountMinor * payload.spotsTotal
      : 0;
  const poolStatus: BetaTest["reward"]["poolStatus"] = poolTotalMinor > 0 ? "pending" : "not_required";

  const client = createServiceClient();
  const { data, error } = await client
    .from("beta_tests")
    .insert({
      title: payload.title,
      description: payload.description,
      spots_total: payload.spotsTotal,
      reward_description: payload.rewardDescription,
      reward_type: rewardType,
      reward_currency: rewardCurrency,
      reward_amount_minor: rewardAmountMinor,
      reward_pool_total_minor: poolTotalMinor,
      reward_pool_funded_minor: 0,
      reward_pool_status: poolStatus,
      testing_instructions: payload.testingInstructions,
      deadline: payload.deadline,
      creator_id: clerkUserId,
      status: "accepting",
    })
    .select("id")
    .single();
  if (error || !data) return null;
  return { id: data.id };
}

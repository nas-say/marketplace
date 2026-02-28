import { createServerClient, createServiceClient } from "@/lib/supabase";
import { BetaTest } from "@/types/beta-test";

function rowToBetaTest(row: Record<string, unknown>): BetaTest {
  const filled = Number(row.spots_filled ?? 0);
  const total = Number(row.spots_total ?? 20);
  let status = (row.status as BetaTest["status"]) ?? "accepting";
  // Auto-upgrade status based on fill rate if still "accepting"
  if (status === "accepting" && filled / total >= 0.8) status = "almost_full";

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
    reward: { type: "cash", amount: 0, description: (row.reward_description as string) ?? "" },
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
    testingInstructions: string;
    deadline: string;
  }
): Promise<{ id: string } | null> {
  const client = createServiceClient();
  const { data, error } = await client
    .from("beta_tests")
    .insert({
      title: payload.title,
      description: payload.description,
      spots_total: payload.spotsTotal,
      reward_description: payload.rewardDescription,
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

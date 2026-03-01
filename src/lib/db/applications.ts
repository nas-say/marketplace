import { createServiceClient, createServerClient } from "@/lib/supabase";

export async function applyToBetaTest(
  clerkUserId: string,
  betaTestId: string
): Promise<{ success: boolean; alreadyApplied: boolean; blockedReason?: string }> {
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

  const { data: existing } = await client
    .from("beta_applications")
    .select("id")
    .eq("clerk_user_id", clerkUserId)
    .eq("beta_test_id", betaTestId)
    .maybeSingle();

  if (existing) return { success: false, alreadyApplied: true };

  const { error } = await client
    .from("beta_applications")
    .insert({ clerk_user_id: clerkUserId, beta_test_id: betaTestId });

  if (!error) {
    // Increment spots_filled
    await client.rpc("increment_spots_filled", { beta_test_id: betaTestId });
  }

  return { success: !error, alreadyApplied: false };
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

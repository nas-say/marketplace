import "server-only";

import { createServiceClient } from "@/lib/supabase";

interface VelocityLimitInput {
  table: "listings" | "beta_tests" | "beta_applications";
  userColumn: string;
  userId: string;
  windowMs: number;
  maxCount: number;
}

async function countRecentRows(input: VelocityLimitInput): Promise<number> {
  const client = createServiceClient();
  const sinceIso = new Date(Date.now() - input.windowMs).toISOString();
  const { count, error } = await client
    .from(input.table)
    .select("id", { head: true, count: "exact" })
    .eq(input.userColumn, input.userId)
    .gte("created_at", sinceIso);

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

async function isRateLimited(input: VelocityLimitInput): Promise<boolean> {
  try {
    const recentCount = await countRecentRows(input);
    return recentCount >= input.maxCount;
  } catch (error) {
    // Fail open to avoid hard outages due to telemetry/DB query edge cases.
    console.error("[abuse-velocity] failed to evaluate limit", {
      table: input.table,
      userColumn: input.userColumn,
      userId: input.userId,
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

export async function isListingCreateRateLimited(userId: string): Promise<boolean> {
  return isRateLimited({
    table: "listings",
    userColumn: "seller_id",
    userId,
    windowMs: 10 * 60_000,
    maxCount: 5,
  });
}

export async function isBetaCreateRateLimited(userId: string): Promise<boolean> {
  return isRateLimited({
    table: "beta_tests",
    userColumn: "creator_id",
    userId,
    windowMs: 10 * 60_000,
    maxCount: 6,
  });
}

export async function isBetaApplyRateLimited(userId: string): Promise<boolean> {
  return isRateLimited({
    table: "beta_applications",
    userColumn: "clerk_user_id",
    userId,
    windowMs: 5 * 60_000,
    maxCount: 25,
  });
}

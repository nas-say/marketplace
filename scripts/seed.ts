/**
 * Seed script — migrates static JSON data → Supabase
 * Run: npx tsx scripts/seed.ts
 * Requires: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import listingsData from "../data/listings.json";
import betaTestsData from "../data/beta-tests.json";
import mockListingsInrData from "../data/mock-listings-inr.json";
import mockBetaTestsInrData from "../data/mock-beta-tests-inr.json";
import usersData from "../data/users.json";

config({ path: ".env" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SUPPORTED_REWARD_CURRENCIES = new Set(["INR", "USD", "EUR", "GBP"]);
const SUPPORTED_POOL_STATUSES = new Set(["not_required", "pending", "partial", "funded"]);

function toMinorNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.round(value));
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return Math.max(0, Math.round(parsed));
    }
  }
  return 0;
}

function dedupeById<T extends { id: string }>(rows: T[]): T[] {
  const byId = new Map<string, T>();
  for (const row of rows) {
    byId.set(row.id, row);
  }
  return [...byId.values()];
}

function normalizeRewardType(value: unknown): "cash" | "premium_access" {
  if (value === "cash") return "cash";
  if (value === "premium_access" || value === "free_access" || value === "credits") {
    return "premium_access";
  }
  return "cash";
}

function normalizeStatus(value: unknown): "accepting" | "almost_full" | "closed" {
  if (value === "closed") return "closed";
  if (value === "almost_full") return "almost_full";
  return "accepting";
}

// ─── Seed profiles ────────────────────────────────────────────────────────────
async function seedProfiles() {
  console.log("Seeding profiles...");
  const rows = usersData.map((u) => ({
    clerk_user_id: u.id, // uses demo IDs (usr_001 etc) — fine for seed data
    display_name: u.displayName,
    bio: u.bio,
    location: u.location,
    website: u.website || null,
    twitter: u.social?.twitter || null,
    github: u.social?.github || null,
    verified: u.verified,
    total_sales: u.stats.totalSales,
    total_earnings: u.stats.totalEarnings,
    feedback_given: u.stats.feedbackGiven,
    beta_tests_completed: u.stats.betaTestsCompleted,
    created_at: new Date(u.stats.memberSince).toISOString(),
  }));

  const { error } = await supabase.from("profiles").upsert(rows, { onConflict: "clerk_user_id" });
  if (error) console.error("profiles error:", error.message);
  else console.log(`  ✓ ${rows.length} profiles`);
}

// ─── Seed listings ────────────────────────────────────────────────────────────
async function seedListings() {
  console.log("Seeding listings...");
  const rows = dedupeById([...listingsData, ...mockListingsInrData]).map((l) => ({
    id: l.id,
    title: l.title,
    pitch: l.pitch,
    description: l.description,
    category: l.category,
    tech_stack: l.techStack,
    asking_price: l.askingPrice,
    open_to_offers: l.openToOffers,
    mrr: l.metrics.mrr,
    monthly_profit: l.metrics.monthlyProfit,
    monthly_visitors: l.metrics.monthlyVisitors,
    registered_users: l.metrics.registeredUsers,
    age: l.metrics.age,
    revenue_trend: l.metrics.revenueTrend,
    assets_included: l.assetsIncluded,
    seller_id: l.sellerId,
    status: l.status,
    featured: l.featured,
    created_at: l.createdAt,
    updated_at: l.updatedAt,
  }));

  const { error } = await supabase.from("listings").upsert(rows, { onConflict: "id" });
  if (error) console.error("listings error:", error.message);
  else console.log(`  ✓ ${rows.length} listings`);
}

// ─── Seed beta tests ──────────────────────────────────────────────────────────
async function seedBetaTests() {
  console.log("Seeding beta tests...");
  const rows = dedupeById([...betaTestsData, ...mockBetaTestsInrData]).map((bt) => {
    const reward = (bt.reward ?? {}) as Record<string, unknown>;
    const spots = (bt.spots ?? {}) as Record<string, unknown>;
    const rewardType = normalizeRewardType(reward.type);

    const currencyInput = typeof reward.currency === "string" ? reward.currency.toUpperCase() : "INR";
    const rewardCurrency = SUPPORTED_REWARD_CURRENCIES.has(currencyInput) ? currencyInput : "INR";
    const rewardAmountMinor = rewardType === "cash" ? toMinorNumber(reward.amountMinor ?? reward.amount) : 0;

    const spotsTotal = Math.max(1, Math.round(Number(spots.total ?? 0) || 1));
    const spotsFilled = Math.max(
      0,
      Math.min(spotsTotal, Math.round(Number(spots.filled ?? 0) || 0))
    );

    const seededPoolTotalMinor = toMinorNumber(reward.poolTotalMinor);
    const poolTotalMinor =
      rewardType === "cash"
        ? seededPoolTotalMinor > 0
          ? seededPoolTotalMinor
          : rewardAmountMinor * spotsTotal
        : 0;

    const seededPoolStatus = typeof reward.poolStatus === "string" ? reward.poolStatus : "";
    const normalizedPoolStatus =
      rewardType !== "cash" || poolTotalMinor <= 0
        ? "not_required"
        : SUPPORTED_POOL_STATUSES.has(seededPoolStatus)
        ? seededPoolStatus
        : "funded";

    const seededPoolFundedMinor = toMinorNumber(reward.poolFundedMinor);
    const poolFundedMinor =
      normalizedPoolStatus === "funded"
        ? poolTotalMinor
        : normalizedPoolStatus === "partial"
        ? Math.min(poolTotalMinor, Math.max(0, seededPoolFundedMinor))
        : 0;

    return {
      id: bt.id,
      title: bt.title,
      description: bt.description,
      category: bt.category,
      platform: bt.platform,
      feedback_types: bt.feedbackTypes,
      spots_total: spotsTotal,
      spots_filled: spotsFilled,
      reward_description: reward.description,
      reward_type: rewardType,
      reward_currency: rewardCurrency,
      reward_amount_minor: rewardAmountMinor,
      reward_pool_total_minor: poolTotalMinor,
      reward_pool_funded_minor: poolFundedMinor,
      reward_pool_status: normalizedPoolStatus,
      testing_instructions: bt.testingInstructions,
      requirements: bt.requirements,
      deadline: bt.deadline,
      status: normalizeStatus(bt.status),
      creator_id: bt.creatorId,
      created_at: bt.createdAt,
    };
  });

  const { error } = await supabase.from("beta_tests").upsert(rows, { onConflict: "id" });
  if (error) console.error("beta_tests error:", error.message);
  else console.log(`  ✓ ${rows.length} beta tests`);
}

async function main() {
  console.log("Starting seed...\n");
  await seedProfiles();
  await seedListings();
  await seedBetaTests();
  console.log("\nSeed complete.");
}

main().catch(console.error);

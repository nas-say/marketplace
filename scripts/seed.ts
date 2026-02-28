/**
 * Seed script — migrates static JSON data → Supabase
 * Run: npx tsx scripts/seed.ts
 * Requires: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import listingsData from "../data/listings.json";
import betaTestsData from "../data/beta-tests.json";
import usersData from "../data/users.json";

config({ path: ".env" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
  const rows = listingsData.map((l) => ({
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
  const rows = betaTestsData.map((bt) => ({
    id: bt.id,
    title: bt.title,
    description: bt.description,
    category: bt.category,
    platform: bt.platform,
    feedback_types: bt.feedbackTypes,
    spots_total: bt.spots.total,
    spots_filled: bt.spots.filled,
    reward_description: bt.reward.description,
    testing_instructions: bt.testingInstructions,
    requirements: bt.requirements,
    deadline: bt.deadline,
    status: bt.status,
    creator_id: bt.creatorId,
    created_at: bt.createdAt,
  }));

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

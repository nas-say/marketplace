import { Listing } from "@/types/listing";

export type TesterTier = "none" | "bronze" | "silver" | "gold";

export function getTesterScore(stats: {
  betaTestsCompleted: number;
  feedbackGiven: number;
}): { score: number; tier: TesterTier; label: string } {
  if (stats.betaTestsCompleted === 0 && stats.feedbackGiven === 0) {
    return { score: 0, tier: "none", label: "" };
  }

  const raw = stats.betaTestsCompleted * 10 + stats.feedbackGiven * 5;
  const score = Math.min(100, raw);
  const tier: TesterTier = score >= 61 ? "gold" : score >= 26 ? "silver" : "bronze";

  return {
    score,
    tier,
    label: `${tier.charAt(0).toUpperCase() + tier.slice(1)} Tester`,
  };
}

export function getListingCompleteness(listing: Listing): {
  score: number;
  missing: string[];
} {
  let score = 0;
  const missing: string[] = [];

  if (listing.title) score += 10;
  if ((listing.pitch?.length ?? 0) > 50) score += 5;
  else missing.push("Longer pitch (50+ chars)");
  if ((listing.description?.length ?? 0) > 200) score += 10;
  else missing.push("Detailed description");
  if (listing.category) score += 5;
  if (listing.techStack.length > 0) score += 10;
  else missing.push("Tech stack");
  if (listing.assetsIncluded.length > 0) score += 5;
  else missing.push("Assets included");
  if (listing.metrics.mrr > 0) score += 10;
  else missing.push("Monthly revenue (MRR)");
  if (listing.metrics.monthlyProfit > 0) score += 5;
  else missing.push("Monthly profit");
  if (listing.metrics.monthlyVisitors > 0) score += 5;
  else missing.push("Monthly visitors");
  if (listing.metrics.registeredUsers > 0) score += 5;
  else missing.push("Registered users");
  if (listing.ownershipVerified) score += 15;
  else missing.push("Ownership verification");
  if (listing.screenshots.length > 0) score += 10;
  else missing.push("Screenshots");

  return { score: Math.min(100, score), missing };
}

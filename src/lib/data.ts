import listingsData from "../../data/listings.json";
import betaTestsData from "../../data/beta-tests.json";
import usersData from "../../data/users.json";
import categoriesData from "../../data/categories.json";
import feedbackData from "../../data/feedback.json";
import { Listing } from "@/types/listing";
import { BetaTest } from "@/types/beta-test";
import { User } from "@/types/user";
import { Feedback } from "@/types/feedback";

export function getListings(): Listing[] {
  return listingsData as Listing[];
}

export function getFeaturedListings(): Listing[] {
  return getListings().filter((l) => l.featured);
}

export function getListingById(id: string): Listing | undefined {
  return getListings().find((l) => l.id === id);
}

export function getListingsByCategory(category: string): Listing[] {
  return getListings().filter((l) => l.category === category);
}

export function getBetaTests(): BetaTest[] {
  return betaTestsData as BetaTest[];
}

export function getActiveBetaTests(): BetaTest[] {
  return getBetaTests().filter((bt) => bt.status !== "closed");
}

export function getBetaTestById(id: string): BetaTest | undefined {
  return getBetaTests().find((bt) => bt.id === id);
}

export function getUsers(): User[] {
  return usersData as User[];
}

export function getUserById(id: string): User | undefined {
  return getUsers().find((u) => u.id === id);
}

export function getCategories() {
  return categoriesData;
}

export function getFeedback(): Feedback[] {
  return feedbackData as Feedback[];
}

export function getFeedbackByBetaTest(betaTestId: string): Feedback[] {
  return getFeedback().filter((f) => f.betaTestId === betaTestId);
}

export function formatPrice(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function formatNumber(num: number): string {
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  }
  return num.toString();
}

export function getListingsBySeller(sellerId: string): Listing[] {
  return getListings().filter((l) => l.sellerId === sellerId && l.status === "active");
}

export function getSimilarListings(listing: Listing, count = 3): Listing[] {
  return getListings()
    .filter((l) => l.id !== listing.id && l.category === listing.category && l.status === "active")
    .slice(0, count);
}

export function getRevenueMultiple(askingPrice: number, mrr: number): string {
  if (mrr === 0) return "N/A";
  const multiple = askingPrice / mrr;
  return `${multiple.toFixed(1)}×`;
}

// ── Tester Reputation Score ──────────────────────────────────────────────────

export type TesterTier = "none" | "bronze" | "silver" | "gold";

export function getTesterScore(stats: {
  betaTestsCompleted: number;
  feedbackGiven: number;
}): { score: number; tier: TesterTier; label: string } {
  if (stats.betaTestsCompleted === 0 && stats.feedbackGiven === 0)
    return { score: 0, tier: "none", label: "" };
  const raw = stats.betaTestsCompleted * 10 + stats.feedbackGiven * 5;
  const score = Math.min(100, raw);
  const tier: TesterTier = score >= 61 ? "gold" : score >= 26 ? "silver" : "bronze";
  const label = `${tier.charAt(0).toUpperCase() + tier.slice(1)} Tester`;
  return { score, tier, label };
}

// ── Listing Completeness Score ───────────────────────────────────────────────

export function getListingCompleteness(listing: Listing): {
  score: number;
  missing: string[];
} {
  let score = 0;
  const missing: string[] = [];

  if (listing.title) score += 10;
  if ((listing.pitch?.length ?? 0) > 50) score += 5; else missing.push("Longer pitch (50+ chars)");
  if ((listing.description?.length ?? 0) > 200) score += 10; else missing.push("Detailed description");
  if (listing.category) score += 5;
  if (listing.techStack.length > 0) score += 10; else missing.push("Tech stack");
  if (listing.assetsIncluded.length > 0) score += 5; else missing.push("Assets included");
  if (listing.metrics.mrr > 0) score += 10; else missing.push("Monthly revenue (MRR)");
  if (listing.metrics.monthlyProfit > 0) score += 5; else missing.push("Monthly profit");
  if (listing.metrics.monthlyVisitors > 0) score += 5; else missing.push("Monthly visitors");
  if (listing.metrics.registeredUsers > 0) score += 5; else missing.push("Registered users");
  if (listing.ownershipVerified) score += 15; else missing.push("Ownership verification");
  if (listing.screenshots.length > 0) score += 10; else missing.push("Screenshots");

  return { score: Math.min(100, score), missing };
}

"use server";

import { auth } from "@clerk/nextjs/server";
import { createListing, deleteListing } from "@/lib/db/listings";
import { createBetaTest } from "@/lib/db/beta-tests";
import { CATEGORY_LABELS } from "@/lib/constants";

const MAX_LISTING_PRICE = 10_000_000;
const MAX_MRR = 1_000_000;
const MAX_COUNTER = 100_000_000;
const MAX_BETA_REWARD_INR = 1_000_000;

function validateMoneyField(value: number, field: string, max: number): string | null {
  if (!Number.isFinite(value)) return `${field} must be a valid number.`;
  if (value < 0) return `${field} cannot be negative.`;
  if (value > max) return `${field} is too large.`;
  return null;
}

function validateCountField(value: number, field: string, max: number): string | null {
  if (!Number.isFinite(value)) return `${field} must be a valid number.`;
  if (!Number.isInteger(value)) return `${field} must be a whole number.`;
  if (value < 0) return `${field} cannot be negative.`;
  if (value > max) return `${field} is too large.`;
  return null;
}

export async function createListingAction(payload: {
  title: string;
  pitch: string;
  description: string;
  category: string;
  techStack: string[];
  askingPrice: number;
  openToOffers: boolean;
  mrr: number;
  monthlyProfit: number;
  monthlyVisitors: number;
  registeredUsers: number;
  assetsIncluded: string[];
  includeBeta: boolean;
  betaRewardType: "cash" | "premium_access";
  betaSpots: number;
  betaRewardInr: number;
  betaAccessDescription: string;
  betaInstructions: string;
  betaDeadline: string;
}): Promise<{ error?: string; listingId?: string; requiresVerification?: boolean }> {
  const { userId } = await auth();
  if (!userId) return { error: "Not authenticated" };

  const title = payload.title.trim();
  if (!title) return { error: "Project name is required." };
  if (title.length > 120) return { error: "Project name must be 120 characters or fewer." };

  const pitch = payload.pitch.trim();
  if (!pitch) return { error: "One-line pitch is required." };
  if (pitch.length > 120) return { error: "One-line pitch must be 120 characters or fewer." };

  const description = payload.description.trim();
  if (!description) return { error: "Description is required." };
  if (description.length > 10_000) return { error: "Description is too long." };

  if (!Object.prototype.hasOwnProperty.call(CATEGORY_LABELS, payload.category)) {
    return { error: "Invalid category selected." };
  }

  const askingPriceError = validateMoneyField(payload.askingPrice, "Asking price", MAX_LISTING_PRICE);
  if (askingPriceError) return { error: askingPriceError };

  const mrrError = validateMoneyField(payload.mrr, "MRR", MAX_MRR);
  if (mrrError) return { error: mrrError };

  const profitError = validateMoneyField(payload.monthlyProfit, "Monthly profit", MAX_MRR);
  if (profitError) return { error: profitError };
  if (payload.monthlyProfit > payload.mrr) {
    return { error: "Monthly profit cannot be greater than MRR." };
  }

  const visitorsError = validateCountField(payload.monthlyVisitors, "Monthly visitors", MAX_COUNTER);
  if (visitorsError) return { error: visitorsError };

  const usersError = validateCountField(payload.registeredUsers, "Registered users", MAX_COUNTER);
  if (usersError) return { error: usersError };

  const techStack = payload.techStack
    .map((tech) => tech.trim())
    .filter(Boolean)
    .slice(0, 50);
  const assetsIncluded = payload.assetsIncluded
    .map((asset) => asset.trim())
    .filter(Boolean)
    .slice(0, 50);

  const includeBeta = Boolean(payload.includeBeta);
  const betaRewardType = payload.betaRewardType === "premium_access" ? "premium_access" : "cash";
  const betaRewardInr = Number.isFinite(payload.betaRewardInr) ? payload.betaRewardInr : 0;
  const betaRewardMinor = Math.round(betaRewardInr * 100);
  const betaAccessDescription = payload.betaAccessDescription.trim();
  const betaInstructions = payload.betaInstructions.trim();
  const betaDeadline = payload.betaDeadline.trim();
  const betaSpots = Number.isFinite(payload.betaSpots) ? Math.floor(payload.betaSpots) : 0;

  if (includeBeta) {
    if (betaRewardType === "cash") {
      if (betaRewardMinor <= 0) {
        return { error: "Cash reward per tester (INR) is required when beta testing is enabled." };
      }
      if (betaRewardInr > MAX_BETA_REWARD_INR) {
        return { error: "Cash reward per tester is too large." };
      }
    } else {
      if (!betaAccessDescription) {
        return { error: "Access description is required for premium access rewards." };
      }
    }
    if (!betaDeadline) return { error: "Beta deadline is required when beta testing is enabled." };
    if (!Number.isInteger(betaSpots) || betaSpots < 1 || betaSpots > 1000) {
      return { error: "Beta spots must be between 1 and 1000." };
    }

    const parsedDeadline = new Date(betaDeadline);
    if (Number.isNaN(parsedDeadline.getTime())) {
      return { error: "Beta deadline is invalid." };
    }
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    if (parsedDeadline < now) {
      return { error: "Beta test deadline must be today or in the future." };
    }
  }

  const result = await createListing(userId, {
    title,
    pitch,
    description,
    category: payload.category,
    techStack,
    askingPrice: Math.round(payload.askingPrice * 100), // dollars → cents
    openToOffers: payload.openToOffers,
    mrr: Math.round(payload.mrr * 100),
    monthlyProfit: Math.round(payload.monthlyProfit * 100),
    monthlyVisitors: Math.floor(payload.monthlyVisitors),
    registeredUsers: Math.floor(payload.registeredUsers),
    assetsIncluded,
  });

  if (!result) return { error: "Failed to create listing. Please try again." };

  if (includeBeta) {
    let rewardDescription: string;
    if (betaRewardType === "cash") {
      const rewardDisplay = (betaRewardMinor / 100).toLocaleString("en-IN", {
        minimumFractionDigits: betaRewardMinor % 100 === 0 ? 0 : 2,
        maximumFractionDigits: 2,
      });
      rewardDescription = `INR ${rewardDisplay} cash per completed test`;
    } else {
      rewardDescription = betaAccessDescription;
    }

    const betaResult = await createBetaTest(userId, {
      title,
      description,
      spotsTotal: betaSpots || 20,
      rewardDescription,
      rewardType: betaRewardType,
      rewardCurrency: "INR",
      rewardAmountMinor: betaRewardType === "cash" ? betaRewardMinor : 0,
      testingInstructions: betaInstructions,
      deadline: betaDeadline,
    });
    if (!betaResult) {
      const rollbackOk = await deleteListing(userId, result.id);
      if (!rollbackOk) {
        console.error("[createListingAction] Listing created but beta test creation and rollback failed", {
          userId,
          listingId: result.id,
        });
        return {
          error: `Could not create beta test and automatic rollback failed for listing ${result.id}. Please remove it from your dashboard and retry.`,
        };
      }
      return { error: "Could not create beta test. Your listing was rolled back, so nothing was published." };
    }
  }

  return { listingId: result.id, requiresVerification: true };
}

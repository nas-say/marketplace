"use server";

import { auth } from "@clerk/nextjs/server";
import { createListing } from "@/lib/db/listings";
import { createBetaTest } from "@/lib/db/beta-tests";

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
  betaSpots: number;
  betaReward: string;
  betaInstructions: string;
  betaDeadline: string;
}): Promise<{ error?: string; listingId?: string }> {
  const { userId } = await auth();
  if (!userId) return { error: "Not authenticated" };

  const result = await createListing(userId, {
    title: payload.title,
    pitch: payload.pitch,
    description: payload.description,
    category: payload.category,
    techStack: payload.techStack,
    askingPrice: Math.round(payload.askingPrice * 100), // dollars → cents
    openToOffers: payload.openToOffers,
    mrr: Math.round(payload.mrr * 100),
    monthlyProfit: Math.round(payload.monthlyProfit * 100),
    monthlyVisitors: payload.monthlyVisitors,
    registeredUsers: payload.registeredUsers,
    assetsIncluded: payload.assetsIncluded,
  });

  if (!result) return { error: "Failed to create listing. Please try again." };

  if (payload.includeBeta && payload.betaReward && payload.betaDeadline) {
    await createBetaTest(userId, {
      title: payload.title,
      description: payload.description,
      spotsTotal: payload.betaSpots || 20,
      rewardDescription: payload.betaReward,
      testingInstructions: payload.betaInstructions,
      deadline: payload.betaDeadline,
    });
  }

  return { listingId: result.id };
}

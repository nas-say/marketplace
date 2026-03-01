"use server";

import { auth } from "@clerk/nextjs/server";
import { createBetaTest } from "@/lib/db/beta-tests";

export async function createBetaTestAction(payload: {
  title: string;
  description: string;
  spotsTotal: number;
  rewardDescription: string;
  rewardType: "cash" | "credits" | "free_access";
  rewardAmountInr: number;
  testingInstructions: string;
  requirements: string;
  deadline: string;
}): Promise<{ error?: string; betaTestId?: string }> {
  const { userId } = await auth();
  if (!userId) return { error: "Not authenticated" };

  const rewardAmountMinor =
    payload.rewardType === "cash" ? Math.max(0, Math.round(payload.rewardAmountInr * 100)) : 0;

  if (payload.rewardType === "cash" && rewardAmountMinor <= 0) {
    return { error: "For cash rewards, enter a valid INR amount per tester." };
  }

  const result = await createBetaTest(userId, {
    title: payload.title,
    description: payload.description,
    spotsTotal: payload.spotsTotal,
    rewardDescription: payload.rewardDescription,
    rewardType: payload.rewardType,
    rewardCurrency: "INR",
    rewardAmountMinor,
    testingInstructions: payload.testingInstructions,
    deadline: payload.deadline,
  });

  if (!result) return { error: "Failed to create beta test. Please try again." };
  return { betaTestId: result.id };
}

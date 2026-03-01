"use server";

import { auth } from "@clerk/nextjs/server";
import { createBetaTest } from "@/lib/db/beta-tests";

const MAX_TITLE_LENGTH = 120;
const MAX_DESCRIPTION_LENGTH = 10_000;
const MAX_REWARD_DESCRIPTION_LENGTH = 240;
const MAX_INSTRUCTIONS_LENGTH = 10_000;
const MAX_REQUIREMENTS_LENGTH = 1_000;
const MAX_CASH_REWARD_INR = 1_000_000;

export async function createBetaTestAction(payload: {
  title: string;
  description: string;
  spotsTotal: number;
  rewardDescription: string;
  rewardType: "cash" | "premium_access";
  rewardAmountInr: number;
  testingInstructions: string;
  requirements: string;
  deadline: string;
}): Promise<{ error?: string; betaTestId?: string }> {
  const { userId } = await auth();
  if (!userId) return { error: "Not authenticated" };

  const title = payload.title.trim();
  if (!title) return { error: "Title is required." };
  if (title.length > MAX_TITLE_LENGTH) return { error: "Title is too long." };

  const description = payload.description.trim();
  if (!description) return { error: "Description is required." };
  if (description.length > MAX_DESCRIPTION_LENGTH) return { error: "Description is too long." };

  const testingInstructions = payload.testingInstructions.trim();
  if (!testingInstructions) return { error: "Testing instructions are required." };
  if (testingInstructions.length > MAX_INSTRUCTIONS_LENGTH) {
    return { error: "Testing instructions are too long." };
  }

  const requirements = payload.requirements.trim();
  if (requirements.length > MAX_REQUIREMENTS_LENGTH) return { error: "Requirements are too long." };

  const rewardDescription = payload.rewardDescription.trim();
  if (!rewardDescription) return { error: "Reward description is required." };
  if (rewardDescription.length > MAX_REWARD_DESCRIPTION_LENGTH) {
    return { error: "Reward description is too long." };
  }

  const spotsTotal = Number.isFinite(payload.spotsTotal) ? Math.floor(payload.spotsTotal) : 0;
  if (!Number.isInteger(spotsTotal) || spotsTotal < 1 || spotsTotal > 500) {
    return { error: "Spots must be between 1 and 500." };
  }

  const deadline = payload.deadline.trim();
  if (!deadline) return { error: "Application deadline is required." };
  const deadlineDate = new Date(deadline);
  if (Number.isNaN(deadlineDate.getTime())) return { error: "Application deadline is invalid." };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (deadlineDate < today) return { error: "Application deadline must be today or later." };

  const rewardType = payload.rewardType === "premium_access" ? "premium_access" : "cash";
  const rewardAmountInr = Number.isFinite(payload.rewardAmountInr) ? payload.rewardAmountInr : 0;
  const rewardAmountMinor =
    rewardType === "cash" ? Math.max(0, Math.round(rewardAmountInr * 100)) : 0;

  if (rewardType === "cash") {
    if (rewardAmountMinor <= 0) {
      return { error: "For cash rewards, enter a valid INR amount per tester." };
    }
    if (rewardAmountInr > MAX_CASH_REWARD_INR) {
      return { error: "Cash reward amount is too large." };
    }
  }

  const result = await createBetaTest(userId, {
    title,
    description,
    spotsTotal,
    rewardDescription,
    rewardType,
    rewardCurrency: "INR",
    rewardAmountMinor,
    testingInstructions,
    deadline,
  });

  if (!result) return { error: "Failed to create beta test. Please try again." };
  return { betaTestId: result.id };
}

"use server";

import { auth } from "@clerk/nextjs/server";
import { createBetaTest } from "@/lib/db/beta-tests";

export async function createBetaTestAction(payload: {
  title: string;
  description: string;
  spotsTotal: number;
  rewardDescription: string;
  testingInstructions: string;
  requirements: string;
  deadline: string;
}): Promise<{ error?: string; betaTestId?: string }> {
  const { userId } = await auth();
  if (!userId) return { error: "Not authenticated" };

  const result = await createBetaTest(userId, {
    title: payload.title,
    description: payload.description,
    spotsTotal: payload.spotsTotal,
    rewardDescription: payload.rewardDescription,
    testingInstructions: payload.testingInstructions,
    deadline: payload.deadline,
  });

  if (!result) return { error: "Failed to create beta test. Please try again." };
  return { betaTestId: result.id };
}

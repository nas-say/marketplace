"use server";

import { auth } from "@clerk/nextjs/server";
import { applyToBetaTest } from "@/lib/db/applications";
import { redirect } from "next/navigation";

export async function applyAction(
  betaTestId: string
): Promise<{ error?: string; success?: boolean }> {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const result = await applyToBetaTest(userId, betaTestId);
  if (result.blockedReason) return { error: result.blockedReason };
  if (result.alreadyApplied) return { error: "You've already applied to this beta test." };
  if (!result.success) return { error: "Failed to apply. Please try again." };
  return { success: true };
}

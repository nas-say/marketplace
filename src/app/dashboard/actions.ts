"use server";

import { auth } from "@clerk/nextjs/server";
import { deleteListing, updateListingStatus } from "@/lib/db/listings";
import { deleteDraftBetaTest } from "@/lib/db/beta-tests";
import { revalidatePath } from "next/cache";

export async function deleteListingAction(
  listingId: string
): Promise<{ error?: string; success?: boolean }> {
  const { userId } = await auth();
  if (!userId) return { error: "Not authenticated" };
  const ok = await deleteListing(userId, listingId);
  if (!ok) return { error: "Failed to delete listing" };
  revalidatePath("/dashboard");
  return { success: true };
}

export async function markSoldAction(
  listingId: string
): Promise<{ error?: string; success?: boolean }> {
  const { userId } = await auth();
  if (!userId) return { error: "Not authenticated" };
  const ok = await updateListingStatus(userId, listingId, "sold");
  if (!ok) return { error: "Failed to update listing" };
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteDraftBetaTestAction(
  betaTestId: string
): Promise<{ error?: string; success?: boolean }> {
  const { userId } = await auth();
  if (!userId) return { error: "Not authenticated" };

  const result = await deleteDraftBetaTest(userId, betaTestId);
  if (!result.success) return { error: result.error ?? "Failed to delete draft beta test" };

  revalidatePath("/dashboard");
  revalidatePath("/beta");
  return { success: true };
}

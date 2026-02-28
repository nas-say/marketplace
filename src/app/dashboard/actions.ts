"use server";

import { auth } from "@clerk/nextjs/server";
import { deleteListing, updateListingStatus } from "@/lib/db/listings";
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

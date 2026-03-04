"use server";

import { auth } from "@clerk/nextjs/server";
import { deleteListing, updateListingStatus, featureListing } from "@/lib/db/listings";
import { deleteDraftBetaTest } from "@/lib/db/beta-tests";
import { deleteSavedSearch } from "@/lib/db/saved-searches";
import { updateOfferStatus } from "@/lib/db/offers";
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
  revalidatePath("/browse");
  return { success: true };
}

export async function markUnderOfferAction(
  listingId: string
): Promise<{ error?: string; success?: boolean }> {
  const { userId } = await auth();
  if (!userId) return { error: "Not authenticated" };
  const ok = await updateListingStatus(userId, listingId, "under_offer");
  if (!ok) return { error: "Failed to update listing" };
  revalidatePath("/dashboard");
  revalidatePath("/browse");
  revalidatePath(`/listing/${listingId}`);
  return { success: true };
}

export async function markActiveAction(
  listingId: string
): Promise<{ error?: string; success?: boolean }> {
  const { userId } = await auth();
  if (!userId) return { error: "Not authenticated" };
  const ok = await updateListingStatus(userId, listingId, "active");
  if (!ok) return { error: "Failed to update listing" };
  revalidatePath("/dashboard");
  revalidatePath("/browse");
  revalidatePath(`/listing/${listingId}`);
  return { success: true };
}

export async function boostListingAction(
  listingId: string,
  durationDays: 7 | 14 | 30
): Promise<{ error?: string; success?: boolean }> {
  const { userId } = await auth();
  if (!userId) return { error: "Not authenticated" };
  const result = await featureListing(userId, listingId, durationDays);
  if (result.error) return { error: result.error };
  revalidatePath("/dashboard");
  revalidatePath("/browse");
  revalidatePath(`/listing/${listingId}`);
  return { success: true };
}

export async function deleteSavedSearchAction(
  id: string
): Promise<{ error?: string; success?: boolean }> {
  const { userId } = await auth();
  if (!userId) return { error: "Not authenticated" };
  const ok = await deleteSavedSearch(userId, id);
  if (!ok) return { error: "Could not delete saved search." };
  revalidatePath("/dashboard");
  return { success: true };
}

export async function respondToOfferAction(
  offerId: string,
  status: "accepted" | "rejected"
): Promise<{ error?: string; success?: boolean }> {
  const { userId } = await auth();
  if (!userId) return { error: "Not authenticated" };
  const ok = await updateOfferStatus(userId, offerId, status);
  if (!ok) return { error: "Failed to update offer." };
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

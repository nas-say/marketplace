"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { deleteListing, updateListingStatus, featureListing, refreshListing } from "@/lib/db/listings";
import { deleteDraftBetaTest } from "@/lib/db/beta-tests";
import { deleteSavedSearch } from "@/lib/db/saved-searches";
import { updateOfferStatus } from "@/lib/db/offers";
import { createUserNotification } from "@/lib/db/notifications";
import { revalidatePath } from "next/cache";
import { absoluteUrl } from "@/lib/seo";

async function notifyBuyerOfOfferResponse(
  buyerId: string,
  listingTitle: string,
  status: "accepted" | "rejected"
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return;
  try {
    const clerk = await clerkClient();
    const buyer = await clerk.users.getUser(buyerId);
    const email = buyer.emailAddresses.find((e) => e.id === buyer.primaryEmailAddressId)?.emailAddress;
    if (!email) return;
    const from = process.env.INTEREST_FROM_EMAIL?.trim() || "SideFlip <onboarding@resend.dev>";
    const isAccepted = status === "accepted";
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [email],
        subject: `[SideFlip] Your offer on "${listingTitle}" was ${isAccepted ? "accepted" : "declined"}`,
        text: isAccepted
          ? `Great news! The seller has accepted your offer on "${listingTitle}".\n\nLog in to your dashboard to view the details and follow up with the seller.\n\n${absoluteUrl("/dashboard")}\n\n— The SideFlip Team`
          : `The seller has declined your offer on "${listingTitle}".\n\nYou can browse more listings at ${absoluteUrl("/browse")}\n\n— The SideFlip Team`,
      }),
    });
  } catch {
    // non-critical
  }
}

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

export async function refreshListingAction(
  listingId: string
): Promise<{ error?: string; success?: boolean }> {
  const { userId } = await auth();
  if (!userId) return { error: "Not authenticated" };
  const ok = await refreshListing(userId, listingId);
  if (!ok) return { error: "Could not refresh listing." };
  revalidatePath("/dashboard");
  revalidatePath(`/listing/${listingId}`);
  return { success: true };
}

export async function respondToOfferAction(
  offerId: string,
  status: "accepted" | "rejected"
): Promise<{ error?: string; success?: boolean }> {
  const { userId } = await auth();
  if (!userId) return { error: "Not authenticated" };
  const result = await updateOfferStatus(userId, offerId, status);
  if (!result.ok) return { error: "Failed to update offer." };
  revalidatePath("/dashboard");
  if (result.buyerId && result.listingTitle) {
    notifyBuyerOfOfferResponse(result.buyerId, result.listingTitle, status).catch(() => null);
    createUserNotification({
      clerkUserId: result.buyerId,
      type: "offer_response",
      title: `Your offer on "${result.listingTitle}" was ${status === "accepted" ? "accepted" : "declined"}`,
      message:
        status === "accepted"
          ? "Seller contact is now available on the listing page."
          : "You can submit another offer or browse similar listings.",
      href: result.listingId ? `/listing/${result.listingId}` : "/dashboard",
    }).catch(() => null);
  }
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

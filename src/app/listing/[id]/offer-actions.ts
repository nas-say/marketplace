"use server";

import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { createOffer, updateOfferStatus } from "@/lib/db/offers";
import { getListingById } from "@/lib/db/listings";
import { revalidatePath } from "next/cache";
import { absoluteUrl } from "@/lib/seo";

async function notifySellerOfOffer(
  sellerId: string,
  listingTitle: string,
  amountCents: number
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return;
  const fromEmail = process.env.INTEREST_FROM_EMAIL?.trim() || "SideFlip <onboarding@resend.dev>";
  try {
    const client = await clerkClient();
    const seller = await client.users.getUser(sellerId);
    const email = seller.emailAddresses.find(
      (e) => e.id === seller.primaryEmailAddressId
    )?.emailAddress;
    if (!email) return;
    const price = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
      amountCents / 100
    );
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: fromEmail,
        to: [email],
        subject: `[SideFlip] New offer of ${price} on "${listingTitle}"`,
        text: `Good news! You received an offer of ${price} for "${listingTitle}" on SideFlip.\n\nLog in to your dashboard to review and respond.\n\n${absoluteUrl("/dashboard")}\n\n— The SideFlip Team`,
      }),
    });
  } catch {
    // Non-critical
  }
}

export async function submitOfferAction(
  listingId: string,
  amountCents: number,
  message: string
): Promise<{ error?: string; success?: boolean }> {
  const { userId } = await auth();
  if (!userId) return { error: "Not authenticated" };

  const listing = await getListingById(listingId);
  if (!listing) return { error: "Listing not found" };
  if (!listing.openToOffers) return { error: "This listing is not accepting offers" };
  if (userId === listing.sellerId) return { error: "You cannot make an offer on your own listing" };

  if (!Number.isInteger(amountCents) || amountCents <= 0) {
    return { error: "Enter a valid offer amount." };
  }
  if (amountCents > 10_000_000 * 100) return { error: "Offer amount is too large." };

  const msg = (message ?? "").trim().slice(0, 500);
  const result = await createOffer(userId, listingId, amountCents, msg);
  if (!result) return { error: "Failed to submit offer. Please try again." };

  notifySellerOfOffer(listing.sellerId, listing.title, amountCents).catch(() => null);

  revalidatePath(`/listing/${listingId}`);
  return { success: true };
}

export async function respondToOfferAction(
  offerId: string,
  status: "accepted" | "rejected"
): Promise<{ error?: string; success?: boolean }> {
  const { userId } = await auth();
  if (!userId) return { error: "Not authenticated" };

  const ok = await updateOfferStatus(userId, offerId, status);
  if (!ok) return { error: "Failed to update offer. Please try again." };

  revalidatePath("/dashboard");
  return { success: true };
}

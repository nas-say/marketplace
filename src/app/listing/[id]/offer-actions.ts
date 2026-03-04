"use server";

import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { createOffer, updateOfferStatus } from "@/lib/db/offers";
import { getListingById } from "@/lib/db/listings";
import { isListingUnlocked } from "@/lib/db/connects";
import { createUserNotification } from "@/lib/db/notifications";
import { revalidatePath } from "next/cache";
import { absoluteUrl } from "@/lib/seo";

async function notifySellerOfOffer(
  sellerId: string,
  listingTitle: string,
  amountCents: number | null,
  contactMode: "direct" | "proposal"
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
    const price =
      typeof amountCents === "number"
        ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
            amountCents / 100
          )
        : null;
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: fromEmail,
        to: [email],
        subject:
          contactMode === "proposal"
            ? `[SideFlip] New buyer proposal on "${listingTitle}"`
            : `[SideFlip] New offer${price ? ` of ${price}` : ""} on "${listingTitle}"`,
        text:
          contactMode === "proposal"
            ? `A buyer unlocked your listing "${listingTitle}" and sent a proposal request${price ? ` with an offer of ${price}` : ""}.\n\nAccept to reveal your contact details to this buyer.\n\n${absoluteUrl("/dashboard")}\n\n— The SideFlip Team`
            : `Good news! You received an offer${price ? ` of ${price}` : ""} for "${listingTitle}" on SideFlip.\n\nLog in to your dashboard to review and respond.\n\n${absoluteUrl("/dashboard")}\n\n— The SideFlip Team`,
      }),
    });
  } catch {
    // Non-critical
  }
}

export async function submitOfferAction(
  listingId: string,
  amountCents: number | null,
  message: string
): Promise<{ error?: string; success?: boolean }> {
  const { userId } = await auth();
  if (!userId) return { error: "Not authenticated" };

  const listing = await getListingById(listingId);
  if (!listing) return { error: "Listing not found" };
  if (listing.contactMode === "direct" && !listing.openToOffers) {
    return { error: "This listing is not accepting offers" };
  }
  if (userId === listing.sellerId) return { error: "You cannot make an offer on your own listing" };
  if (listing.contactMode === "proposal") {
    const unlocked = await isListingUnlocked(userId, listingId);
    if (!unlocked) return { error: "Unlock this listing before sending a proposal." };
  }

  const msg = (message ?? "").trim().slice(0, 500);
  const normalizedAmount =
    typeof amountCents === "number" && Number.isFinite(amountCents)
      ? Math.round(amountCents)
      : null;

  if (listing.contactMode === "proposal" && !msg) {
    return { error: "Please include a short message for the seller." };
  }

  if (normalizedAmount !== null && (!Number.isInteger(normalizedAmount) || normalizedAmount <= 0)) {
    return { error: "Enter a valid offer amount." };
  }
  if (normalizedAmount !== null && normalizedAmount > 10_000_000 * 100) {
    return { error: "Offer amount is too large." };
  }

  if (listing.contactMode === "direct" && normalizedAmount === null) {
    return { error: "Enter a valid offer amount." };
  }

  const result = await createOffer(userId, listingId, normalizedAmount, msg);
  if (!result) return { error: "Failed to submit offer. Please try again." };

  notifySellerOfOffer(listing.sellerId, listing.title, normalizedAmount, listing.contactMode).catch(() => null);
  createUserNotification({
    clerkUserId: listing.sellerId,
    type: listing.contactMode === "proposal" ? "proposal_received" : "offer_received",
    title:
      listing.contactMode === "proposal"
        ? `New proposal request on "${listing.title}"`
        : `New offer on "${listing.title}"`,
    message:
      normalizedAmount != null
        ? `Buyer offered ${new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(normalizedAmount / 100)}.`
        : "Buyer sent a proposal message.",
    href: "/dashboard",
  }).catch(() => null);

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
  if (!result.ok) return { error: "Failed to update offer. Please try again." };

  revalidatePath("/dashboard");
  return { success: true };
}

"use server";

import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import {
  claimSignupGift,
  ConnectsTransaction,
  getConnectsTransactions,
  unlockListing,
  getUnlockCost,
  SIGNUP_GIFT_CONNECTS,
} from "@/lib/db/connects";
import { getListingById } from "@/lib/db/listings";
import { createUserNotification } from "@/lib/db/notifications";
import { revalidatePath } from "next/cache";
import { absoluteUrl } from "@/lib/seo";

async function notifySellerOfUnlock(
  sellerId: string,
  listingTitle: string,
  contactMode: "direct" | "proposal"
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const fromEmail = process.env.INTEREST_FROM_EMAIL?.trim() || "SideFlip <onboarding@resend.dev>";
  if (!apiKey) return;

  try {
    const client = await clerkClient();
    const seller = await client.users.getUser(sellerId);
    const email = seller.emailAddresses.find((e) => e.id === seller.primaryEmailAddressId)?.emailAddress;
    if (!email) return;

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: fromEmail,
        to: [email],
        subject: `[SideFlip] A buyer is interested in "${listingTitle}"`,
        text:
          contactMode === "proposal"
            ? `A buyer just unlocked your listing "${listingTitle}" and can now send you a proposal request.\n\nReview incoming proposals in your dashboard. Contact details are revealed to buyers only after you accept.\n\n${absoluteUrl("/dashboard")}\n\n— The SideFlip Team`
            : `Great news! A buyer just unlocked your listing "${listingTitle}" on SideFlip.\n\nThey can now see your contact details and may reach out to move forward.\n\nView your listing analytics: ${absoluteUrl("/dashboard")}\n\n— The SideFlip Team`,
      }),
    });
  } catch {
    // Non-critical — don't let notification failure break the unlock
  }
}

export async function giftConnectsAction(): Promise<{
  error?: string;
  claimed: boolean;
  amount: number;
}> {
  const { userId } = await auth();
  if (!userId) {
    return { error: "Not authenticated", claimed: false, amount: SIGNUP_GIFT_CONNECTS };
  }

  const result = await claimSignupGift(userId);
  if (result.error) {
    return { error: result.error, claimed: false, amount: SIGNUP_GIFT_CONNECTS };
  }

  revalidatePath("/connects");
  return { claimed: result.claimed, amount: SIGNUP_GIFT_CONNECTS };
}

export async function unlockListingAction(listingId: string): Promise<{ error?: string }> {
  const { userId } = await auth();
  if (!userId) return { error: "Not authenticated" };

  // Cost is always computed server-side from the real listing price — never trusted from client
  const listing = await getListingById(listingId);
  if (!listing) return { error: "Listing not found." };
  const cost = getUnlockCost(listing.askingPrice);

  const result = await unlockListing(userId, listingId, cost);
  if (!result.error) {
    revalidatePath(`/listing/${listingId}`);
    revalidatePath("/connects");
    // Fire-and-forget seller notification
    notifySellerOfUnlock(listing.sellerId, listing.title, listing.contactMode).catch(() => null);
    createUserNotification({
      clerkUserId: listing.sellerId,
      type: "listing_unlocked",
      title: `A buyer unlocked "${listing.title}"`,
      message:
        listing.contactMode === "proposal"
          ? "Review proposals in your dashboard. Contact is revealed after you accept."
          : "Buyer can now view your contact details.",
      href: "/dashboard",
    }).catch(() => null);
  }
  return result;
}

export async function getMoreConnectsTransactionsAction(
  offset: number
): Promise<{ transactions: ConnectsTransaction[]; hasMore: boolean; error?: string }> {
  const { userId } = await auth();
  if (!userId) {
    return { transactions: [], hasMore: false, error: "Not authenticated" };
  }

  const safeOffset = Number.isFinite(offset) ? Math.max(0, Math.floor(offset)) : 0;
  const pageSize = 20;
  const rows = await getConnectsTransactions(userId, {
    limit: pageSize + 1,
    offset: safeOffset,
  });

  return {
    transactions: rows.slice(0, pageSize),
    hasMore: rows.length > pageSize,
  };
}

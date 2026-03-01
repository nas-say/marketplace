"use server";

import { auth } from "@clerk/nextjs/server";
import {
  claimSignupGift,
  unlockListing,
  getUnlockCost,
  SIGNUP_GIFT_CONNECTS,
} from "@/lib/db/connects";
import { getListingById } from "@/lib/db/listings";
import { revalidatePath } from "next/cache";

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
  }
  return result;
}

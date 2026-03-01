"use server";

import { auth } from "@clerk/nextjs/server";
import { addConnects, unlockListing, getUnlockCost } from "@/lib/db/connects";
import { getListingById } from "@/lib/db/listings";
import { revalidatePath } from "next/cache";

export async function giftConnectsAction(amount: number): Promise<{ error?: string }> {
  const { userId } = await auth();
  if (!userId) return { error: "Not authenticated" };
  await addConnects(userId, amount, "gift", `Early access gift: ${amount} connects`);
  revalidatePath("/connects");
  return {};
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

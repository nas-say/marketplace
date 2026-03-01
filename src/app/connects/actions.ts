"use server";

import { auth } from "@clerk/nextjs/server";
import { addConnects, unlockListing } from "@/lib/db/connects";
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
  const result = await unlockListing(userId, listingId);
  if (!result.error) {
    revalidatePath(`/listing/${listingId}`);
    revalidatePath("/connects");
  }
  return result;
}

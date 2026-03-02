"use server";

import { auth } from "@clerk/nextjs/server";
import { updateListing } from "@/lib/db/listings";
import { revalidatePath } from "next/cache";

export async function updateListingAction(
  listingId: string,
  payload: {
    title: string; pitch: string; description: string; category: string;
    techStack: string[]; askingPrice: number; openToOffers: boolean;
    mrr: number; monthlyProfit: number; monthlyVisitors: number;
    registeredUsers: number; assetsIncluded: string[];
  }
): Promise<{ error?: string; success?: boolean }> {
  const { userId } = await auth();
  if (!userId) return { error: "Not authenticated" };

  const ok = await updateListing(userId, listingId, payload);
  if (!ok) return { error: "Failed to update. You may not have permission." };

  revalidatePath(`/listing/${listingId}`);
  revalidatePath("/dashboard");
  return { success: true };
}

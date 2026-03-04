"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { createSavedSearch, deleteSavedSearch } from "@/lib/db/saved-searches";

export async function createSavedSearchAction(
  category: string | null,
  maxPriceCents: number | null
): Promise<{ error?: string; success?: boolean }> {
  const { userId } = await auth();
  if (!userId) return { error: "Sign in to save searches." };

  const clerkUser = await currentUser();
  const email = clerkUser?.emailAddresses?.[0]?.emailAddress;
  if (!email) return { error: "Could not determine your email address." };

  const result = await createSavedSearch(userId, email, category, maxPriceCents);
  if (!result) return { error: "Could not save your search. Please try again." };
  return { success: true };
}

export async function deleteSavedSearchAction(
  id: string
): Promise<{ error?: string; success?: boolean }> {
  const { userId } = await auth();
  if (!userId) return { error: "Not authenticated." };

  const ok = await deleteSavedSearch(userId, id);
  if (!ok) return { error: "Could not delete saved search." };
  return { success: true };
}

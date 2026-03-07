"use server";

import { auth } from "@clerk/nextjs/server";
import { toggleWatchlist, getWatchlistIds, mergeWatchlistIds } from "@/lib/db/watchlist";

export async function toggleWatchlistAction(listingId: string): Promise<boolean | null> {
  const { userId } = await auth();
  if (!userId) return null;
  try {
    return await toggleWatchlist(userId, listingId);
  } catch (error) {
    console.error("[watchlist] toggle failed", {
      userId,
      listingId,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

export async function getWatchlistIdsAction(): Promise<string[] | null> {
  const { userId } = await auth();
  if (!userId) return null;
  return getWatchlistIds(userId);
}

export async function mergeWatchlistIdsAction(
  listingIds: string[]
): Promise<string[] | null> {
  const { userId } = await auth();
  if (!userId) return null;
  try {
    return await mergeWatchlistIds(userId, listingIds);
  } catch (error) {
    console.error("[watchlist] merge failed", {
      userId,
      listingCount: listingIds.length,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

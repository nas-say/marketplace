import { createServerClient, createServiceClient } from "@/lib/supabase";

export async function getWatchlistIds(clerkUserId: string): Promise<string[]> {
  const client = await createServerClient();
  const { data, error } = await client
    .from("watchlist")
    .select("listing_id")
    .eq("clerk_user_id", clerkUserId);
  if (error || !data) return [];
  return data.map((row) => row.listing_id as string);
}

export async function mergeWatchlistIds(
  clerkUserId: string,
  listingIds: string[]
): Promise<string[]> {
  const normalizedIds = Array.from(
    new Set(listingIds.map((id) => id.trim()).filter((id) => id.length > 0))
  );

  if (normalizedIds.length === 0) {
    return getWatchlistIds(clerkUserId);
  }

  const client = createServiceClient();
  const { data: listings, error: listingError } = await client
    .from("listings")
    .select("id")
    .in("id", normalizedIds);

  if (listingError) {
    throw new Error("Could not sync watchlist state.");
  }

  const validIds = (listings ?? []).map((row) => row.id as string);
  if (validIds.length === 0) {
    return getWatchlistIds(clerkUserId);
  }

  const { error: upsertError } = await client.from("watchlist").upsert(
    validIds.map((listingId) => ({
      clerk_user_id: clerkUserId,
      listing_id: listingId,
    })),
    { onConflict: "clerk_user_id,listing_id", ignoreDuplicates: true }
  );

  if (upsertError) {
    throw new Error("Could not sync watchlist state.");
  }

  return getWatchlistIds(clerkUserId);
}

export async function toggleWatchlist(
  clerkUserId: string,
  listingId: string
): Promise<boolean> {
  const client = createServiceClient();

  // Delete-first toggle removes the explicit read-before-write race.
  // If a row existed, it is removed; if not, we upsert it.
  const { data: removedRows, error: deleteError } = await client
    .from("watchlist")
    .delete()
    .eq("clerk_user_id", clerkUserId)
    .eq("listing_id", listingId)
    .select("listing_id");

  if (deleteError) {
    throw new Error("Could not update watchlist state.");
  }

  if ((removedRows ?? []).length > 0) {
    return false;
  }

  const { error: upsertError } = await client.from("watchlist").upsert(
    { clerk_user_id: clerkUserId, listing_id: listingId },
    { onConflict: "clerk_user_id,listing_id", ignoreDuplicates: true }
  );
  if (upsertError) {
    throw new Error("Could not update watchlist state.");
  }
  return true;
}

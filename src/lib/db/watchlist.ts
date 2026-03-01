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

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

  // Check if exists
  const { data: existing } = await client
    .from("watchlist")
    .select("listing_id")
    .eq("clerk_user_id", clerkUserId)
    .eq("listing_id", listingId)
    .maybeSingle();

  if (existing) {
    await client
      .from("watchlist")
      .delete()
      .eq("clerk_user_id", clerkUserId)
      .eq("listing_id", listingId);
    return false; // removed
  } else {
    await client.from("watchlist").insert({ clerk_user_id: clerkUserId, listing_id: listingId });
    return true; // added
  }
}

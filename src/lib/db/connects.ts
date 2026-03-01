import { createServiceClient } from "@/lib/supabase";

/**
 * Returns the number of connects required to unlock a listing.
 * - $0–$9    → 2 connects
 * - $10–$49  → 5 connects per $10 (5 / 10 / 15 / 20)
 * - $50+     → 7.5% of asking price in USD, floored at 25, no cap
 *   (7.5% formula naturally exceeds 25 at ~$333, so it scales freely above that)
 */
export function getUnlockCost(askingPriceInCents: number): number {
  const usd = askingPriceInCents / 100;
  if (usd < 10) return 2;
  if (usd < 50) return Math.floor(usd / 10) * 5;
  return Math.max(25, Math.round(usd * 0.075));
}

export async function getConnectsBalance(clerkUserId: string): Promise<number> {
  const client = createServiceClient();
  const { data } = await client
    .from("connects_balance")
    .select("balance")
    .eq("clerk_user_id", clerkUserId)
    .maybeSingle();
  return (data as { balance: number } | null)?.balance ?? 0;
}

export async function isListingUnlocked(clerkUserId: string, listingId: string): Promise<boolean> {
  const client = createServiceClient();
  const { data } = await client
    .from("unlocked_listings")
    .select("clerk_user_id")
    .eq("clerk_user_id", clerkUserId)
    .eq("listing_id", listingId)
    .maybeSingle();
  return !!data;
}

export async function unlockListing(
  clerkUserId: string,
  listingId: string,
  cost: number
): Promise<{ error?: string }> {
  const client = createServiceClient();

  const already = await isListingUnlocked(clerkUserId, listingId);
  if (already) return {};

  const balance = await getConnectsBalance(clerkUserId);
  if (balance < cost) {
    return { error: `Not enough connects. This listing requires ${cost} connects to unlock.` };
  }

  await client.from("connects_balance").upsert(
    { clerk_user_id: clerkUserId, balance: balance - cost, updated_at: new Date().toISOString() },
    { onConflict: "clerk_user_id" }
  );

  await client.from("connects_transactions").insert({
    clerk_user_id: clerkUserId,
    amount: -cost,
    type: "unlock",
    description: "Seller info unlocked",
    listing_id: listingId,
  });

  await client.from("unlocked_listings").insert({
    clerk_user_id: clerkUserId,
    listing_id: listingId,
  });

  return {};
}

export async function addConnects(
  clerkUserId: string,
  amount: number,
  type: string,
  description: string
): Promise<void> {
  const client = createServiceClient();
  const balance = await getConnectsBalance(clerkUserId);

  await client.from("connects_balance").upsert(
    { clerk_user_id: clerkUserId, balance: balance + amount, updated_at: new Date().toISOString() },
    { onConflict: "clerk_user_id" }
  );

  await client.from("connects_transactions").insert({
    clerk_user_id: clerkUserId,
    amount,
    type,
    description,
  });
}

export async function getConnectsTransactions(clerkUserId: string): Promise<
  Array<{ id: string; amount: number; type: string; description: string | null; createdAt: string }>
> {
  const client = createServiceClient();
  const { data } = await client
    .from("connects_transactions")
    .select("id, amount, type, description, created_at")
    .eq("clerk_user_id", clerkUserId)
    .order("created_at", { ascending: false })
    .limit(20);
  if (!data) return [];
  return (data as Record<string, unknown>[]).map((row) => ({
    id: row.id as string,
    amount: row.amount as number,
    type: row.type as string,
    description: row.description as string | null,
    createdAt: row.created_at as string,
  }));
}

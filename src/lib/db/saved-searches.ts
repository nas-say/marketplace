import { createServiceClient } from "@/lib/supabase";

export interface SavedSearch {
  id: string;
  clerkUserId: string;
  email: string;
  category: string | null;
  maxPriceCents: number | null;
  lastNotifiedAt: string | null;
  createdAt: string;
}

function rowToSavedSearch(row: Record<string, unknown>): SavedSearch {
  return {
    id: row.id as string,
    clerkUserId: row.clerk_user_id as string,
    email: row.email as string,
    category: (row.category as string) ?? null,
    maxPriceCents: row.max_price_cents != null ? Number(row.max_price_cents) : null,
    lastNotifiedAt: (row.last_notified_at as string) ?? null,
    createdAt: row.created_at as string,
  };
}

export async function createSavedSearch(
  clerkUserId: string,
  email: string,
  category: string | null,
  maxPriceCents: number | null
): Promise<{ id: string } | null> {
  const client = createServiceClient();
  const { data, error } = await client
    .from("saved_searches")
    .insert({
      clerk_user_id: clerkUserId,
      email,
      category: category || null,
      max_price_cents: maxPriceCents || null,
    })
    .select("id")
    .single();
  if (error || !data) return null;
  return { id: (data as { id: string }).id };
}

export async function getSavedSearchesByUser(clerkUserId: string): Promise<SavedSearch[]> {
  const client = createServiceClient();
  const { data, error } = await client
    .from("saved_searches")
    .select("*")
    .eq("clerk_user_id", clerkUserId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(rowToSavedSearch);
}

export async function deleteSavedSearch(
  clerkUserId: string,
  id: string
): Promise<boolean> {
  const client = createServiceClient();
  const { error } = await client
    .from("saved_searches")
    .delete()
    .eq("id", id)
    .eq("clerk_user_id", clerkUserId);
  return !error;
}

export async function getAllPendingSavedSearches(): Promise<SavedSearch[]> {
  const client = createServiceClient();
  const { data, error } = await client
    .from("saved_searches")
    .select("*")
    .or("last_notified_at.is.null,last_notified_at.lt." + new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString());
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(rowToSavedSearch);
}

export async function markSavedSearchesNotified(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const client = createServiceClient();
  await client
    .from("saved_searches")
    .update({ last_notified_at: new Date().toISOString() })
    .in("id", ids);
}

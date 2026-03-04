import { createServerClient, createServiceClient } from "@/lib/supabase";
import { Listing } from "@/types/listing";
import { mutateBalanceAtomic } from "@/lib/db/connects";

const FEATURE_COSTS: Record<7 | 14 | 30, number> = { 7: 5, 14: 8, 30: 15 };

// Map Supabase row → Listing type used throughout the app
function rowToListing(row: Record<string, unknown>): Listing {
  return {
    id: row.id as string,
    slug: row.id as string,
    title: row.title as string,
    pitch: row.pitch as string,
    description: (row.description as string) ?? "",
    category: row.category as Listing["category"],
    techStack: (row.tech_stack as string[]) ?? [],
    screenshots: (row.screenshots as string[]) ?? [],
    askingPrice: Number(row.asking_price),
    openToOffers: Boolean(row.open_to_offers),
    contactMode: (row.contact_mode as Listing["contactMode"]) ?? "direct",
    metrics: {
      mrr: Number(row.mrr),
      monthlyProfit: Number(row.monthly_profit),
      monthlyVisitors: Number(row.monthly_visitors),
      registeredUsers: Number(row.registered_users),
      age: (row.age as string) ?? "<6mo",
      revenueTrend: (row.revenue_trend as Listing["metrics"]["revenueTrend"]) ?? "flat",
    },
    assetsIncluded: (row.assets_included as string[]) ?? [],
    sellerId: (row.seller_id as string) ?? "",
    status: (row.status as Listing["status"]) ?? "active",
    ownershipVerified: Boolean(row.ownership_verified),
    ownershipVerificationMethod:
      (row.ownership_verification_method as Listing["ownershipVerificationMethod"]) ?? null,
    ownershipVerifiedAt: (row.ownership_verified_at as string) ?? null,
    featured: Boolean(row.featured),
    featuredUntil: (row.featured_until as string) ?? null,
    createdAt: row.created_at as string,
    updatedAt: (row.updated_at as string) ?? (row.created_at as string),
  };
}

const PUBLIC_STATUSES = ["active", "under_offer"] as const;

export async function getListings(): Promise<Listing[]> {
  const client = await createServerClient();
  const { data, error } = await client
    .from("listings")
    .select("*")
    .in("status", PUBLIC_STATUSES)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map(rowToListing);
}

export async function getFeaturedListings(): Promise<Listing[]> {
  const client = await createServerClient();
  const { data, error } = await client
    .from("listings")
    .select("*")
    .in("status", PUBLIC_STATUSES)
    .eq("featured", true)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map(rowToListing);
}

export async function getListingById(id: string): Promise<Listing | null> {
  const client = await createServerClient();
  const { data, error } = await client
    .from("listings")
    .select("*")
    .eq("id", id)
    .single();
  if (error || !data) return null;
  return rowToListing(data);
}

export async function getListingByIdForSeller(
  clerkUserId: string,
  id: string
): Promise<Listing | null> {
  const client = createServiceClient();
  const { data, error } = await client
    .from("listings")
    .select("*")
    .eq("id", id)
    .eq("seller_id", clerkUserId)
    .maybeSingle();
  if (error || !data) return null;
  return rowToListing(data);
}

export async function getListingsBySeller(sellerId: string): Promise<Listing[]> {
  const client = await createServerClient();
  const { data, error } = await client
    .from("listings")
    .select("*")
    .eq("seller_id", sellerId)
    .eq("status", "active")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map(rowToListing);
}

export async function getSimilarListings(listing: Listing, count = 3): Promise<Listing[]> {
  const client = await createServerClient();
  const { data, error } = await client
    .from("listings")
    .select("*")
    .in("status", PUBLIC_STATUSES)
    .eq("category", listing.category)
    .neq("id", listing.id)
    .limit(count);
  if (error || !data) return [];
  return data.map(rowToListing);
}

export async function getAllListingsBySeller(sellerId: string): Promise<Listing[]> {
  const client = createServiceClient();
  const { data, error } = await client
    .from("listings")
    .select("*")
    .eq("seller_id", sellerId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map(rowToListing);
}

export async function updateListing(
  clerkUserId: string,
  listingId: string,
  payload: {
    title: string; pitch: string; description: string; category: string;
    techStack: string[]; askingPrice: number; openToOffers: boolean;
    contactMode: Listing["contactMode"];
    mrr: number; monthlyProfit: number; monthlyVisitors: number;
    registeredUsers: number; assetsIncluded: string[]; screenshots: string[];
  }
): Promise<boolean> {
  const client = createServiceClient();
  const { error } = await client.from("listings").update({
    title: payload.title, pitch: payload.pitch, description: payload.description,
    category: payload.category, tech_stack: payload.techStack,
    asking_price: payload.askingPrice, open_to_offers: payload.openToOffers,
    contact_mode: payload.contactMode,
    mrr: payload.mrr, monthly_profit: payload.monthlyProfit,
    monthly_visitors: payload.monthlyVisitors, registered_users: payload.registeredUsers,
    assets_included: payload.assetsIncluded, screenshots: payload.screenshots,
  }).eq("id", listingId).eq("seller_id", clerkUserId);
  return !error;
}

export async function updateListingStatus(
  clerkUserId: string,
  listingId: string,
  status: "active" | "sold" | "draft" | "pending_verification" | "under_offer"
): Promise<boolean> {
  const client = createServiceClient();
  const { error } = await client.from("listings").update({ status })
    .eq("id", listingId).eq("seller_id", clerkUserId);
  return !error;
}

export async function deleteListing(
  clerkUserId: string,
  listingId: string
): Promise<boolean> {
  const client = createServiceClient();
  const { error } = await client.from("listings").delete()
    .eq("id", listingId).eq("seller_id", clerkUserId);
  return !error;
}

export async function createListing(
  clerkUserId: string,
  payload: {
    title: string;
    pitch: string;
    description: string;
    category: string;
    techStack: string[];
    askingPrice: number;
    openToOffers: boolean;
    contactMode: Listing["contactMode"];
    mrr: number;
    monthlyProfit: number;
    monthlyVisitors: number;
    registeredUsers: number;
    assetsIncluded: string[];
    screenshots?: string[];
  }
): Promise<{ id: string } | null> {
  const client = createServiceClient();
  const { data, error } = await client
    .from("listings")
    .insert({
      title: payload.title,
      pitch: payload.pitch,
      description: payload.description,
      category: payload.category,
      tech_stack: payload.techStack,
      asking_price: payload.askingPrice,
      open_to_offers: payload.openToOffers,
      contact_mode: payload.contactMode,
      mrr: payload.mrr,
      monthly_profit: payload.monthlyProfit,
      monthly_visitors: payload.monthlyVisitors,
      registered_users: payload.registeredUsers,
      assets_included: payload.assetsIncluded,
      screenshots: payload.screenshots ?? [],
      seller_id: clerkUserId,
      status: "pending_verification",
    })
    .select("id")
    .single();
  if (error || !data) return null;
  return { id: data.id };
}

export async function getUnlockedListings(clerkUserId: string): Promise<Listing[]> {
  const client = createServiceClient();
  const { data, error } = await client
    .from("unlocked_listings")
    .select("listing_id, listings(*)")
    .eq("clerk_user_id", clerkUserId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return (data as Record<string, unknown>[])
    .map((row) => {
      const listing = (row as { listings: Record<string, unknown> | null }).listings;
      if (!listing) return null;
      return rowToListing(listing);
    })
    .filter((listing): listing is Listing => listing !== null);
}

export async function recordListingView(
  listingId: string,
  viewerId: string | null
): Promise<void> {
  const client = createServiceClient();
  await client.from("listing_views").insert({ listing_id: listingId, viewer_id: viewerId });
}

export async function featureListing(
  clerkUserId: string,
  listingId: string,
  durationDays: 7 | 14 | 30
): Promise<{ success?: boolean; error?: string }> {
  const listing = await getListingByIdForSeller(clerkUserId, listingId);
  if (!listing) return { error: "Listing not found." };

  const cost = FEATURE_COSTS[durationDays];
  const debited = await mutateBalanceAtomic(clerkUserId, -cost);
  if (debited.insufficient) return { error: `Not enough Connects. This requires ${cost} connects.` };
  if (debited.error) return { error: debited.error };

  const featuredUntil = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();
  const client = createServiceClient();

  const { error: updateError } = await client
    .from("listings")
    .update({ featured: true, featured_until: featuredUntil })
    .eq("id", listingId)
    .eq("seller_id", clerkUserId);

  if (updateError) {
    await mutateBalanceAtomic(clerkUserId, cost);
    return { error: "Could not feature listing right now. Please try again." };
  }

  await client.from("connects_transactions").insert({
    clerk_user_id: clerkUserId,
    amount: -cost,
    type: "feature_boost",
    description: `Listing featured for ${durationDays}d`,
    listing_id: listingId,
  });

  return { success: true };
}

export async function expireFeaturedListings(): Promise<number> {
  const client = createServiceClient();
  const { data, error } = await client
    .from("listings")
    .update({ featured: false, featured_until: null })
    .lt("featured_until", new Date().toISOString())
    .eq("featured", true)
    .select("id");
  if (error) return 0;
  return (data ?? []).length;
}

export async function getListingAnalytics(
  listingIds: string[]
): Promise<Record<string, { views: number; unlocks: number }>> {
  if (listingIds.length === 0) return {};
  const client = createServiceClient();

  const [viewsRes, unlocksRes] = await Promise.all([
    client.from("listing_views").select("listing_id").in("listing_id", listingIds),
    client
      .from("connects_transactions")
      .select("listing_id")
      .eq("type", "unlock")
      .in("listing_id", listingIds),
  ]);

  const result: Record<string, { views: number; unlocks: number }> = {};
  for (const id of listingIds) result[id] = { views: 0, unlocks: 0 };
  for (const row of (viewsRes.data ?? []) as { listing_id: string }[])
    result[row.listing_id].views++;
  for (const row of (unlocksRes.data ?? []) as { listing_id: string }[])
    result[row.listing_id].unlocks++;
  return result;
}

export async function refreshListing(
  clerkUserId: string,
  listingId: string
): Promise<boolean> {
  const client = createServiceClient();
  const { error } = await client
    .from("listings")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", listingId)
    .eq("seller_id", clerkUserId);
  return !error;
}

export interface StaleListing {
  id: string;
  sellerId: string;
  title: string;
}

// Returns listings that just crossed the 60-day inactivity mark (within last 24h)
export async function getListingsToWarn(): Promise<StaleListing[]> {
  const client = createServiceClient();
  const sixty = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
  const sixtyOne = new Date(Date.now() - 61 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await client
    .from("listings")
    .select("id, seller_id, title")
    .eq("status", "active")
    .lt("updated_at", sixty)
    .gte("updated_at", sixtyOne);
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map((row) => ({
    id: row.id as string,
    sellerId: row.seller_id as string,
    title: row.title as string,
  }));
}

// Auto-drafts listings inactive for 90+ days, returns them for notification
export async function archiveStaleListings(): Promise<StaleListing[]> {
  const client = createServiceClient();
  const ninety = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await client
    .from("listings")
    .update({ status: "draft" })
    .eq("status", "active")
    .lt("updated_at", ninety)
    .select("id, seller_id, title");
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map((row) => ({
    id: row.id as string,
    sellerId: row.seller_id as string,
    title: row.title as string,
  }));
}

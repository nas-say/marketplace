import { createServerClient, createServiceClient } from "@/lib/supabase";
import { Listing } from "@/types/listing";

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
    screenshots: [],
    askingPrice: Number(row.asking_price),
    openToOffers: Boolean(row.open_to_offers),
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
    createdAt: row.created_at as string,
    updatedAt: (row.updated_at as string) ?? (row.created_at as string),
  };
}

export async function getListings(): Promise<Listing[]> {
  const client = await createServerClient();
  const { data, error } = await client
    .from("listings")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map(rowToListing);
}

export async function getFeaturedListings(): Promise<Listing[]> {
  const client = await createServerClient();
  const { data, error } = await client
    .from("listings")
    .select("*")
    .eq("status", "active")
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
    .eq("status", "active")
    .eq("category", listing.category)
    .neq("id", listing.id)
    .limit(count);
  if (error || !data) return [];
  return data.map(rowToListing);
}

export async function getAllListingsBySeller(sellerId: string): Promise<Listing[]> {
  const client = await createServerClient();
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
    mrr: number; monthlyProfit: number; monthlyVisitors: number;
    registeredUsers: number; assetsIncluded: string[];
  }
): Promise<boolean> {
  const client = createServiceClient();
  const { error } = await client.from("listings").update({
    title: payload.title, pitch: payload.pitch, description: payload.description,
    category: payload.category, tech_stack: payload.techStack,
    asking_price: payload.askingPrice, open_to_offers: payload.openToOffers,
    mrr: payload.mrr, monthly_profit: payload.monthlyProfit,
    monthly_visitors: payload.monthlyVisitors, registered_users: payload.registeredUsers,
    assets_included: payload.assetsIncluded,
  }).eq("id", listingId).eq("seller_id", clerkUserId);
  return !error;
}

export async function updateListingStatus(
  clerkUserId: string,
  listingId: string,
  status: "active" | "sold" | "draft" | "pending_verification"
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
    mrr: number;
    monthlyProfit: number;
    monthlyVisitors: number;
    registeredUsers: number;
    assetsIncluded: string[];
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
      mrr: payload.mrr,
      monthly_profit: payload.monthlyProfit,
      monthly_visitors: payload.monthlyVisitors,
      registered_users: payload.registeredUsers,
      assets_included: payload.assetsIncluded,
      seller_id: clerkUserId,
      status: "pending_verification",
    })
    .select("id")
    .single();
  if (error || !data) return null;
  return { id: data.id };
}

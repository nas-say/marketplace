import { createServiceClient } from "@/lib/supabase";

export interface Offer {
  id: string;
  listingId: string;
  buyerId: string;
  amountCents: number | null;
  message: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
  updatedAt: string;
}

export interface OfferWithListing extends Offer {
  listingTitle: string;
  listingAskingPrice: number;
}

function rowToOffer(row: Record<string, unknown>): Offer {
  return {
    id: row.id as string,
    listingId: row.listing_id as string,
    buyerId: row.buyer_id as string,
    amountCents: row.amount_cents == null ? null : Number(row.amount_cents),
    message: (row.message as string) ?? "",
    status: (row.status as Offer["status"]) ?? "pending",
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export async function createOffer(
  buyerId: string,
  listingId: string,
  amountCents: number | null,
  message: string
): Promise<{ id: string } | null> {
  const client = createServiceClient();
  const { data, error } = await client
    .from("offers")
    .insert({ buyer_id: buyerId, listing_id: listingId, amount_cents: amountCents, message })
    .select("id")
    .single();
  if (error || !data) return null;
  return { id: data.id };
}

export async function getOffersForListing(
  sellerId: string,
  listingId: string
): Promise<Offer[]> {
  const client = createServiceClient();
  // Verify seller owns this listing
  const { data: listing } = await client
    .from("listings")
    .select("id")
    .eq("id", listingId)
    .eq("seller_id", sellerId)
    .maybeSingle();
  if (!listing) return [];

  const { data, error } = await client
    .from("offers")
    .select("*")
    .eq("listing_id", listingId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(rowToOffer);
}

export async function getOffersForSeller(sellerId: string): Promise<OfferWithListing[]> {
  const client = createServiceClient();
  const { data, error } = await client
    .from("offers")
    .select("*, listings!inner(id, title, asking_price, seller_id)")
    .eq("listings.seller_id", sellerId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];

  return (data as Record<string, unknown>[]).map((row) => {
    const listing = row.listings as Record<string, unknown>;
    return {
      ...rowToOffer(row),
      listingTitle: listing?.title as string ?? "",
      listingAskingPrice: Number(listing?.asking_price ?? 0),
    };
  });
}

export async function getOffersForBuyer(buyerId: string): Promise<OfferWithListing[]> {
  const client = createServiceClient();
  const { data, error } = await client
    .from("offers")
    .select("*, listings(id, title, asking_price)")
    .eq("buyer_id", buyerId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];

  return (data as Record<string, unknown>[]).map((row) => {
    const listing = row.listings as Record<string, unknown> | null;
    return {
      ...rowToOffer(row),
      listingTitle: listing?.title as string ?? "Deleted listing",
      listingAskingPrice: Number(listing?.asking_price ?? 0),
    };
  });
}

export async function updateOfferStatus(
  sellerId: string,
  offerId: string,
  status: "accepted" | "rejected"
): Promise<{ ok: boolean; buyerId?: string; listingId?: string; listingTitle?: string }> {
  const client = createServiceClient();
  // Validate the offer's listing belongs to this seller, and get buyer_id
  const { data: offer } = await client
    .from("offers")
    .select("listing_id, buyer_id")
    .eq("id", offerId)
    .maybeSingle();
  if (!offer) return { ok: false };

  const offerRow = offer as Record<string, unknown>;
  const { data: listing } = await client
    .from("listings")
    .select("id, title")
    .eq("id", offerRow.listing_id)
    .eq("seller_id", sellerId)
    .maybeSingle();
  if (!listing) return { ok: false };

  const listingRow = listing as Record<string, unknown>;
  const { error } = await client
    .from("offers")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", offerId);
  if (error) return { ok: false };
  return {
    ok: true,
    buyerId: offerRow.buyer_id as string,
    listingId: String(offerRow.listing_id),
    listingTitle: listingRow.title as string,
  };
}

export async function hasAcceptedOfferForBuyer(
  buyerId: string,
  listingId: string
): Promise<boolean> {
  const client = createServiceClient();
  const { data, error } = await client
    .from("offers")
    .select("id")
    .eq("buyer_id", buyerId)
    .eq("listing_id", listingId)
    .eq("status", "accepted")
    .limit(1)
    .maybeSingle();
  if (error) return false;
  return Boolean(data);
}

import { createHash } from "crypto";
import { createServiceClient } from "@/lib/supabase";

const BALANCE_RETRY_LIMIT = 5;
const SIGNUP_GIFT_TX_NAMESPACE = "signup-gift-v1";
const RAZORPAY_TOPUP_TX_NAMESPACE = "razorpay-topup-v1";
const LEGACY_GIFT_DESCRIPTION_PREFIX = "Early access gift:";

export const SIGNUP_GIFT_CONNECTS = 5;

interface BalanceMutationResult {
  balance?: number;
  insufficient?: boolean;
  error?: string;
}

function stableUuidFromText(input: string): string {
  const hex = createHash("sha256").update(input).digest("hex").slice(0, 32);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

function isDuplicateKeyError(error: { code?: string } | null | undefined): boolean {
  return error?.code === "23505";
}

async function ensureBalanceRow(
  clerkUserId: string
): Promise<{ error?: string }> {
  const client = createServiceClient();
  const { error } = await client.from("connects_balance").upsert(
    {
      clerk_user_id: clerkUserId,
      balance: 0,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "clerk_user_id", ignoreDuplicates: true }
  );

  if (error) {
    return { error: "Could not initialize connects balance." };
  }

  return {};
}

async function mutateBalanceAtomic(
  clerkUserId: string,
  delta: number
): Promise<BalanceMutationResult> {
  const init = await ensureBalanceRow(clerkUserId);
  if (init.error) return init;

  const client = createServiceClient();

  for (let attempt = 0; attempt < BALANCE_RETRY_LIMIT; attempt += 1) {
    const { data: currentRow, error: readError } = await client
      .from("connects_balance")
      .select("balance")
      .eq("clerk_user_id", clerkUserId)
      .maybeSingle();

    if (readError) {
      return { error: "Could not read connects balance." };
    }

    const currentBalance = (currentRow as { balance: number } | null)?.balance ?? 0;
    const nextBalance = currentBalance + delta;

    if (nextBalance < 0) {
      return { insufficient: true };
    }

    const { data: updatedRow, error: updateError } = await client
      .from("connects_balance")
      .update({
        balance: nextBalance,
        updated_at: new Date().toISOString(),
      })
      .eq("clerk_user_id", clerkUserId)
      .eq("balance", currentBalance)
      .select("balance")
      .maybeSingle();

    if (updateError) {
      return { error: "Could not update connects balance." };
    }

    if (updatedRow) {
      return { balance: (updatedRow as { balance: number }).balance };
    }
  }

  return { error: "Could not update connects balance due to concurrent requests." };
}

export function getSignupGiftTransactionId(clerkUserId: string): string {
  return stableUuidFromText(`${SIGNUP_GIFT_TX_NAMESPACE}:${clerkUserId}`);
}

function getRazorpayTopupTransactionId(paymentId: string): string {
  return stableUuidFromText(`${RAZORPAY_TOPUP_TX_NAMESPACE}:${paymentId}`);
}

export async function hasClaimedSignupGift(clerkUserId: string): Promise<boolean> {
  const client = createServiceClient();
  const transactionId = getSignupGiftTransactionId(clerkUserId);

  const { data: idMatch, error: idError } = await client
    .from("connects_transactions")
    .select("id")
    .eq("id", transactionId)
    .maybeSingle();

  if (idError) throw new Error("Could not verify signup gift status.");
  if (idMatch) return true;

  const { data: signupGiftMatch, error: signupGiftError } = await client
    .from("connects_transactions")
    .select("id")
    .eq("clerk_user_id", clerkUserId)
    .eq("type", "signup_gift")
    .limit(1)
    .maybeSingle();

  if (signupGiftError) throw new Error("Could not verify signup gift status.");
  if (signupGiftMatch) return true;

  const { data: legacyGiftMatch, error: legacyGiftError } = await client
    .from("connects_transactions")
    .select("id")
    .eq("clerk_user_id", clerkUserId)
    .eq("type", "gift")
    .ilike("description", `${LEGACY_GIFT_DESCRIPTION_PREFIX}%`)
    .limit(1)
    .maybeSingle();

  if (legacyGiftError) throw new Error("Could not verify signup gift status.");
  return !!legacyGiftMatch;
}

export async function claimSignupGift(
  clerkUserId: string
): Promise<{ claimed: boolean; error?: string }> {
  let alreadyClaimed = false;
  try {
    alreadyClaimed = await hasClaimedSignupGift(clerkUserId);
  } catch {
    return { claimed: false, error: "Could not verify your signup gift status right now." };
  }
  if (alreadyClaimed) return { claimed: false };

  const client = createServiceClient();
  const transactionId = getSignupGiftTransactionId(clerkUserId);

  const { error: insertError } = await client.from("connects_transactions").insert({
    id: transactionId,
    clerk_user_id: clerkUserId,
    amount: SIGNUP_GIFT_CONNECTS,
    type: "signup_gift",
    description: `Signup welcome gift: ${SIGNUP_GIFT_CONNECTS} connects`,
  });

  if (insertError) {
    if (isDuplicateKeyError(insertError)) {
      return { claimed: false };
    }
    return { claimed: false, error: "Could not claim your signup gift right now." };
  }

  const credited = await mutateBalanceAtomic(clerkUserId, SIGNUP_GIFT_CONNECTS);
  if (credited.error) {
    await client.from("connects_transactions").delete().eq("id", transactionId);
    return { claimed: false, error: credited.error };
  }

  return { claimed: true };
}

export async function creditRazorpayTopup(
  clerkUserId: string,
  connects: number,
  orderId: string,
  paymentId: string
): Promise<{ credited: boolean; error?: string }> {
  const client = createServiceClient();
  const transactionId = getRazorpayTopupTransactionId(paymentId);

  const { error: insertError } = await client.from("connects_transactions").insert({
    id: transactionId,
    clerk_user_id: clerkUserId,
    amount: connects,
    type: "purchase_razorpay",
    description: `Razorpay top-up | connects:${connects} | order:${orderId} | payment:${paymentId}`,
  });

  if (insertError) {
    if (isDuplicateKeyError(insertError)) {
      return { credited: false };
    }
    return { credited: false, error: "Could not record Razorpay payment transaction." };
  }

  const credited = await mutateBalanceAtomic(clerkUserId, connects);
  if (credited.error) {
    await client.from("connects_transactions").delete().eq("id", transactionId);
    return { credited: false, error: credited.error };
  }

  return { credited: true };
}

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
  const { data, error } = await client
    .from("connects_balance")
    .select("balance")
    .eq("clerk_user_id", clerkUserId)
    .maybeSingle();
  if (error) return 0;
  return (data as { balance: number } | null)?.balance ?? 0;
}

export async function isListingUnlocked(clerkUserId: string, listingId: string): Promise<boolean> {
  const client = createServiceClient();
  const { data, error } = await client
    .from("unlocked_listings")
    .select("clerk_user_id")
    .eq("clerk_user_id", clerkUserId)
    .eq("listing_id", listingId)
    .maybeSingle();
  if (error) return false;
  return !!data;
}

export async function unlockListing(
  clerkUserId: string,
  listingId: string,
  cost: number
): Promise<{ error?: string }> {
  const already = await isListingUnlocked(clerkUserId, listingId);
  if (already) return {};

  const debited = await mutateBalanceAtomic(clerkUserId, -cost);
  if (debited.insufficient) {
    return { error: `Not enough connects. This listing requires ${cost} connects to unlock.` };
  }
  if (debited.error) {
    return { error: debited.error };
  }

  const client = createServiceClient();

  const { error: unlockError } = await client.from("unlocked_listings").insert({
    clerk_user_id: clerkUserId,
    listing_id: listingId,
  });

  if (unlockError) {
    const refunded = await mutateBalanceAtomic(clerkUserId, cost);
    if (isDuplicateKeyError(unlockError) && !refunded.error) {
      return {};
    }
    return {
      error: refunded.error
        ? "Could not unlock listing and failed to restore connects automatically."
        : "Could not unlock listing right now. Please try again.",
    };
  }

  const { error: txError } = await client.from("connects_transactions").insert({
    clerk_user_id: clerkUserId,
    amount: -cost,
    type: "unlock",
    description: "Seller info unlocked",
    listing_id: listingId,
  });

  if (txError) {
    await client
      .from("unlocked_listings")
      .delete()
      .eq("clerk_user_id", clerkUserId)
      .eq("listing_id", listingId);
    await mutateBalanceAtomic(clerkUserId, cost);
    return { error: "Could not complete unlock transaction. Please try again." };
  }

  return {};
}

export async function addConnects(
  clerkUserId: string,
  amount: number,
  type: string,
  description: string
): Promise<{ error?: string }> {
  const updated = await mutateBalanceAtomic(clerkUserId, amount);
  if (updated.error) return { error: updated.error };

  const client = createServiceClient();
  const { error: txError } = await client.from("connects_transactions").insert({
    clerk_user_id: clerkUserId,
    amount,
    type,
    description,
  });

  if (txError) {
    await mutateBalanceAtomic(clerkUserId, -amount);
    return { error: "Could not record connects transaction." };
  }

  return {};
}

export async function getConnectsTransactions(clerkUserId: string): Promise<
  Array<{ id: string; amount: number; type: string; description: string | null; createdAt: string }>
> {
  const client = createServiceClient();
  const { data, error } = await client
    .from("connects_transactions")
    .select("id, amount, type, description, created_at")
    .eq("clerk_user_id", clerkUserId)
    .order("created_at", { ascending: false })
    .limit(20);
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map((row) => ({
    id: row.id as string,
    amount: row.amount as number,
    type: row.type as string,
    description: row.description as string | null,
    createdAt: row.created_at as string,
  }));
}

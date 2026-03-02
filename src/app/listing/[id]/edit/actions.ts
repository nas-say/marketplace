"use server";

import { auth } from "@clerk/nextjs/server";
import { updateListing } from "@/lib/db/listings";
import { CATEGORY_LABELS } from "@/lib/constants";
import { revalidatePath } from "next/cache";

const MAX_LISTING_PRICE_CENTS = 10_000_000 * 100;
const MAX_MRR_CENTS = 1_000_000 * 100;
const MAX_COUNTER = 100_000_000;
const MAX_TITLE_LENGTH = 120;
const MAX_PITCH_LENGTH = 120;
const MAX_DESCRIPTION_LENGTH = 10_000;

function validateMoneyMinor(value: number, field: string, maxMinor: number): string | null {
  if (!Number.isFinite(value)) return `${field} must be a valid number.`;
  if (!Number.isInteger(value)) return `${field} must be in whole cents.`;
  if (value < 0) return `${field} cannot be negative.`;
  if (value > maxMinor) return `${field} is too large.`;
  return null;
}

function validateCount(value: number, field: string, max: number): string | null {
  if (!Number.isFinite(value)) return `${field} must be a valid number.`;
  if (!Number.isInteger(value)) return `${field} must be a whole number.`;
  if (value < 0) return `${field} cannot be negative.`;
  if (value > max) return `${field} is too large.`;
  return null;
}

export async function updateListingAction(
  listingId: string,
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
): Promise<{ error?: string; success?: boolean }> {
  const { userId } = await auth();
  if (!userId) return { error: "Not authenticated" };

  const safeListingId = listingId.trim();
  if (!safeListingId) return { error: "Invalid listing id." };

  const title = payload.title.trim();
  if (!title) return { error: "Project name is required." };
  if (title.length > MAX_TITLE_LENGTH) {
    return { error: `Project name must be ${MAX_TITLE_LENGTH} characters or fewer.` };
  }

  const pitch = payload.pitch.trim();
  if (!pitch) return { error: "One-line pitch is required." };
  if (pitch.length > MAX_PITCH_LENGTH) {
    return { error: `One-line pitch must be ${MAX_PITCH_LENGTH} characters or fewer.` };
  }

  const description = payload.description.trim();
  if (!description) return { error: "Description is required." };
  if (description.length > MAX_DESCRIPTION_LENGTH) return { error: "Description is too long." };

  if (!Object.prototype.hasOwnProperty.call(CATEGORY_LABELS, payload.category)) {
    return { error: "Invalid category selected." };
  }

  const askingPriceError = validateMoneyMinor(payload.askingPrice, "Asking price", MAX_LISTING_PRICE_CENTS);
  if (askingPriceError) return { error: askingPriceError };

  const mrrError = validateMoneyMinor(payload.mrr, "MRR", MAX_MRR_CENTS);
  if (mrrError) return { error: mrrError };

  const profitError = validateMoneyMinor(payload.monthlyProfit, "Monthly profit", MAX_MRR_CENTS);
  if (profitError) return { error: profitError };

  if (payload.monthlyProfit > payload.mrr) {
    return { error: "Monthly profit cannot be greater than MRR." };
  }

  const visitorsError = validateCount(payload.monthlyVisitors, "Monthly visitors", MAX_COUNTER);
  if (visitorsError) return { error: visitorsError };

  const usersError = validateCount(payload.registeredUsers, "Registered users", MAX_COUNTER);
  if (usersError) return { error: usersError };

  const techStack = payload.techStack
    .map((tech) => tech.trim())
    .filter(Boolean)
    .slice(0, 50);

  const assetsIncluded = payload.assetsIncluded
    .map((asset) => asset.trim())
    .filter(Boolean)
    .slice(0, 50);

  const ok = await updateListing(userId, safeListingId, {
    title,
    pitch,
    description,
    category: payload.category,
    techStack,
    askingPrice: Math.round(payload.askingPrice),
    openToOffers: Boolean(payload.openToOffers),
    mrr: Math.round(payload.mrr),
    monthlyProfit: Math.round(payload.monthlyProfit),
    monthlyVisitors: Math.floor(payload.monthlyVisitors),
    registeredUsers: Math.floor(payload.registeredUsers),
    assetsIncluded,
  });

  if (!ok) return { error: "Failed to update. You may not have permission." };

  revalidatePath(`/listing/${safeListingId}`);
  revalidatePath("/dashboard");
  return { success: true };
}

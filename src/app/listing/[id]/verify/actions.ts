"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import {
  createDomainVerificationChallenge,
  createRepoVerificationChallenge,
  requestManualListingReview,
  verifyDomainOwnership,
  verifyRepoOwnership,
} from "@/lib/db/listing-verifications";

function revalidateListingViews(listingId: string) {
  revalidatePath(`/listing/${listingId}`);
  revalidatePath(`/listing/${listingId}/verify`);
  revalidatePath(`/listing/${listingId}/edit`);
  revalidatePath("/dashboard");
  revalidatePath("/browse");
}

export async function startRepoVerificationAction(
  listingId: string,
  repoUrl: string
): Promise<{ success?: boolean; verificationId?: string; challengeText?: string; normalizedRepo?: string; error?: string }> {
  const { userId } = await auth();
  if (!userId) return { error: "Not authenticated." };

  const result = await createRepoVerificationChallenge(userId, listingId, repoUrl);
  if (result.error) return { error: result.error };

  revalidateListingViews(listingId);
  return {
    success: true,
    verificationId: result.verificationId,
    challengeText: result.challengeText,
    normalizedRepo: result.normalizedRepo,
  };
}

export async function verifyRepoOwnershipAction(
  listingId: string,
  verificationId: string
): Promise<{ success?: boolean; error?: string }> {
  const { userId } = await auth();
  if (!userId) return { error: "Not authenticated." };

  const result = await verifyRepoOwnership(userId, verificationId);
  if (!result.verified) return { error: result.error ?? "Could not verify repository." };

  revalidateListingViews(listingId);
  return { success: true };
}

export async function startDomainVerificationAction(
  listingId: string,
  domain: string
): Promise<{ success?: boolean; verificationId?: string; challengeText?: string; normalizedDomain?: string; error?: string }> {
  const { userId } = await auth();
  if (!userId) return { error: "Not authenticated." };

  const result = await createDomainVerificationChallenge(userId, listingId, domain);
  if (result.error) return { error: result.error };

  revalidateListingViews(listingId);
  return {
    success: true,
    verificationId: result.verificationId,
    challengeText: result.challengeText,
    normalizedDomain: result.normalizedDomain,
  };
}

export async function verifyDomainOwnershipAction(
  listingId: string,
  verificationId: string
): Promise<{ success?: boolean; error?: string }> {
  const { userId } = await auth();
  if (!userId) return { error: "Not authenticated." };

  const result = await verifyDomainOwnership(userId, verificationId);
  if (!result.verified) return { error: result.error ?? "Could not verify domain." };

  revalidateListingViews(listingId);
  return { success: true };
}

export async function requestManualReviewAction(
  listingId: string,
  note: string
): Promise<{ success?: boolean; error?: string }> {
  const { userId } = await auth();
  if (!userId) return { error: "Not authenticated." };

  const result = await requestManualListingReview(userId, listingId, note);
  if (!result.requested) return { error: result.error ?? "Could not request manual review." };

  revalidateListingViews(listingId);
  return { success: true };
}

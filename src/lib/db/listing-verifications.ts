import { randomBytes } from "crypto";
import { resolveTxt } from "dns/promises";
import { createServiceClient } from "@/lib/supabase";
import { Listing } from "@/types/listing";

export type VerificationMethod = "repo" | "domain" | "manual";
export type VerificationStatus = "pending" | "verified" | "manual_requested" | "rejected";

export interface ListingVerification {
  id: string;
  listingId: string;
  sellerId: string;
  method: VerificationMethod;
  target: string | null;
  challengeToken: string | null;
  status: VerificationStatus;
  note: string | null;
  lastError: string | null;
  createdAt: string;
  verifiedAt: string | null;
}

interface ListingBasic {
  id: string;
  seller_id: string;
  status: Listing["status"];
}

const CHALLENGE_PREFIX = "sideflip-verify";

function rowToVerification(row: Record<string, unknown>): ListingVerification {
  return {
    id: row.id as string,
    listingId: row.listing_id as string,
    sellerId: row.seller_id as string,
    method: row.method as VerificationMethod,
    target: (row.target as string) ?? null,
    challengeToken: (row.challenge_token as string) ?? null,
    status: row.status as VerificationStatus,
    note: (row.note as string) ?? null,
    lastError: (row.last_error as string) ?? null,
    createdAt: row.created_at as string,
    verifiedAt: (row.verified_at as string) ?? null,
  };
}

function generateChallengeToken(): string {
  return randomBytes(16).toString("hex");
}

function toChallengeText(token: string): string {
  return `${CHALLENGE_PREFIX}=${token}`;
}

function normalizeDomain(input: string): string | null {
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) return null;
  const withoutProtocol = trimmed.replace(/^https?:\/\//, "");
  const host = withoutProtocol.split("/")[0]?.replace(/\.$/, "") ?? "";
  if (!host) return null;
  if (!/^[a-z0-9.-]+$/.test(host)) return null;
  if (!host.includes(".")) return null;
  return host;
}

function parseGitHubRepoTarget(input: string): { owner: string; repo: string; normalized: string } | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const ownerRepoPattern = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
  if (ownerRepoPattern.test(trimmed)) {
    const [owner, repo] = trimmed.split("/");
    return { owner, repo, normalized: `${owner}/${repo}` };
  }

  try {
    const parsed = new URL(trimmed);
    if (!parsed.hostname.toLowerCase().includes("github.com")) return null;
    const segments = parsed.pathname.split("/").filter(Boolean);
    if (segments.length < 2) return null;
    const owner = segments[0];
    const repo = segments[1].replace(/\.git$/i, "");
    if (!owner || !repo) return null;
    return { owner, repo, normalized: `${owner}/${repo}` };
  } catch {
    return null;
  }
}

function githubHeaders(): HeadersInit {
  const token = process.env.GITHUB_TOKEN?.trim();
  return {
    Accept: "application/vnd.github+json",
    "User-Agent": "sideflip-verifier",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function getSellerListing(clerkUserId: string, listingId: string): Promise<ListingBasic | null> {
  const client = createServiceClient();
  const { data, error } = await client
    .from("listings")
    .select("id, seller_id, status")
    .eq("id", listingId)
    .eq("seller_id", clerkUserId)
    .maybeSingle();
  if (error || !data) return null;
  return data as ListingBasic;
}

async function activateListingOwnership(
  listingId: string,
  sellerId: string,
  method: Exclude<Listing["ownershipVerificationMethod"], null>
): Promise<void> {
  const client = createServiceClient();
  await client
    .from("listings")
    .update({
      ownership_verified: true,
      ownership_verification_method: method,
      ownership_verified_at: new Date().toISOString(),
      status: "active",
    })
    .eq("id", listingId)
    .eq("seller_id", sellerId)
    .eq("status", "pending_verification");

  // Keep ownership fields consistent even if listing is already active.
  await client
    .from("listings")
    .update({
      ownership_verified: true,
      ownership_verification_method: method,
      ownership_verified_at: new Date().toISOString(),
    })
    .eq("id", listingId)
    .eq("seller_id", sellerId);
}

export async function getListingVerificationsForSeller(
  clerkUserId: string,
  listingId: string
): Promise<ListingVerification[]> {
  const client = createServiceClient();
  const { data, error } = await client
    .from("listing_ownership_verifications")
    .select("*")
    .eq("listing_id", listingId)
    .eq("seller_id", clerkUserId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(rowToVerification);
}

export async function createRepoVerificationChallenge(
  clerkUserId: string,
  listingId: string,
  repoInput: string
): Promise<{ verificationId?: string; challengeText?: string; normalizedRepo?: string; error?: string }> {
  const listing = await getSellerListing(clerkUserId, listingId);
  if (!listing) return { error: "Listing not found." };

  const parsed = parseGitHubRepoTarget(repoInput);
  if (!parsed) return { error: "Enter a valid GitHub repository URL or owner/repo." };

  const token = generateChallengeToken();
  const challengeText = toChallengeText(token);

  const client = createServiceClient();
  const { data, error } = await client
    .from("listing_ownership_verifications")
    .insert({
      listing_id: listingId,
      seller_id: clerkUserId,
      method: "repo",
      target: parsed.normalized,
      challenge_token: token,
      status: "pending",
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: "Could not create repo verification challenge." };
  }

  return {
    verificationId: data.id as string,
    challengeText,
    normalizedRepo: parsed.normalized,
  };
}

export async function verifyRepoOwnership(
  clerkUserId: string,
  verificationId: string
): Promise<{ verified: boolean; error?: string }> {
  const client = createServiceClient();
  const { data, error } = await client
    .from("listing_ownership_verifications")
    .select("*")
    .eq("id", verificationId)
    .eq("seller_id", clerkUserId)
    .eq("method", "repo")
    .maybeSingle();

  if (error || !data) {
    return { verified: false, error: "Verification request not found." };
  }

  const verification = rowToVerification(data as Record<string, unknown>);
  if (verification.status === "verified") {
    return { verified: true };
  }

  const parsed = verification.target ? parseGitHubRepoTarget(verification.target) : null;
  if (!parsed || !verification.challengeToken) {
    return { verified: false, error: "Verification challenge is invalid." };
  }

  const challengeText = toChallengeText(verification.challengeToken);
  const repoApiUrl = `https://api.github.com/repos/${parsed.owner}/${parsed.repo}`;

  try {
    const repoResponse = await fetch(repoApiUrl, { headers: githubHeaders(), cache: "no-store" });
    if (!repoResponse.ok) {
      await client
        .from("listing_ownership_verifications")
        .update({ last_error: "Could not access repository from GitHub API." })
        .eq("id", verification.id);
      return {
        verified: false,
        error: "Could not access this GitHub repository. Only public repositories are supported right now.",
      };
    }

    const repoJson = (await repoResponse.json()) as { description?: string };
    const description = repoJson.description ?? "";
    const foundInDescription = description.includes(challengeText) || description.includes(verification.challengeToken);

    const readmeResponse = await fetch(`${repoApiUrl}/readme`, {
      headers: {
        ...githubHeaders(),
        Accept: "application/vnd.github.raw+json",
      },
      cache: "no-store",
    });
    const readmeText = readmeResponse.ok ? await readmeResponse.text() : "";
    const foundInReadme =
      readmeText.includes(challengeText) || readmeText.includes(verification.challengeToken);

    if (!foundInDescription && !foundInReadme) {
      await client
        .from("listing_ownership_verifications")
        .update({
          last_error: "Challenge token was not found in repo description or README.",
        })
        .eq("id", verification.id);
      return {
        verified: false,
        error: `Token not found. Add "${challengeText}" to repo description or README, then verify again.`,
      };
    }

    await client
      .from("listing_ownership_verifications")
      .update({
        status: "verified",
        verified_at: new Date().toISOString(),
        last_error: null,
      })
      .eq("id", verification.id);

    await activateListingOwnership(verification.listingId, verification.sellerId, "repo");
    return { verified: true };
  } catch (exception) {
    await client
      .from("listing_ownership_verifications")
      .update({
        last_error: exception instanceof Error ? exception.message : "GitHub verification failed.",
      })
      .eq("id", verification.id);
    return { verified: false, error: "Could not verify GitHub repository right now." };
  }
}

export async function createDomainVerificationChallenge(
  clerkUserId: string,
  listingId: string,
  domainInput: string
): Promise<{ verificationId?: string; challengeText?: string; normalizedDomain?: string; error?: string }> {
  const listing = await getSellerListing(clerkUserId, listingId);
  if (!listing) return { error: "Listing not found." };

  const normalizedDomain = normalizeDomain(domainInput);
  if (!normalizedDomain) return { error: "Enter a valid domain." };

  const token = generateChallengeToken();
  const challengeText = toChallengeText(token);

  const client = createServiceClient();
  const { data, error } = await client
    .from("listing_ownership_verifications")
    .insert({
      listing_id: listingId,
      seller_id: clerkUserId,
      method: "domain",
      target: normalizedDomain,
      challenge_token: token,
      status: "pending",
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: "Could not create domain verification challenge." };
  }

  return {
    verificationId: data.id as string,
    challengeText,
    normalizedDomain,
  };
}

export async function verifyDomainOwnership(
  clerkUserId: string,
  verificationId: string
): Promise<{ verified: boolean; error?: string }> {
  const client = createServiceClient();
  const { data, error } = await client
    .from("listing_ownership_verifications")
    .select("*")
    .eq("id", verificationId)
    .eq("seller_id", clerkUserId)
    .eq("method", "domain")
    .maybeSingle();

  if (error || !data) {
    return { verified: false, error: "Verification request not found." };
  }

  const verification = rowToVerification(data as Record<string, unknown>);
  if (verification.status === "verified") {
    return { verified: true };
  }

  if (!verification.target || !verification.challengeToken) {
    return { verified: false, error: "Verification challenge is invalid." };
  }

  const challengeText = toChallengeText(verification.challengeToken);
  try {
    const txtRecords = await resolveTxt(verification.target);
    const flattened = txtRecords.flat().map((value) => value.trim());
    const matched = flattened.some(
      (entry) => entry === challengeText || entry.includes(challengeText) || entry === verification.challengeToken
    );

    if (!matched) {
      await client
        .from("listing_ownership_verifications")
        .update({
          last_error: `TXT record missing challenge token (${challengeText}).`,
        })
        .eq("id", verification.id);
      return {
        verified: false,
        error: `TXT token not found. Add "${challengeText}" to your domain TXT records and retry.`,
      };
    }

    await client
      .from("listing_ownership_verifications")
      .update({
        status: "verified",
        verified_at: new Date().toISOString(),
        last_error: null,
      })
      .eq("id", verification.id);

    await activateListingOwnership(verification.listingId, verification.sellerId, "domain");
    return { verified: true };
  } catch (exception) {
    await client
      .from("listing_ownership_verifications")
      .update({
        last_error: exception instanceof Error ? exception.message : "Domain verification failed.",
      })
      .eq("id", verification.id);
    return { verified: false, error: "Could not query DNS TXT records yet. Try again in a few minutes." };
  }
}

export async function requestManualListingReview(
  clerkUserId: string,
  listingId: string,
  note: string
): Promise<{ requested: boolean; error?: string }> {
  const listing = await getSellerListing(clerkUserId, listingId);
  if (!listing) return { requested: false, error: "Listing not found." };

  const client = createServiceClient();
  const { error } = await client.from("listing_ownership_verifications").insert({
    listing_id: listingId,
    seller_id: clerkUserId,
    method: "manual",
    target: null,
    challenge_token: null,
    status: "manual_requested",
    note: note.trim() || null,
  });

  if (error) {
    return { requested: false, error: "Could not submit manual review request." };
  }
  return { requested: true };
}

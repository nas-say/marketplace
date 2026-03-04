import "server-only";

import { createHash } from "crypto";
import { headers } from "next/headers";
import { createServiceClient } from "@/lib/supabase";

const FEATURE_PREFIX = "_action_guard";

type LimitReason = "user" | "ip";

export interface ActionRequestContext {
  ip: string | null;
  ipHash: string | null;
  userAgent: string;
  countryCode: string | null;
  path: string;
}

export interface ActionRateLimitInput {
  userId: string;
  action: string;
  windowMs: number;
  maxPerUser: number;
  maxPerIp: number;
  context: ActionRequestContext;
}

export interface ActionGuardResult {
  allowed: boolean;
  retryAfterSeconds?: number;
  reason?: LimitReason;
}

function hashValue(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function normalizeAction(action: string): string {
  return action.replace(/[^a-zA-Z0-9:_-]/g, "_").slice(0, 64);
}

function toFeature(action: string): string {
  return `${FEATURE_PREFIX}:rl:${normalizeAction(action)}`;
}

function extractClientIp(headersList: Headers): string | null {
  const forwarded = headersList.get("x-forwarded-for") ?? "";
  const firstForwarded = forwarded.split(",")[0]?.trim();
  if (firstForwarded) return firstForwarded;

  const xRealIp = headersList.get("x-real-ip")?.trim();
  if (xRealIp) return xRealIp;

  const cfIp = headersList.get("cf-connecting-ip")?.trim();
  if (cfIp) return cfIp;

  return null;
}

export async function getActionRequestContext(pathHint: string): Promise<ActionRequestContext> {
  const headersList = await headers();
  const ip = extractClientIp(headersList);

  return {
    ip,
    ipHash: ip ? hashValue(ip) : null,
    userAgent: headersList.get("user-agent") ?? "",
    countryCode: (headersList.get("x-vercel-ip-country") ?? "").toUpperCase() || null,
    path: pathHint,
  };
}

async function countRecentByUser(
  userId: string,
  feature: string,
  sinceIso: string
): Promise<number> {
  const client = createServiceClient();
  const { count, error } = await client
    .from("payment_interest_signals")
    .select("id", { head: true, count: "exact" })
    .eq("clerk_user_id", userId)
    .eq("feature", feature)
    .gte("created_at", sinceIso);

  if (error) throw new Error(error.message);
  return count ?? 0;
}

async function countRecentByIpHash(
  ipHash: string,
  feature: string,
  sinceIso: string
): Promise<number> {
  const client = createServiceClient();
  const { count, error } = await client
    .from("payment_interest_signals")
    .select("id", { head: true, count: "exact" })
    .eq("feature", feature)
    .eq("metadata->>ip_hash", ipHash)
    .gte("created_at", sinceIso);

  if (error) throw new Error(error.message);
  return count ?? 0;
}

async function recordSignal(
  userId: string,
  feature: string,
  context: ActionRequestContext
): Promise<void> {
  const client = createServiceClient();
  const { error } = await client.from("payment_interest_signals").insert({
    clerk_user_id: userId,
    feature,
    country_code: context.countryCode,
    currency: null,
    metadata: {
      guard: true,
      kind: "action_rate_limit",
      path: context.path,
      ip_hash: context.ipHash,
      user_agent: context.userAgent,
    },
  });

  if (error) throw new Error(error.message);
}

export async function enforceActionRateLimit(input: ActionRateLimitInput): Promise<ActionGuardResult> {
  const feature = toFeature(input.action);
  const sinceIso = new Date(Date.now() - input.windowMs).toISOString();

  try {
    const [userCount, ipCount] = await Promise.all([
      countRecentByUser(input.userId, feature, sinceIso),
      input.context.ipHash
        ? countRecentByIpHash(input.context.ipHash, feature, sinceIso)
        : Promise.resolve(0),
    ]);

    if (userCount >= input.maxPerUser) {
      return {
        allowed: false,
        reason: "user",
        retryAfterSeconds: Math.max(1, Math.ceil(input.windowMs / 1000)),
      };
    }

    if (input.context.ipHash && ipCount >= input.maxPerIp) {
      return {
        allowed: false,
        reason: "ip",
        retryAfterSeconds: Math.max(1, Math.ceil(input.windowMs / 1000)),
      };
    }

    await recordSignal(input.userId, feature, input.context);
    return { allowed: true };
  } catch (error) {
    // Fail open to avoid blocking legitimate actions during transient DB/API outages.
    console.error("[action-guard] failed to evaluate action rate limit (fail-open)", {
      action: input.action,
      userId: input.userId,
      path: input.context.path,
      error: error instanceof Error ? error.message : String(error),
    });
    return { allowed: true };
  }
}

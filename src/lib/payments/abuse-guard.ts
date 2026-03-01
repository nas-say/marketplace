import { createHash } from "crypto";
import { createServiceClient } from "@/lib/supabase";

interface BaseGuardInput {
  userId: string;
  action: string;
  request: Request;
}

interface RateLimitInput extends BaseGuardInput {
  windowMs: number;
  maxRequests: number;
}

interface CooldownInput extends BaseGuardInput {
  cooldownMs: number;
  scope?: string;
}

export interface GuardResult {
  allowed: boolean;
  retryAfterSeconds?: number;
}

const FEATURE_PREFIX = "_payment_guard";

function hashValue(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function getClientIp(request: Request): string {
  const xForwardedFor = request.headers.get("x-forwarded-for") ?? "";
  const firstForwarded = xForwardedFor.split(",")[0]?.trim();
  if (firstForwarded) return firstForwarded;

  const xRealIp = request.headers.get("x-real-ip")?.trim();
  if (xRealIp) return xRealIp;

  const cfIp = request.headers.get("cf-connecting-ip")?.trim();
  if (cfIp) return cfIp;

  return "unknown";
}

function asFeature(kind: "rl" | "cd", action: string, scope?: string): string {
  const normalizedAction = action.replace(/[^a-zA-Z0-9:_-]/g, "_").slice(0, 64);
  const normalizedScope = (scope ?? "").replace(/[^a-zA-Z0-9:_-]/g, "_").slice(0, 64);
  return `${FEATURE_PREFIX}:${kind}:${normalizedAction}${normalizedScope ? `:${normalizedScope}` : ""}`;
}

async function countRecentSignals(
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

  if (error) {
    throw new Error(error.message);
  }
  return count ?? 0;
}

async function recordSignal(
  userId: string,
  feature: string,
  request: Request
): Promise<void> {
  const client = createServiceClient();
  const ip = getClientIp(request);

  const { error } = await client.from("payment_interest_signals").insert({
    clerk_user_id: userId,
    feature,
    country_code: (request.headers.get("x-vercel-ip-country") ?? "").toUpperCase() || null,
    currency: null,
    metadata: {
      guard: true,
      ip_hash: hashValue(ip),
      path: new URL(request.url).pathname,
      user_agent: request.headers.get("user-agent") ?? "",
    },
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function enforceUserRateLimit(input: RateLimitInput): Promise<GuardResult> {
  const { userId, action, request, maxRequests, windowMs } = input;
  const feature = asFeature("rl", action);
  const now = Date.now();
  const sinceIso = new Date(now - windowMs).toISOString();

  try {
    const currentCount = await countRecentSignals(userId, feature, sinceIso);
    if (currentCount >= maxRequests) {
      return {
        allowed: false,
        retryAfterSeconds: Math.max(1, Math.ceil(windowMs / 1000)),
      };
    }

    await recordSignal(userId, feature, request);
    return { allowed: true };
  } catch (error) {
    console.error("[payment-guard] rate-limit check failed (fail-open)", {
      action,
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    return { allowed: true };
  }
}

export async function enforceUserCooldown(input: CooldownInput): Promise<GuardResult> {
  const { userId, action, request, cooldownMs, scope } = input;
  const feature = asFeature("cd", action, scope);
  const now = Date.now();
  const sinceIso = new Date(now - cooldownMs).toISOString();

  try {
    const currentCount = await countRecentSignals(userId, feature, sinceIso);
    if (currentCount > 0) {
      return {
        allowed: false,
        retryAfterSeconds: Math.max(1, Math.ceil(cooldownMs / 1000)),
      };
    }

    await recordSignal(userId, feature, request);
    return { allowed: true };
  } catch (error) {
    console.error("[payment-guard] cooldown check failed (fail-open)", {
      action,
      scope,
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    return { allowed: true };
  }
}

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { getVisitorCountryCode, getVisitorCurrency } from "@/lib/geo";
import { sendPaymentInterestNotification } from "@/lib/notifications/payment-interest";
import { enforceUserCooldown, enforceUserRateLimit } from "@/lib/payments/abuse-guard";

export const runtime = "nodejs";

interface MarkInterestBody {
  feature?: string;
  context?: Record<string, unknown>;
}

function isMissingTableError(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error) return false;
  if (error.code === "42P01") return true;
  return typeof error.message === "string" && error.message.includes("payment_interest_signals");
}

const SUPPORTED_FEATURES = new Set([
  "connects_payment",
  "beta_reward_funding",
]);

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as MarkInterestBody | null;
  const feature = body?.feature?.trim() ?? "";
  if (!SUPPORTED_FEATURES.has(feature)) {
    return NextResponse.json({ error: "Unsupported interest type." }, { status: 400 });
  }

  const rateLimit = await enforceUserRateLimit({
    userId,
    action: "payment_interest",
    request,
    windowMs: 60_000,
    maxRequests: 10,
  });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait and try again." },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfterSeconds ?? 60),
        },
      }
    );
  }

  const cooldown = await enforceUserCooldown({
    userId,
    action: "payment_interest_feature",
    scope: feature,
    request,
    cooldownMs: 8_000,
  });
  if (!cooldown.allowed) {
    return NextResponse.json(
      { error: "Please wait a few seconds before submitting interest again." },
      {
        status: 429,
        headers: {
          "Retry-After": String(cooldown.retryAfterSeconds ?? 8),
        },
      }
    );
  }

  const context = body?.context && typeof body.context === "object" ? body.context : {};
  const [countryCode, currency] = await Promise.all([
    getVisitorCountryCode().catch(() => ""),
    getVisitorCurrency().catch(() => "USD" as const),
  ]);

  const client = createServiceClient();
  const { error: insertError } = await client.from("payment_interest_signals").insert({
    clerk_user_id: userId,
    feature,
    country_code: countryCode || null,
    currency,
    metadata: context,
  });

  if (insertError && !isMissingTableError(insertError)) {
    console.error("[payment-interest] failed to persist signal", {
      code: insertError.code,
      message: insertError.message,
      userId,
      feature,
      countryCode,
    });
    return NextResponse.json({ error: "Could not mark interest right now." }, { status: 500 });
  }

  await sendPaymentInterestNotification({
    userId,
    feature,
    countryCode,
    currency,
    context,
  });

  return NextResponse.json({ success: true });
}

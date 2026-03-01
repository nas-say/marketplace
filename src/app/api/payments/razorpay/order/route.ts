import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getVisitorCurrency } from "@/lib/geo";
import { enforceUserCooldown, enforceUserRateLimit } from "@/lib/payments/abuse-guard";
import {
  createRazorpayOrder,
  getInrBundleByConnects,
  getRazorpayPublicKeyId,
} from "@/lib/payments/razorpay";

export const runtime = "nodejs";

function logOrderFailure(reason: string, context: Record<string, unknown>) {
  console.error("[razorpay/order] request failed", { reason, ...context });
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    logOrderFailure("not_authenticated", {});
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const currency = await getVisitorCurrency();
  if (currency !== "INR" && process.env.NODE_ENV === "production") {
    logOrderFailure("currency_not_supported", { userId, currency });
    return NextResponse.json({ error: "Razorpay checkout is only available for India." }, { status: 400 });
  }

  const body = (await request.json().catch(() => null)) as { connects?: number } | null;
  const connects = Number(body?.connects);
  if (!Number.isFinite(connects)) {
    logOrderFailure("invalid_bundle_input", { userId, connects: body?.connects });
    return NextResponse.json({ error: "Invalid bundle selection." }, { status: 400 });
  }

  const bundle = getInrBundleByConnects(connects);
  if (!bundle) {
    logOrderFailure("unsupported_bundle", { userId, connects });
    return NextResponse.json({ error: "Unsupported INR bundle." }, { status: 400 });
  }

  const rateLimit = await enforceUserRateLimit({
    userId,
    action: "connects_order",
    request,
    windowMs: 60_000,
    maxRequests: 8,
  });
  if (!rateLimit.allowed) {
    logOrderFailure("rate_limited", { userId, connects });
    return NextResponse.json(
      { error: "Too many order attempts. Please slow down and try again." },
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
    action: "connects_order_bundle",
    scope: String(bundle.connects),
    request,
    cooldownMs: 15_000,
  });
  if (!cooldown.allowed) {
    logOrderFailure("cooldown_blocked", { userId, connects: bundle.connects });
    return NextResponse.json(
      { error: "Please wait a few seconds before creating another order for this bundle." },
      {
        status: 429,
        headers: {
          "Retry-After": String(cooldown.retryAfterSeconds ?? 15),
        },
      }
    );
  }

  const receipt = `ct_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

  try {
    const order = await createRazorpayOrder({
      amount: bundle.amountInPaise,
      currency: "INR",
      receipt,
      notes: {
        clerk_user_id: userId,
        connects: String(bundle.connects),
        product: "connects_topup",
      },
    });

    return NextResponse.json({
      keyId: getRazorpayPublicKeyId(),
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      connects: bundle.connects,
    });
  } catch (error) {
    logOrderFailure("order_creation_failed", {
      userId,
      connects,
      error: error instanceof Error ? error.message : String(error),
    });
    const message = error instanceof Error ? error.message : "Could not create Razorpay order.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

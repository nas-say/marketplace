import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { creditRazorpayTopup, hasRazorpayTopupCredit } from "@/lib/db/connects";
import { enforceUserCooldown, enforceUserRateLimit } from "@/lib/payments/abuse-guard";
import {
  captureRazorpayPayment,
  getInrBundleByConnects,
  getRazorpayOrder,
  getRazorpayPayment,
  verifyRazorpaySignature,
} from "@/lib/payments/razorpay";

export const runtime = "nodejs";

interface VerifyBody {
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
}

function logVerifyFailure(reason: string, context: Record<string, unknown>) {
  console.error("[razorpay/verify] request failed", { reason, ...context });
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    logVerifyFailure("not_authenticated", {});
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as VerifyBody | null;
  const orderId = body?.razorpay_order_id?.trim() ?? "";
  const paymentId = body?.razorpay_payment_id?.trim() ?? "";
  const signature = body?.razorpay_signature?.trim() ?? "";

  if (!orderId || !paymentId || !signature) {
    logVerifyFailure("missing_fields", { userId, orderId, paymentId });
    return NextResponse.json({ error: "Missing payment verification fields." }, { status: 400 });
  }

  const rateLimit = await enforceUserRateLimit({
    userId,
    action: "connects_verify",
    request,
    windowMs: 60_000,
    maxRequests: 16,
  });
  if (!rateLimit.allowed) {
    logVerifyFailure("rate_limited", { userId, orderId, paymentId });
    return NextResponse.json(
      { error: "Too many verification attempts. Please try again shortly." },
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
    action: "connects_verify_payment",
    scope: paymentId,
    request,
    cooldownMs: 4_000,
  });
  if (!cooldown.allowed) {
    logVerifyFailure("cooldown_blocked", { userId, paymentId });
    return NextResponse.json(
      { error: "Verification already in progress. Please retry in a moment." },
      {
        status: 429,
        headers: {
          "Retry-After": String(cooldown.retryAfterSeconds ?? 4),
        },
      }
    );
  }

  if (!verifyRazorpaySignature({ orderId, paymentId, signature })) {
    logVerifyFailure("invalid_signature", { userId, orderId, paymentId });
    return NextResponse.json({ error: "Invalid Razorpay signature." }, { status: 400 });
  }

  const alreadyCredited = await hasRazorpayTopupCredit(userId, paymentId);
  if (alreadyCredited) {
    return NextResponse.json({
      success: true,
      credited: false,
      connectsAdded: 0,
    });
  }

  try {
    const [order, initialPayment] = await Promise.all([
      getRazorpayOrder(orderId),
      getRazorpayPayment(paymentId),
    ]);

    if (order.notes?.clerk_user_id !== userId) {
      logVerifyFailure("order_owner_mismatch", { userId, orderId, paymentId });
      return NextResponse.json({ error: "Order does not belong to this user." }, { status: 403 });
    }

    const connects = Number(order.notes?.connects ?? "");
    const bundle = getInrBundleByConnects(connects);
    if (!bundle) {
      logVerifyFailure("invalid_bundle_metadata", { userId, orderId, paymentId, connects });
      return NextResponse.json({ error: "Invalid bundle metadata on Razorpay order." }, { status: 400 });
    }

    if (order.currency !== "INR" || order.amount !== bundle.amountInPaise) {
      logVerifyFailure("order_amount_mismatch", {
        userId,
        orderId,
        paymentId,
        orderAmount: order.amount,
        expectedAmount: bundle.amountInPaise,
      });
      return NextResponse.json({ error: "Razorpay order amount mismatch." }, { status: 400 });
    }

    if (initialPayment.order_id !== orderId) {
      logVerifyFailure("payment_order_mismatch", {
        userId,
        orderId,
        paymentId,
        paymentOrderId: initialPayment.order_id,
      });
      return NextResponse.json({ error: "Payment does not match order." }, { status: 400 });
    }

    let payment = initialPayment;
    if (payment.status === "authorized" && !payment.captured) {
      payment = await captureRazorpayPayment(paymentId, payment.amount);
    }

    if (payment.status !== "captured" || !payment.captured) {
      logVerifyFailure("payment_not_captured", { userId, orderId, paymentId, paymentStatus: payment.status });
      return NextResponse.json({ error: "Payment is not captured yet." }, { status: 400 });
    }

    if (payment.currency !== "INR" || payment.amount !== bundle.amountInPaise) {
      logVerifyFailure("payment_amount_mismatch", {
        userId,
        orderId,
        paymentId,
        paymentAmount: payment.amount,
        expectedAmount: bundle.amountInPaise,
      });
      return NextResponse.json({ error: "Razorpay payment amount mismatch." }, { status: 400 });
    }

    const creditResult = await creditRazorpayTopup(userId, bundle.connects, orderId, paymentId);
    if (creditResult.error) {
      logVerifyFailure("credit_failed", { userId, orderId, paymentId, error: creditResult.error });
      return NextResponse.json({ error: creditResult.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      credited: creditResult.credited,
      connectsAdded: creditResult.credited ? bundle.connects : 0,
    });
  } catch (error) {
    logVerifyFailure("unexpected_exception", {
      userId,
      orderId,
      paymentId,
      error: error instanceof Error ? error.message : String(error),
    });
    const message = error instanceof Error ? error.message : "Could not verify Razorpay payment.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

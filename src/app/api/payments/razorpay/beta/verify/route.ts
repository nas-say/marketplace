import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { enforceUserCooldown, enforceUserRateLimit } from "@/lib/payments/abuse-guard";
import {
  captureRazorpayPayment,
  getRazorpayOrder,
  getRazorpayPayment,
  verifyRazorpaySignature,
} from "@/lib/payments/razorpay";

export const runtime = "nodejs";
const MAX_POOL_SYNC_RETRIES = 5;

interface VerifyBody {
  betaTestId?: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
}

function logBetaVerifyFailure(reason: string, context: Record<string, unknown>) {
  console.error("[razorpay/beta/verify] request failed", { reason, ...context });
}

async function syncRewardPoolFromPayments(
  client: ReturnType<typeof createServiceClient>,
  params: {
    betaTestId: string;
    userId: string;
    latestPaymentId: string;
  }
): Promise<
  | { success: true; poolFundedMinor: number; poolTotalMinor: number; poolStatus: string }
  | { success: false; error: string }
> {
  const { betaTestId, userId, latestPaymentId } = params;

  for (let attempt = 0; attempt < MAX_POOL_SYNC_RETRIES; attempt += 1) {
    const { data: currentPool, error: currentPoolError } = await client
      .from("beta_tests")
      .select("reward_pool_total_minor, reward_pool_funded_minor")
      .eq("id", betaTestId)
      .eq("creator_id", userId)
      .maybeSingle();

    if (currentPoolError || !currentPool) {
      return { success: false, error: "Could not load reward pool state." };
    }

    const poolTotalMinor = Math.max(0, Number(currentPool.reward_pool_total_minor ?? 0));
    const poolFundedMinor = Math.max(0, Number(currentPool.reward_pool_funded_minor ?? 0));

    const { data: paymentRows, error: paymentRowsError } = await client
      .from("beta_reward_payments")
      .select("amount_minor")
      .eq("beta_test_id", betaTestId);

    if (paymentRowsError) {
      return { success: false, error: "Could not recalculate funded reward pool amount." };
    }

    const fundedFromPayments = ((paymentRows ?? []) as Array<{ amount_minor?: number | string | null }>).reduce(
      (sum, row) => sum + Math.max(0, Number(row.amount_minor ?? 0)),
      0
    );

    // Never decrease funded amount, even under concurrent requests.
    const nextFundedMinor = Math.max(poolFundedMinor, fundedFromPayments);
    const nextStatus =
      nextFundedMinor >= poolTotalMinor
        ? "funded"
        : nextFundedMinor > 0
        ? "partial"
        : poolTotalMinor > 0
        ? "pending"
        : "not_required";
    const nowIso = new Date().toISOString();

    const { data: updatedPool, error: updateError } = await client
      .from("beta_tests")
      .update({
        reward_pool_funded_minor: nextFundedMinor,
        reward_pool_status: nextStatus,
        reward_pool_payment_id: latestPaymentId,
        reward_pool_funded_at: nextStatus === "funded" ? nowIso : null,
      })
      .eq("id", betaTestId)
      .eq("creator_id", userId)
      .eq("reward_pool_funded_minor", poolFundedMinor)
      .select("reward_pool_funded_minor, reward_pool_total_minor, reward_pool_status")
      .maybeSingle();

    if (updateError) {
      return { success: false, error: "Could not update reward pool status." };
    }

    if (updatedPool) {
      return {
        success: true,
        poolFundedMinor: Math.max(0, Number(updatedPool.reward_pool_funded_minor ?? nextFundedMinor)),
        poolTotalMinor: Math.max(0, Number(updatedPool.reward_pool_total_minor ?? poolTotalMinor)),
        poolStatus: String(updatedPool.reward_pool_status ?? nextStatus),
      };
    }
  }

  return { success: false, error: "Could not finalize reward pool update due to concurrent requests." };
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    logBetaVerifyFailure("not_authenticated", {});
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as VerifyBody | null;
  const betaTestId = body?.betaTestId?.trim() ?? "";
  const orderId = body?.razorpay_order_id?.trim() ?? "";
  const paymentId = body?.razorpay_payment_id?.trim() ?? "";
  const signature = body?.razorpay_signature?.trim() ?? "";

  if (!betaTestId || !orderId || !paymentId || !signature) {
    logBetaVerifyFailure("missing_fields", { userId, betaTestId, orderId, paymentId });
    return NextResponse.json({ error: "Missing payment verification fields." }, { status: 400 });
  }

  const rateLimit = await enforceUserRateLimit({
    userId,
    action: "beta_verify",
    request,
    windowMs: 60_000,
    maxRequests: 12,
  });
  if (!rateLimit.allowed) {
    logBetaVerifyFailure("rate_limited", { userId, betaTestId, paymentId });
    return NextResponse.json(
      { error: "Too many funding verification attempts. Please try again shortly." },
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
    action: "beta_verify_payment",
    scope: paymentId,
    request,
    cooldownMs: 4_000,
  });
  if (!cooldown.allowed) {
    logBetaVerifyFailure("cooldown_blocked", { userId, betaTestId, paymentId });
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
    logBetaVerifyFailure("invalid_signature", { userId, betaTestId, orderId, paymentId });
    return NextResponse.json({ error: "Invalid Razorpay signature." }, { status: 400 });
  }

  const client = createServiceClient();
  const { data: betaTest, error: betaError } = await client
    .from("beta_tests")
    .select("creator_id, reward_type, reward_currency")
    .eq("id", betaTestId)
    .maybeSingle();

  if (betaError || !betaTest) {
    logBetaVerifyFailure("beta_test_not_found", { userId, betaTestId, orderId, paymentId });
    return NextResponse.json({ error: "Beta test not found." }, { status: 404 });
  }

  if ((betaTest.creator_id as string) !== userId) {
    logBetaVerifyFailure("creator_mismatch", { userId, betaTestId, orderId, paymentId });
    return NextResponse.json({ error: "Only the beta test creator can verify funding." }, { status: 403 });
  }

  if (String(betaTest.reward_type ?? "cash") !== "cash") {
    logBetaVerifyFailure("reward_type_not_cash", { userId, betaTestId, orderId, paymentId });
    return NextResponse.json({ error: "Funding applies only to cash rewards." }, { status: 400 });
  }
  if (String(betaTest.reward_currency ?? "INR") !== "INR") {
    logBetaVerifyFailure("reward_currency_not_inr", { userId, betaTestId, orderId, paymentId });
    return NextResponse.json({ error: "Only INR funding is supported right now." }, { status: 400 });
  }

  try {
    const { data: existingPayment, error: existingError } = await client
      .from("beta_reward_payments")
      .select("id")
      .eq("payment_id", paymentId)
      .maybeSingle();

    if (!existingError && existingPayment) {
      const synced = await syncRewardPoolFromPayments(client, {
        betaTestId,
        userId,
        latestPaymentId: paymentId,
      });
      if (!synced.success) {
        logBetaVerifyFailure("sync_existing_payment_failed", {
          userId,
          betaTestId,
          orderId,
          paymentId,
          error: synced.error,
        });
        return NextResponse.json({ error: synced.error }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        credited: false,
        fundedAmountMinor: 0,
        poolFundedMinor: synced.poolFundedMinor,
        poolTotalMinor: synced.poolTotalMinor,
        poolStatus: synced.poolStatus,
      });
    }

    const [order, initialPayment] = await Promise.all([
      getRazorpayOrder(orderId),
      getRazorpayPayment(paymentId),
    ]);

    if (order.notes?.beta_test_id !== betaTestId || order.notes?.creator_id !== userId) {
      logBetaVerifyFailure("order_metadata_mismatch", { userId, betaTestId, orderId, paymentId });
      return NextResponse.json({ error: "Razorpay order metadata mismatch." }, { status: 400 });
    }

    if (order.currency !== "INR" || order.amount <= 0) {
      logBetaVerifyFailure("order_invalid_for_pool", {
        userId,
        betaTestId,
        orderId,
        paymentId,
        orderCurrency: order.currency,
        orderAmount: order.amount,
      });
      return NextResponse.json({ error: "Invalid Razorpay order for INR funding." }, { status: 400 });
    }

    if (initialPayment.order_id !== orderId) {
      logBetaVerifyFailure("payment_order_mismatch", {
        userId,
        betaTestId,
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
      logBetaVerifyFailure("payment_not_captured", {
        userId,
        betaTestId,
        orderId,
        paymentId,
        paymentStatus: payment.status,
      });
      return NextResponse.json({ error: "Payment is not captured yet." }, { status: 400 });
    }

    if (payment.currency !== "INR") {
      logBetaVerifyFailure("payment_currency_not_inr", { userId, betaTestId, orderId, paymentId });
      return NextResponse.json({ error: "Only INR payments are valid for beta funding." }, { status: 400 });
    }

    if (payment.amount !== order.amount) {
      logBetaVerifyFailure("payment_amount_mismatch", {
        userId,
        betaTestId,
        orderId,
        paymentId,
        orderAmount: order.amount,
        paymentAmount: payment.amount,
      });
      return NextResponse.json({ error: "Razorpay payment amount mismatch." }, { status: 400 });
    }

    const { error: insertError } = await client.from("beta_reward_payments").insert({
      beta_test_id: betaTestId,
      creator_id: userId,
      order_id: orderId,
      payment_id: paymentId,
      amount_minor: payment.amount,
      currency: "INR",
      status: "captured",
    });

    if (insertError && insertError.code !== "23505") {
      logBetaVerifyFailure("record_payment_failed", { userId, betaTestId, orderId, paymentId });
      return NextResponse.json({ error: "Could not record payment for reward pool." }, { status: 500 });
    }

    const synced = await syncRewardPoolFromPayments(client, {
      betaTestId,
      userId,
      latestPaymentId: paymentId,
    });
    if (!synced.success) {
      logBetaVerifyFailure("update_pool_failed", {
        userId,
        betaTestId,
        orderId,
        paymentId,
        error: synced.error,
      });
      return NextResponse.json({ error: synced.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      credited: !insertError,
      fundedAmountMinor: insertError ? 0 : payment.amount,
      poolFundedMinor: synced.poolFundedMinor,
      poolTotalMinor: synced.poolTotalMinor,
      poolStatus: synced.poolStatus,
    });
  } catch (error) {
    logBetaVerifyFailure("unexpected_exception", {
      userId,
      betaTestId,
      orderId,
      paymentId,
      error: error instanceof Error ? error.message : String(error),
    });
    const message = error instanceof Error ? error.message : "Could not verify beta reward funding.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import {
  captureRazorpayPayment,
  getRazorpayOrder,
  getRazorpayPayment,
  verifyRazorpaySignature,
} from "@/lib/payments/razorpay";

export const runtime = "nodejs";

interface VerifyBody {
  betaTestId?: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as VerifyBody | null;
  const betaTestId = body?.betaTestId?.trim() ?? "";
  const orderId = body?.razorpay_order_id?.trim() ?? "";
  const paymentId = body?.razorpay_payment_id?.trim() ?? "";
  const signature = body?.razorpay_signature?.trim() ?? "";

  if (!betaTestId || !orderId || !paymentId || !signature) {
    return NextResponse.json({ error: "Missing payment verification fields." }, { status: 400 });
  }

  if (!verifyRazorpaySignature({ orderId, paymentId, signature })) {
    return NextResponse.json({ error: "Invalid Razorpay signature." }, { status: 400 });
  }

  const client = createServiceClient();
  const { data: betaTest, error: betaError } = await client
    .from("beta_tests")
    .select("*")
    .eq("id", betaTestId)
    .maybeSingle();

  if (betaError || !betaTest) {
    return NextResponse.json({ error: "Beta test not found." }, { status: 404 });
  }

  if ((betaTest.creator_id as string) !== userId) {
    return NextResponse.json({ error: "Only the beta test creator can verify funding." }, { status: 403 });
  }

  if (String(betaTest.reward_type ?? "cash") !== "cash") {
    return NextResponse.json({ error: "Funding applies only to cash rewards." }, { status: 400 });
  }
  if (String(betaTest.reward_currency ?? "INR") !== "INR") {
    return NextResponse.json({ error: "Only INR funding is supported right now." }, { status: 400 });
  }
  if (String(betaTest.reward_pool_order_id ?? "") !== orderId) {
    return NextResponse.json({ error: "Payment order does not match current reward funding order." }, { status: 400 });
  }

  try {
    const { data: existingPayment, error: existingError } = await client
      .from("beta_reward_payments")
      .select("id, amount_minor")
      .eq("payment_id", paymentId)
      .maybeSingle();

    if (!existingError && existingPayment) {
      return NextResponse.json({ success: true, credited: false, fundedAmountMinor: 0 });
    }

    const [order, initialPayment] = await Promise.all([
      getRazorpayOrder(orderId),
      getRazorpayPayment(paymentId),
    ]);

    if (order.notes?.beta_test_id !== betaTestId || order.notes?.creator_id !== userId) {
      return NextResponse.json({ error: "Razorpay order metadata mismatch." }, { status: 400 });
    }

    if (initialPayment.order_id !== orderId) {
      return NextResponse.json({ error: "Payment does not match order." }, { status: 400 });
    }

    let payment = initialPayment;
    if (payment.status === "authorized" && !payment.captured) {
      payment = await captureRazorpayPayment(paymentId, payment.amount);
    }

    if (payment.status !== "captured" || !payment.captured) {
      return NextResponse.json({ error: "Payment is not captured yet." }, { status: 400 });
    }

    if (payment.currency !== "INR") {
      return NextResponse.json({ error: "Only INR payments are valid for beta funding." }, { status: 400 });
    }

    const poolTotalMinor = Number(betaTest.reward_pool_total_minor ?? 0);
    const poolFundedMinor = Number(betaTest.reward_pool_funded_minor ?? 0);
    const remainingMinor = Math.max(0, poolTotalMinor - poolFundedMinor);
    if (remainingMinor <= 0) {
      return NextResponse.json({ error: "Reward pool is already fully funded." }, { status: 400 });
    }

    if (payment.amount > remainingMinor) {
      return NextResponse.json({ error: "Payment amount exceeds remaining reward pool amount." }, { status: 400 });
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

    if (insertError) {
      if (insertError.code === "23505") {
        return NextResponse.json({ success: true, credited: false, fundedAmountMinor: 0 });
      }
      return NextResponse.json({ error: "Could not record payment for reward pool." }, { status: 500 });
    }

    const newFundedMinor = poolFundedMinor + payment.amount;
    const newStatus = newFundedMinor >= poolTotalMinor ? "funded" : "partial";
    const nowIso = new Date().toISOString();

    const { error: updateError } = await client
      .from("beta_tests")
      .update({
        reward_pool_funded_minor: newFundedMinor,
        reward_pool_status: newStatus,
        reward_pool_payment_id: paymentId,
        reward_pool_funded_at: newStatus === "funded" ? nowIso : betaTest.reward_pool_funded_at,
      })
      .eq("id", betaTestId)
      .eq("creator_id", userId);

    if (updateError) {
      await client.from("beta_reward_payments").delete().eq("payment_id", paymentId);
      return NextResponse.json({ error: "Could not update reward pool status." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      credited: true,
      fundedAmountMinor: payment.amount,
      poolFundedMinor: newFundedMinor,
      poolTotalMinor,
      poolStatus: newStatus,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not verify beta reward funding.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

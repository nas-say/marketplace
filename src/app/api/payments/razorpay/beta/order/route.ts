import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { createRazorpayOrder, getRazorpayPublicKeyId } from "@/lib/payments/razorpay";

export const runtime = "nodejs";

interface CreateOrderBody {
  betaTestId?: string;
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as CreateOrderBody | null;
  const betaTestId = body?.betaTestId?.trim() ?? "";
  if (!betaTestId) {
    return NextResponse.json({ error: "Missing beta test id." }, { status: 400 });
  }

  const client = createServiceClient();
  const { data: betaTest, error: betaError } = await client
    .from("beta_tests")
    .select(
      "id, creator_id, reward_type, reward_currency, reward_pool_total_minor, reward_pool_funded_minor, reward_pool_status"
    )
    .eq("id", betaTestId)
    .maybeSingle();

  if (betaError || !betaTest) {
    return NextResponse.json({ error: "Beta test not found." }, { status: 404 });
  }

  if ((betaTest.creator_id as string) !== userId) {
    return NextResponse.json({ error: "Only the beta test creator can fund rewards." }, { status: 403 });
  }

  const rewardType = String(betaTest.reward_type ?? "cash");
  const rewardCurrency = String(betaTest.reward_currency ?? "INR");
  const poolTotalMinor = Number(betaTest.reward_pool_total_minor ?? 0);
  const poolFundedMinor = Number(betaTest.reward_pool_funded_minor ?? 0);

  if (rewardType !== "cash") {
    return NextResponse.json({ error: "Funding is required only for cash rewards." }, { status: 400 });
  }
  if (rewardCurrency !== "INR") {
    return NextResponse.json({ error: "Only INR cash reward funding is supported right now." }, { status: 400 });
  }
  if (poolTotalMinor <= 0) {
    return NextResponse.json({ error: "Reward pool total is not configured." }, { status: 400 });
  }

  const remainingMinor = Math.max(0, poolTotalMinor - poolFundedMinor);
  if (remainingMinor <= 0 || betaTest.reward_pool_status === "funded") {
    return NextResponse.json({ error: "Reward pool is already fully funded." }, { status: 400 });
  }

  const receipt = `beta_${betaTestId}_${Date.now().toString(36)}`;

  try {
    const order = await createRazorpayOrder({
      amount: remainingMinor,
      currency: "INR",
      receipt,
      notes: {
        purpose: "beta_reward_pool",
        beta_test_id: betaTestId,
        creator_id: userId,
      },
    });

    const { error: updateError } = await client
      .from("beta_tests")
      .update({
        reward_pool_order_id: order.id,
        reward_pool_status: poolFundedMinor > 0 ? "partial" : "pending",
      })
      .eq("id", betaTestId)
      .eq("creator_id", userId);

    if (updateError) {
      return NextResponse.json({ error: "Could not persist beta reward order." }, { status: 500 });
    }

    return NextResponse.json({
      keyId: getRazorpayPublicKeyId(),
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      betaTestId,
      poolTotalMinor,
      poolFundedMinor,
      remainingMinor,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create Razorpay order.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

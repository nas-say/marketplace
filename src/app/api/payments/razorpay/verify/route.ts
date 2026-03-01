import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { creditRazorpayTopup } from "@/lib/db/connects";
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

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as VerifyBody | null;
  const orderId = body?.razorpay_order_id?.trim() ?? "";
  const paymentId = body?.razorpay_payment_id?.trim() ?? "";
  const signature = body?.razorpay_signature?.trim() ?? "";

  if (!orderId || !paymentId || !signature) {
    return NextResponse.json({ error: "Missing payment verification fields." }, { status: 400 });
  }

  if (!verifyRazorpaySignature({ orderId, paymentId, signature })) {
    return NextResponse.json({ error: "Invalid Razorpay signature." }, { status: 400 });
  }

  try {
    const [order, initialPayment] = await Promise.all([
      getRazorpayOrder(orderId),
      getRazorpayPayment(paymentId),
    ]);

    if (order.notes?.clerk_user_id !== userId) {
      return NextResponse.json({ error: "Order does not belong to this user." }, { status: 403 });
    }

    const connects = Number(order.notes?.connects ?? "");
    const bundle = getInrBundleByConnects(connects);
    if (!bundle) {
      return NextResponse.json({ error: "Invalid bundle metadata on Razorpay order." }, { status: 400 });
    }

    if (order.currency !== "INR" || order.amount !== bundle.amountInPaise) {
      return NextResponse.json({ error: "Razorpay order amount mismatch." }, { status: 400 });
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

    if (payment.currency !== "INR" || payment.amount !== bundle.amountInPaise) {
      return NextResponse.json({ error: "Razorpay payment amount mismatch." }, { status: 400 });
    }

    const creditResult = await creditRazorpayTopup(userId, bundle.connects, orderId, paymentId);
    if (creditResult.error) {
      return NextResponse.json({ error: creditResult.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      credited: creditResult.credited,
      connectsAdded: creditResult.credited ? bundle.connects : 0,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not verify Razorpay payment.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

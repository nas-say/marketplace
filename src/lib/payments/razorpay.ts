import { createHmac, timingSafeEqual } from "crypto";

interface RazorpayOrderCreateInput {
  amount: number;
  currency: "INR";
  receipt: string;
  notes: Record<string, string>;
}

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  status: string;
  receipt: string;
  notes: Record<string, string>;
}

export interface RazorpayPayment {
  id: string;
  order_id: string | null;
  amount: number;
  currency: string;
  status: string;
  captured: boolean;
}

const RAZORPAY_API_BASE = "https://api.razorpay.com/v1";

export const INR_CONNECT_BUNDLES = [
  { connects: 10, amountInPaise: 20000 },
  { connects: 25, amountInPaise: 38000 },
  { connects: 60, amountInPaise: 82000 },
] as const;

function getRazorpayCredentials() {
  const keyId = normalizeSecret(process.env.RazorpayLiveKeyId ?? process.env.RAZORPAY_KEY_ID);
  const keySecret = normalizeSecret(
    process.env.RazorpayLiveKeySecret ?? process.env.RAZORPAY_KEY_SECRET
  );

  if (!keyId || !keySecret) {
    throw new Error("Razorpay credentials are missing.");
  }

  return { keyId, keySecret };
}

function normalizeSecret(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (
    (trimmed.startsWith("\"") && trimmed.endsWith("\"")) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

function getRazorpayAuthHeader(): string {
  const { keyId, keySecret } = getRazorpayCredentials();
  return `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`;
}

async function parseRazorpayError(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as {
      error?: { description?: string; reason?: string; code?: string };
    };
    return (
      payload.error?.description ??
      payload.error?.reason ??
      payload.error?.code ??
      `Razorpay request failed with status ${response.status}`
    );
  } catch {
    return `Razorpay request failed with status ${response.status}`;
  }
}

async function razorpayRequest<T>(
  path: string,
  init?: Omit<RequestInit, "headers"> & { headers?: HeadersInit }
): Promise<T> {
  const response = await fetch(`${RAZORPAY_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: getRazorpayAuthHeader(),
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await parseRazorpayError(response));
  }

  return (await response.json()) as T;
}

export function getInrBundleByConnects(connects: number) {
  return INR_CONNECT_BUNDLES.find((bundle) => bundle.connects === connects) ?? null;
}

export function getRazorpayPublicKeyId() {
  return getRazorpayCredentials().keyId;
}

export function verifyRazorpaySignature({
  orderId,
  paymentId,
  signature,
}: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const { keySecret } = getRazorpayCredentials();
  const expected = createHmac("sha256", keySecret).update(`${orderId}|${paymentId}`).digest("hex");

  const expectedBuffer = Buffer.from(expected, "hex");
  const signatureBuffer = Buffer.from(signature, "hex");
  if (expectedBuffer.length !== signatureBuffer.length) return false;
  return timingSafeEqual(expectedBuffer, signatureBuffer);
}

export async function createRazorpayOrder(input: RazorpayOrderCreateInput): Promise<RazorpayOrder> {
  return razorpayRequest<RazorpayOrder>("/orders", {
    method: "POST",
    body: JSON.stringify({
      amount: input.amount,
      currency: input.currency,
      receipt: input.receipt,
      notes: input.notes,
    }),
  });
}

export async function getRazorpayOrder(orderId: string): Promise<RazorpayOrder> {
  return razorpayRequest<RazorpayOrder>(`/orders/${orderId}`, { method: "GET" });
}

export async function getRazorpayPayment(paymentId: string): Promise<RazorpayPayment> {
  return razorpayRequest<RazorpayPayment>(`/payments/${paymentId}`, { method: "GET" });
}

export async function captureRazorpayPayment(paymentId: string, amount: number): Promise<RazorpayPayment> {
  return razorpayRequest<RazorpayPayment>(`/payments/${paymentId}/capture`, {
    method: "POST",
    body: JSON.stringify({
      amount,
      currency: "INR",
    }),
  });
}

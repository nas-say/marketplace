import "server-only";

interface PayoutEmailPayload {
  betaTestId: string;
  betaTestTitle: string;
  applicantUserId: string;
  testerEmail: string | null;
  creatorEmail: string | null;
  previousStatus: "pending" | "paid" | "failed";
  nextStatus: "pending" | "paid" | "failed";
  payoutNote: string | null;
  payoutGrossMinor: number | null;
  payoutFeeMinor: number | null;
  payoutNetMinor: number | null;
  currency: string;
}

interface PayoutNotificationResult {
  testerSent: boolean;
  creatorSent: boolean;
}

interface ClerkEmailAddress {
  id?: string;
  email_address?: string;
}

interface ClerkUserResponse {
  primary_email_address_id?: string | null;
  email_addresses?: ClerkEmailAddress[];
}

function formatCurrencyMinor(amountMinor: number | null | undefined, currency: string): string {
  const safeAmountMinor = Number.isFinite(Number(amountMinor)) ? Math.max(0, Number(amountMinor)) : 0;
  const normalizedCurrency = (currency || "INR").toUpperCase();
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: normalizedCurrency,
      maximumFractionDigits: 2,
    }).format(safeAmountMinor / 100);
  } catch {
    return `${normalizedCurrency} ${(safeAmountMinor / 100).toFixed(2)}`;
  }
}

function makeStatusLabel(status: PayoutEmailPayload["nextStatus"]): string {
  if (status === "paid") return "Paid";
  if (status === "failed") return "Failed";
  return "Pending";
}

async function sendResendEmail(params: {
  apiKey: string;
  from: string;
  to: string;
  subject: string;
  text: string;
}): Promise<boolean> {
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${params.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: params.from,
        to: [params.to],
        subject: params.subject,
        text: params.text,
      }),
      cache: "no-store",
    });
    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error("[payout-status] email send failed", {
        to: params.to,
        status: response.status,
        errorText,
      });
      return false;
    }
    return true;
  } catch (error) {
    console.error("[payout-status] email send exception", {
      to: params.to,
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

export async function getClerkPrimaryEmail(clerkUserId: string): Promise<string | null> {
  const key = process.env.CLERK_SECRET_KEY?.trim();
  if (!key || !clerkUserId) return null;

  try {
    const response = await fetch(`https://api.clerk.com/v1/users/${clerkUserId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });
    if (!response.ok) return null;

    const user = (await response.json()) as ClerkUserResponse;
    const primaryId = user.primary_email_address_id;
    const emails = Array.isArray(user.email_addresses) ? user.email_addresses : [];
    if (!primaryId) return emails[0]?.email_address ?? null;
    return emails.find((entry) => entry.id === primaryId)?.email_address ?? emails[0]?.email_address ?? null;
  } catch (error) {
    console.error("[payout-status] failed to read creator email from Clerk", {
      clerkUserId,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

export async function sendPayoutStatusNotifications(
  payload: PayoutEmailPayload
): Promise<PayoutNotificationResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const fromEmail =
    process.env.PAYOUT_NOTIFY_FROM_EMAIL?.trim() ||
    process.env.INTEREST_FROM_EMAIL?.trim() ||
    "SideFlip <onboarding@resend.dev>";

  if (!apiKey) {
    return { testerSent: false, creatorSent: false };
  }

  const statusLabel = makeStatusLabel(payload.nextStatus);
  const payoutGross = formatCurrencyMinor(payload.payoutGrossMinor, payload.currency);
  const payoutFee = formatCurrencyMinor(payload.payoutFeeMinor, payload.currency);
  const payoutNet = formatCurrencyMinor(payload.payoutNetMinor, payload.currency);
  const transition = `${payload.previousStatus} -> ${payload.nextStatus}`;
  const noteText = payload.payoutNote ? payload.payoutNote : "No note provided.";

  let testerSent = false;
  if (payload.testerEmail) {
    testerSent = await sendResendEmail({
      apiKey,
      from: fromEmail,
      to: payload.testerEmail,
      subject: `[SideFlip] Payout ${statusLabel} for ${payload.betaTestTitle}`,
      text: [
        `Your payout status was updated on SideFlip.`,
        "",
        `Beta test: ${payload.betaTestTitle}`,
        `Status: ${statusLabel}`,
        `Transition: ${transition}`,
        "",
        `Gross reward: ${payoutGross}`,
        `Platform fee (5%): ${payoutFee}`,
        `Net payout: ${payoutNet}`,
        "",
        `Admin note: ${noteText}`,
        "",
        `Reference: ${payload.betaTestId} / ${payload.applicantUserId}`,
      ].join("\n"),
    });
  }

  let creatorSent = false;
  if (payload.creatorEmail) {
    creatorSent = await sendResendEmail({
      apiKey,
      from: fromEmail,
      to: payload.creatorEmail,
      subject: `[SideFlip] Tester payout ${statusLabel}: ${payload.betaTestTitle}`,
      text: [
        `A tester payout status changed for your beta test.`,
        "",
        `Beta test: ${payload.betaTestTitle}`,
        `Status: ${statusLabel}`,
        `Transition: ${transition}`,
        "",
        `Gross reward: ${payoutGross}`,
        `Platform fee (5%): ${payoutFee}`,
        `Net payout: ${payoutNet}`,
        "",
        `Admin note: ${noteText}`,
        "",
        `Tester ID: ${payload.applicantUserId}`,
        `Beta test ID: ${payload.betaTestId}`,
      ].join("\n"),
    });
  }

  return { testerSent, creatorSent };
}

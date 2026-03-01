interface PaymentInterestPayload {
  userId: string;
  feature: string;
  countryCode: string;
  currency: string;
  context?: Record<string, unknown>;
}

interface SendNotificationResult {
  sent: boolean;
}

function toStringMap(value: Record<string, unknown> | undefined): string {
  if (!value) return "{}";
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return "{}";
  }
}

export async function sendPaymentInterestNotification(
  payload: PaymentInterestPayload
): Promise<SendNotificationResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const notifyEmail = process.env.INTEREST_NOTIFY_EMAIL?.trim();
  const fromEmail = process.env.INTEREST_FROM_EMAIL?.trim() || "SideFlip <onboarding@resend.dev>";

  if (!apiKey || !notifyEmail) {
    console.info("[payment-interest] notification skipped (missing env)", {
      hasResendApiKey: Boolean(apiKey),
      hasNotifyEmail: Boolean(notifyEmail),
      payload,
    });
    return { sent: false };
  }

  const subject = `[SideFlip] Payment interest: ${payload.feature} (${payload.countryCode || "unknown-country"})`;
  const text = [
    "A user marked payment interest.",
    "",
    `User ID: ${payload.userId}`,
    `Feature: ${payload.feature}`,
    `Country: ${payload.countryCode || "unknown"}`,
    `Currency: ${payload.currency || "unknown"}`,
    "",
    "Context:",
    toStringMap(payload.context),
  ].join("\n");

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [notifyEmail],
        subject,
        text,
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error("[payment-interest] email send failed", {
        status: response.status,
        errorText,
      });
      return { sent: false };
    }

    return { sent: true };
  } catch (error) {
    console.error("[payment-interest] email send exception", {
      error: error instanceof Error ? error.message : String(error),
    });
    return { sent: false };
  }
}

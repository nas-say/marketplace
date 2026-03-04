import "server-only";

interface TurnstileVerifyResponse {
  success: boolean;
  action?: string;
  "error-codes"?: string[];
}

export interface TurnstileVerificationInput {
  token?: string;
  expectedAction: string;
  remoteIp?: string;
  userId?: string;
}

export interface TurnstileVerificationResult {
  ok: boolean;
  error?: string;
}

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

function getTurnstileConfig(): { siteKey: string; secretKey: string } {
  return {
    siteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? "",
    secretKey: process.env.TURNSTILE_SECRET_KEY?.trim() ?? "",
  };
}

export function isTurnstileEnforced(): boolean {
  const { siteKey, secretKey } = getTurnstileConfig();
  return Boolean(siteKey && secretKey);
}

export async function verifyTurnstileToken(
  input: TurnstileVerificationInput
): Promise<TurnstileVerificationResult> {
  if (!isTurnstileEnforced()) {
    return { ok: true };
  }

  if (!input.token) {
    return { ok: false, error: "Please complete the security check and try again." };
  }

  const { secretKey } = getTurnstileConfig();
  const body = new URLSearchParams({
    secret: secretKey,
    response: input.token,
  });
  if (input.remoteIp) {
    body.set("remoteip", input.remoteIp);
  }

  try {
    const response = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("[turnstile] verification request failed", {
        status: response.status,
        expectedAction: input.expectedAction,
        userId: input.userId ?? "unknown",
      });
      return { ok: false, error: "Security check failed. Please retry." };
    }

    const data = (await response.json()) as TurnstileVerifyResponse;
    if (!data.success) {
      return { ok: false, error: "Security check failed. Please retry." };
    }

    if (data.action && data.action !== input.expectedAction) {
      console.error("[turnstile] action mismatch", {
        expectedAction: input.expectedAction,
        receivedAction: data.action,
        userId: input.userId ?? "unknown",
      });
      return { ok: false, error: "Security check mismatch. Please retry." };
    }

    return { ok: true };
  } catch (error) {
    console.error("[turnstile] verification exception", {
      expectedAction: input.expectedAction,
      userId: input.userId ?? "unknown",
      error: error instanceof Error ? error.message : String(error),
    });
    return { ok: false, error: "Security check failed. Please retry." };
  }
}

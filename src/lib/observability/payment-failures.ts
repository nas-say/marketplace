import { randomUUID } from "node:crypto";

type PaymentFailureLevel = "error" | "warning";

const REPORTABLE_REASONS = new Set([
  "invalid_signature",
  "order_owner_mismatch",
  "order_metadata_mismatch",
  "order_amount_mismatch",
  "payment_order_mismatch",
  "payment_amount_mismatch",
  "payment_not_captured",
  "order_creation_failed",
  "persist_interest_failed",
  "persist_order_failed",
  "record_payment_failed",
  "sync_existing_payment_failed",
  "update_pool_failed",
  "credit_failed",
  "unexpected_exception",
]);

function resolveLevel(reason: string): PaymentFailureLevel {
  if (reason.endsWith("_failed") || reason === "unexpected_exception") return "error";
  return "warning";
}

export function logPaymentFailure(route: string, reason: string, context: Record<string, unknown>) {
  void logPaymentFailureWithOptions(route, reason, context, {});
}

async function sendPaymentFailureEvent(
  route: string,
  reason: string,
  level: PaymentFailureLevel,
  context: Record<string, unknown>
) {
  const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return;

  const dsnUrl = new URL(dsn);
  const projectId = dsnUrl.pathname.replace("/", "");
  if (!projectId) return;

  const eventId = randomUUID().replace(/-/g, "");
  const message = `payment_failure:${route}:${reason}`;
  const envelopeHeader = {
    event_id: eventId,
    dsn,
  };
  const itemHeader = { type: "event" };
  const payload = {
    event_id: eventId,
    message,
    level,
    platform: "node",
    environment: process.env.SENTRY_ENVIRONMENT || process.env.VERCEL_ENV || process.env.NODE_ENV,
    tags: {
      area: "payments",
      "payments.route": route,
      "payments.reason": reason,
    },
    extra: context,
    timestamp: new Date().toISOString(),
  };

  const envelope = `${JSON.stringify(envelopeHeader)}\n${JSON.stringify(itemHeader)}\n${JSON.stringify(payload)}`;
  const endpoint = `${dsnUrl.protocol}//${dsnUrl.host}/api/${projectId}/envelope/`;
  await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/x-sentry-envelope" },
    body: envelope,
  });
}

export async function logPaymentFailureWithOptions(
  route: string,
  reason: string,
  context: Record<string, unknown>,
  options: { forceReport?: boolean }
) {
  console.error(`[${route}] request failed`, { reason, ...context });

  if (!options.forceReport && !REPORTABLE_REASONS.has(reason)) {
    return;
  }

  const level = resolveLevel(reason);
  await sendPaymentFailureEvent(route, reason, level, context);
}

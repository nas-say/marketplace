import * as Sentry from "@sentry/nextjs";

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
  return logPaymentFailureWithOptions(route, reason, context, {});
}

export function logPaymentFailureWithOptions(
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
  Sentry.withScope((scope) => {
    scope.setLevel(level);
    scope.setTag("area", "payments");
    scope.setTag("payments.route", route);
    scope.setTag("payments.reason", reason);
    for (const [key, value] of Object.entries(context)) {
      scope.setExtra(key, value as never);
    }
    Sentry.captureMessage(`payment_failure:${route}:${reason}`);
  });
}

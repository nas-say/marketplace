"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { isAdminUser } from "@/lib/admin-access";
import { getClerkPrimaryEmail, sendPayoutStatusNotifications } from "@/lib/notifications/payout-status";
import { createServiceClient } from "@/lib/supabase";

const ALLOWED_PAYOUT_STATUSES = new Set(["pending", "paid", "failed"]);

interface JoinedBetaTestRow {
  id?: string;
  title?: string;
  reward_type?: string;
  reward_currency?: string;
  creator_id?: string;
}

interface ApplicationLookupRow {
  status?: string;
  payout_status?: string | null;
  payout_gross_minor?: number | string | null;
  payout_fee_minor?: number | string | null;
  payout_net_minor?: number | string | null;
  applicant_email?: string | null;
  beta_tests?: JoinedBetaTestRow | JoinedBetaTestRow[] | null;
}

function isMissingColumnError(error: { code?: string } | null | undefined): boolean {
  return error?.code === "42703";
}

function toMinorNumber(input: unknown): number | null {
  if (typeof input === "number" && Number.isFinite(input)) return Math.max(0, Math.round(input));
  if (typeof input === "string" && input.trim().length > 0) {
    const parsed = Number(input);
    if (Number.isFinite(parsed)) return Math.max(0, Math.round(parsed));
  }
  return null;
}

function normalizePayoutStatus(input: unknown): "pending" | "paid" | "failed" {
  if (input === "paid") return "paid";
  if (input === "failed") return "failed";
  return "pending";
}

function firstJoinedBetaTest(
  value: ApplicationLookupRow["beta_tests"]
): JoinedBetaTestRow | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

export async function updateCashPayoutStatusAction(
  formData: FormData
): Promise<void> {
  const { userId } = await auth();
  if (!isAdminUser(userId)) return;

  const betaTestId = String(formData.get("betaTestId") ?? "").trim();
  const applicantUserId = String(formData.get("applicantUserId") ?? "").trim();
  const nextStatus = String(formData.get("nextStatus") ?? "").trim();
  const payoutNoteRaw = String(formData.get("payoutNote") ?? "").trim();
  const payoutNote = payoutNoteRaw.length > 0 ? payoutNoteRaw.slice(0, 300) : null;

  if (!betaTestId || !applicantUserId) {
    return;
  }
  if (!ALLOWED_PAYOUT_STATUSES.has(nextStatus)) {
    return;
  }

  const client = createServiceClient();
  const { data: appRow, error: appError } = await client
    .from("beta_applications")
    .select(
      "status, payout_status, payout_gross_minor, payout_fee_minor, payout_net_minor, applicant_email, beta_tests!inner(id, title, reward_type, reward_currency, creator_id)"
    )
    .eq("beta_test_id", betaTestId)
    .eq("clerk_user_id", applicantUserId)
    .maybeSingle();

  const app = appRow as ApplicationLookupRow | null;
  if (appError || !app) {
    return;
  }

  const applicationStatus = String(app.status ?? "pending");
  const joinedBetaTest = firstJoinedBetaTest(app.beta_tests);
  const rewardType = String(joinedBetaTest?.reward_type ?? "cash");

  if (applicationStatus !== "accepted" || rewardType !== "cash") {
    return;
  }
  const previousPayoutStatus = normalizePayoutStatus(app.payout_status);
  const normalizedNextStatus = normalizePayoutStatus(nextStatus);

  const updatePayload = {
    payout_status: nextStatus,
    payout_paid_at: nextStatus === "paid" ? new Date().toISOString() : null,
    payout_note: payoutNote,
  };

  const { error: updateError } = await client
    .from("beta_applications")
    .update(updatePayload)
    .eq("beta_test_id", betaTestId)
    .eq("clerk_user_id", applicantUserId);

  if (updateError) {
    if (isMissingColumnError(updateError)) {
      console.error("[admin] payout status columns missing in beta_applications");
      return;
    }
    console.error("[admin] failed to update payout status", { betaTestId, applicantUserId, nextStatus });
    return;
  }

  const { error: auditError } = await client.from("beta_payout_audit_log").insert({
    beta_test_id: betaTestId,
    applicant_user_id: applicantUserId,
    previous_status: previousPayoutStatus,
    next_status: nextStatus,
    payout_note: payoutNote,
    admin_user_id: userId,
  });
  if (auditError) {
    console.error("[admin] failed to insert payout audit log", {
      betaTestId,
      applicantUserId,
      previousPayoutStatus,
      nextStatus,
      code: auditError.code,
      message: auditError.message,
    });
  }

  if (previousPayoutStatus !== normalizedNextStatus) {
    const creatorUserId = String(joinedBetaTest?.creator_id ?? "");
    const creatorEmail = creatorUserId ? await getClerkPrimaryEmail(creatorUserId) : null;
    const testerEmail =
      typeof app.applicant_email === "string" && app.applicant_email.includes("@")
        ? app.applicant_email.trim()
        : null;

    const emailResult = await sendPayoutStatusNotifications({
      betaTestId,
      betaTestTitle: String(joinedBetaTest?.title ?? betaTestId),
      applicantUserId,
      testerEmail,
      creatorEmail,
      previousStatus: previousPayoutStatus,
      nextStatus: normalizedNextStatus,
      payoutNote,
      payoutGrossMinor: toMinorNumber(app.payout_gross_minor),
      payoutFeeMinor: toMinorNumber(app.payout_fee_minor),
      payoutNetMinor: toMinorNumber(app.payout_net_minor),
      currency: String(joinedBetaTest?.reward_currency ?? "INR"),
    });

    if (!emailResult.testerSent && !emailResult.creatorSent) {
      console.info("[admin] payout status email notification skipped/not sent", {
        betaTestId,
        applicantUserId,
        previousPayoutStatus,
        nextStatus: normalizedNextStatus,
        hasTesterEmail: Boolean(testerEmail),
        hasCreatorEmail: Boolean(creatorEmail),
      });
    }
  }

  revalidatePath("/admin");
}

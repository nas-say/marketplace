"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { isAdminUser } from "@/lib/admin-access";
import { createServiceClient } from "@/lib/supabase";

const ALLOWED_PAYOUT_STATUSES = new Set(["pending", "paid", "failed"]);

interface JoinedBetaTestRow {
  reward_type?: string;
}

interface ApplicationLookupRow {
  status?: string;
  payout_status?: string | null;
  beta_tests?: JoinedBetaTestRow | JoinedBetaTestRow[] | null;
}

function isMissingColumnError(error: { code?: string } | null | undefined): boolean {
  return error?.code === "42703";
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
    .select("status, payout_status, beta_tests!inner(reward_type)")
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

  revalidatePath("/admin");
}

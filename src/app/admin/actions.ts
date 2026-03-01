"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { isAdminUser } from "@/lib/admin-access";
import { createServiceClient } from "@/lib/supabase";

const ALLOWED_PAYOUT_STATUSES = new Set(["pending", "paid", "failed"]);

function isMissingColumnError(error: { code?: string } | null | undefined): boolean {
  return error?.code === "42703";
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

  if (appError || !appRow) {
    return;
  }

  const applicationStatus = String(appRow.status ?? "pending");
  const joinedBetaTest = appRow.beta_tests as { reward_type?: string } | { reward_type?: string }[] | null;
  const rewardType = Array.isArray(joinedBetaTest)
    ? String(joinedBetaTest[0]?.reward_type ?? "cash")
    : String(joinedBetaTest?.reward_type ?? "cash");

  if (applicationStatus !== "accepted" || rewardType !== "cash") {
    return;
  }
  const previousPayoutStatus =
    appRow.payout_status === "paid" || appRow.payout_status === "failed" ? appRow.payout_status : "pending";

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

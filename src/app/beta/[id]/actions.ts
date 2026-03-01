"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { applyToBetaTest } from "@/lib/db/applications";
import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase";
import { getUserApplicationIds } from "@/lib/db/applications";
import { saveUpiId } from "@/lib/db/profiles";
import { revalidatePath } from "next/cache";
import { calculateCashBetaPayout } from "@/lib/payments/beta-payouts";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UPI_PATTERN = /^[A-Za-z0-9._-]{2,256}@[A-Za-z]{2,64}$/;

function normalizeRewardType(value: unknown): "cash" | "premium_access" {
  return value === "premium_access" ? "premium_access" : "cash";
}

function isMissingColumnError(error: { code?: string } | null | undefined): boolean {
  return error?.code === "42703";
}

interface ApproveApplicationRow {
  status?: string;
  applicant_email?: string | null;
  payout_status?: string | null;
  payout_gross_minor?: number | null;
  payout_fee_minor?: number | null;
  payout_net_minor?: number | null;
}

export async function applyAction(
  betaTestId: string,
  payload?: { upiId?: string; applicantEmail?: string }
): Promise<{ error?: string; success?: boolean }> {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const client = createServiceClient();
  const { data: betaTest, error: betaTestError } = await client
    .from("beta_tests")
    .select("reward_type")
    .eq("id", betaTestId)
    .maybeSingle();

  if (betaTestError || !betaTest) {
    return { error: "Beta test not found." };
  }

  const rewardType = normalizeRewardType(betaTest.reward_type);
  const upiId = payload?.upiId?.trim() || undefined;
  let applicantEmail = payload?.applicantEmail?.trim() || undefined;

  if (!applicantEmail) {
    const clerkUser = await currentUser();
    applicantEmail = clerkUser?.primaryEmailAddress?.emailAddress?.trim() || undefined;
  }

  if (!applicantEmail || !EMAIL_PATTERN.test(applicantEmail) || applicantEmail.length > 320) {
    return { error: "A valid email is required to apply." };
  }

  if (rewardType === "cash") {
    if (!upiId) {
      return { error: "UPI ID is required to receive your cash reward." };
    }
    if (!UPI_PATTERN.test(upiId) || upiId.length > 320) {
      return { error: "Enter a valid UPI ID (for example, yourname@upi)." };
    }
  }

  const persistDetails = async (): Promise<{ ok: boolean; error?: string }> => {
    const { error: updateError } = await client
      .from("beta_applications")
      .update({
        applicant_email: applicantEmail ?? null,
        upi_id: rewardType === "cash" ? upiId ?? null : null,
      })
      .eq("clerk_user_id", userId)
      .eq("beta_test_id", betaTestId);

    if (updateError) {
      console.error("[applyAction] failed to store applicant payout/contact details", {
        userId,
        betaTestId,
        code: updateError.code,
        message: updateError.message,
      });

      if (isMissingColumnError(updateError)) {
        return {
          ok: false,
          error: "Database is missing applicant detail columns. Run the latest Supabase migration and retry.",
        };
      }

      return {
        ok: false,
        error: "Application submitted, but we could not save your contact details. Please click apply again.",
      };
    }

    if (rewardType === "cash" && upiId) {
      const upiSaved = await saveUpiId(userId, upiId);
      if (!upiSaved) {
        return {
          ok: false,
          error: "Application submitted, but we could not save your UPI ID for future payouts. Please retry.",
        };
      }
    }

    return { ok: true };
  };

  const result = await applyToBetaTest(userId, betaTestId);
  if (result.blockedReason) return { error: result.blockedReason };

  if (result.alreadyApplied) {
    const persisted = await persistDetails();
    if (!persisted.ok) return { error: persisted.error ?? "You've already applied to this beta test." };
    return { success: true };
  }

  if (!result.success) return { error: "Failed to apply. Please try again." };

  const persisted = await persistDetails();
  if (!persisted.ok) {
    return { error: persisted.error ?? "Application submitted but contact details were not saved." };
  }

  return { success: true };
}

export async function approveApplicationAction(
  betaTestId: string,
  applicantUserId: string
): Promise<{ error?: string; success?: boolean; notice?: string }> {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const client = createServiceClient();

  const { data: betaTest, error: betaError } = await client
    .from("beta_tests")
    .select("creator_id, reward_type, reward_pool_status, reward_pool_total_minor, reward_amount_minor")
    .eq("id", betaTestId)
    .maybeSingle();

  if (betaError || !betaTest || betaTest.creator_id !== userId) {
    return { error: "You are not authorized to approve applications for this beta test." };
  }

  if (
    String(betaTest.reward_type ?? "cash") === "cash" &&
    Number(betaTest.reward_pool_total_minor ?? 0) > 0 &&
    String(betaTest.reward_pool_status ?? "pending") !== "funded"
  ) {
    return { error: "Fund the reward pool before approving cash-reward applicants." };
  }

  let application: ApproveApplicationRow | null = null;

  const applicationResult = await client
    .from("beta_applications")
    .select("status, applicant_email, payout_status, payout_gross_minor, payout_fee_minor, payout_net_minor")
    .eq("beta_test_id", betaTestId)
    .eq("clerk_user_id", applicantUserId)
    .maybeSingle();

  if (applicationResult.error && isMissingColumnError(applicationResult.error)) {
    const legacyResult = await client
      .from("beta_applications")
      .select("status, applicant_email")
      .eq("beta_test_id", betaTestId)
      .eq("clerk_user_id", applicantUserId)
      .maybeSingle();
    application = (legacyResult.data as ApproveApplicationRow | null) ?? null;
  } else {
    application = (applicationResult.data as ApproveApplicationRow | null) ?? null;
  }

  if (!application) {
    return { error: "Applicant record not found." };
  }

  const rewardType = String(betaTest.reward_type ?? "cash");
  const cashPayout = calculateCashBetaPayout(Number(betaTest.reward_amount_minor ?? 0));

  if (application.status !== "accepted") {
    const updatePayload: Record<string, unknown> = { status: "accepted" };
    if (rewardType === "cash") {
      updatePayload.payout_status = "pending";
      updatePayload.payout_gross_minor = cashPayout.grossMinor;
      updatePayload.payout_fee_minor = cashPayout.feeMinor;
      updatePayload.payout_net_minor = cashPayout.netMinor;
    }

    const { error: updateError } = await client
      .from("beta_applications")
      .update(updatePayload)
      .eq("beta_test_id", betaTestId)
      .eq("clerk_user_id", applicantUserId);

    if (updateError) {
      if (isMissingColumnError(updateError)) {
        const { error: legacyUpdateError } = await client
          .from("beta_applications")
          .update({ status: "accepted" })
          .eq("beta_test_id", betaTestId)
          .eq("clerk_user_id", applicantUserId);

        if (legacyUpdateError) {
          return { error: "Could not approve applicant right now." };
        }
      } else {
        return { error: "Could not approve applicant right now." };
      }
    }
  } else if (
    rewardType === "cash" &&
    (application.payout_gross_minor === null ||
      application.payout_fee_minor === null ||
      application.payout_net_minor === null)
  ) {
    // Backfill payout breakdown for legacy accepted rows.
    await client
      .from("beta_applications")
      .update({
        payout_gross_minor: cashPayout.grossMinor,
        payout_fee_minor: cashPayout.feeMinor,
        payout_net_minor: cashPayout.netMinor,
      })
      .eq("beta_test_id", betaTestId)
      .eq("clerk_user_id", applicantUserId);
  }

  revalidatePath(`/beta/${betaTestId}`);

  const applicantEmail = typeof application.applicant_email === "string" ? application.applicant_email : null;
  const notice =
    rewardType === "premium_access"
      ? applicantEmail
        ? `Approved. Give premium access to ${applicantEmail}.`
        : "Approved. Give this user premium access and collect their email if missing."
      : "Approved. SideFlip will process the tester payout from the funded reward pool.";

  return { success: true, notice };
}

export async function submitFeedbackAction(
  betaTestId: string,
  payload: { rating: number; feedbackType: string; comment: string }
): Promise<{ error?: string; success?: boolean }> {
  const { userId } = await auth();
  if (!userId) return { error: "Not authenticated." };

  if (!Number.isInteger(payload.rating) || payload.rating < 1 || payload.rating > 5) {
    return { error: "Rating must be between 1 and 5." };
  }

  const comment = payload.comment.trim().slice(0, 2000);
  const feedbackType = payload.feedbackType.trim().slice(0, 80);

  const appliedIds = await getUserApplicationIds(userId);
  if (!appliedIds.includes(betaTestId)) {
    return { error: "You must be an accepted tester to submit feedback." };
  }

  const client = createServiceClient();

  const { data: applicationRow } = await client
    .from("beta_applications")
    .select("status")
    .eq("clerk_user_id", userId)
    .eq("beta_test_id", betaTestId)
    .maybeSingle();

  if (!applicationRow || applicationRow.status !== "accepted") {
    return { error: "Only accepted testers can submit feedback." };
  }

  const { data: existingFeedback } = await client
    .from("beta_feedback")
    .select("id")
    .eq("clerk_user_id", userId)
    .eq("beta_test_id", betaTestId)
    .maybeSingle();

  if (existingFeedback) return { error: "You have already submitted feedback for this test." };

  const { error } = await client.from("beta_feedback").insert({
    beta_test_id: betaTestId,
    clerk_user_id: userId,
    rating: payload.rating,
    comment: comment || null,
    feedback_type: feedbackType || null,
  });

  if (error) return { error: "Could not submit feedback right now." };

  revalidatePath(`/beta/${betaTestId}`);
  return { success: true };
}

export async function getBetaFeedback(
  betaTestId: string
): Promise<Array<{ id: string; rating: number; comment: string | null; feedbackType: string | null; createdAt: string }>> {
  const client = createServiceClient();
  const { data, error } = await client
    .from("beta_feedback")
    .select("id, rating, comment, feedback_type, created_at")
    .eq("beta_test_id", betaTestId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return (data as Record<string, unknown>[]).map((row) => ({
    id: row.id as string,
    rating: row.rating as number,
    comment: (row.comment as string | null) ?? null,
    feedbackType: (row.feedback_type as string | null) ?? null,
    createdAt: row.created_at as string,
  }));
}

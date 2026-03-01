"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { applyToBetaTest } from "@/lib/db/applications";
import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase";
import { getUserApplicationIds } from "@/lib/db/applications";
import { saveUpiId } from "@/lib/db/profiles";
import { revalidatePath } from "next/cache";

export async function applyAction(
  betaTestId: string,
  payload?: { upiId?: string; applicantEmail?: string }
): Promise<{ error?: string; success?: boolean }> {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const result = await applyToBetaTest(userId, betaTestId);
  if (result.blockedReason) return { error: result.blockedReason };
  if (result.alreadyApplied) return { error: "You've already applied to this beta test." };
  if (!result.success) return { error: "Failed to apply. Please try again." };

  const upiId = payload?.upiId?.trim() || undefined;
  let applicantEmail = payload?.applicantEmail?.trim() || undefined;

  if (!applicantEmail) {
    const clerkUser = await currentUser();
    applicantEmail = clerkUser?.primaryEmailAddress?.emailAddress?.trim() || undefined;
  }

  if (upiId || applicantEmail) {
    const client = createServiceClient();
    const { error: updateError } = await client
      .from("beta_applications")
      .update({ upi_id: upiId ?? null, applicant_email: applicantEmail ?? null })
      .eq("clerk_user_id", userId)
      .eq("beta_test_id", betaTestId);

    if (updateError) {
      console.error("[applyAction] failed to store applicant payout/contact details", {
        userId,
        betaTestId,
        hasUpiId: Boolean(upiId),
        hasApplicantEmail: Boolean(applicantEmail),
      });
    } else if (upiId) {
      await saveUpiId(userId, upiId);
    }
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
    .select("creator_id, reward_type, reward_pool_status, reward_pool_total_minor")
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

  const { data: application, error: applicationError } = await client
    .from("beta_applications")
    .select("status, applicant_email")
    .eq("beta_test_id", betaTestId)
    .eq("clerk_user_id", applicantUserId)
    .maybeSingle();

  if (applicationError || !application) {
    return { error: "Applicant record not found." };
  }

  if (application.status !== "accepted") {
    const { error: updateError } = await client
      .from("beta_applications")
      .update({ status: "accepted" })
      .eq("beta_test_id", betaTestId)
      .eq("clerk_user_id", applicantUserId);

    if (updateError) {
      return { error: "Could not approve applicant right now." };
    }
  }

  revalidatePath(`/beta/${betaTestId}`);

  const rewardType = String(betaTest.reward_type ?? "cash");
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

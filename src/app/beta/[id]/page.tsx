import { getBetaTestById } from "@/lib/db/beta-tests";
import { getProfile, getSavedUpiId } from "@/lib/db/profiles";
import { getUserApplicationIds, getBetaApplicationsForCreator, type CreatorBetaApplication } from "@/lib/db/applications";
import { ApplyButton } from "./apply-button";
import { FundingCard } from "./funding-card";
import { FeedbackSection } from "./feedback-section";
import { CreatorApplicantsSection } from "./creator-applicants-section";
import { Badge } from "@/components/ui/badge";
import { User } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import { getVisitorCountryCode } from "@/lib/geo";
import { createServiceClient } from "@/lib/supabase";
import { getBetaFeedback } from "./actions";

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const betaTest = await getBetaTestById(id);
  if (!betaTest) return {};
  return { title: `${betaTest.title} — SideFlip Beta` };
}

export default async function BetaDetailPage({ params }: Props) {
  const { id } = await params;
  const { userId } = await auth();

  const [betaTest, appliedIds, countryCode] = await Promise.all([
    getBetaTestById(id),
    userId ? getUserApplicationIds(userId) : Promise.resolve([]),
    getVisitorCountryCode().catch(() => ""),
  ]);

  if (!betaTest) notFound();
  if (betaTest.status === "draft" && userId !== betaTest.creatorId) notFound();

  const creator = await getProfile(betaTest.creatorId);
  const alreadyApplied = appliedIds.includes(id);
  const spotsRemaining = betaTest.spots.total - betaTest.spots.filled;
  const fillPercent = (betaTest.spots.filled / betaTest.spots.total) * 100;
  const isCreator = userId === betaTest.creatorId;
  const fundingRequiredForApply =
    betaTest.reward.type === "cash" &&
    betaTest.reward.poolTotalMinor > 0 &&
    betaTest.reward.poolStatus !== "funded";
  const applyBlockedReason =
    !isCreator && fundingRequiredForApply ? "Creator must fund cash rewards before applications open." : undefined;
  const paymentsEnabledForCountry = countryCode === "IN";

  let isAcceptedTester = false;
  let hasSubmittedFeedback = false;
  let savedUpiId: string | null = null;
  let savedEmail: string | null = null;
  let creatorApplicants: CreatorBetaApplication[] = [];
  let existingFeedback: Array<{
    id: string;
    rating: number;
    comment: string | null;
    feedbackType: string | null;
    createdAt: string;
  }> = [];

  if (isCreator && userId) {
    const [feedbackData, applicantData] = await Promise.all([
      getBetaFeedback(id),
      getBetaApplicationsForCreator(id, userId),
    ]);
    existingFeedback = feedbackData;
    creatorApplicants = applicantData;
  }

  if (userId) {
    const client = createServiceClient();
    const [feedbackData, appRow, feedbackRow, clerkUser, upiId] = await Promise.all([
      existingFeedback.length > 0 ? Promise.resolve(existingFeedback) : getBetaFeedback(id),
      client
        .from("beta_applications")
        .select("status")
        .eq("clerk_user_id", userId)
        .eq("beta_test_id", id)
        .maybeSingle(),
      client
        .from("beta_feedback")
        .select("id")
        .eq("clerk_user_id", userId)
        .eq("beta_test_id", id)
        .maybeSingle(),
      betaTest.reward.type === "premium_access" ? currentUser() : Promise.resolve(null),
      betaTest.reward.type === "cash" ? getSavedUpiId(userId) : Promise.resolve(null),
    ]);
    existingFeedback = feedbackData;
    isAcceptedTester = appRow.data?.status === "accepted";
    hasSubmittedFeedback = Boolean(feedbackRow.data?.id);
    savedUpiId = upiId;
    savedEmail = clerkUser?.primaryEmailAddress?.emailAddress ?? null;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 text-sm text-zinc-500">
        <Link href="/" className="hover:text-zinc-300">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/beta" className="hover:text-zinc-300">Beta Tests</Link>
        <span className="mx-2">/</span>
        <span className="text-zinc-300">{betaTest.title}</span>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
        {/* Left column */}
        <div>
          <h1 className="text-3xl font-bold text-zinc-50">{betaTest.title}</h1>
          <div className="mt-3 flex flex-wrap gap-2">
            {betaTest.platform.map((p) => (
              <Badge key={p} variant="outline" className="border-zinc-700 text-zinc-400 capitalize">{p}</Badge>
            ))}
            {betaTest.feedbackTypes.map((ft) => (
              <Badge key={ft} variant="secondary" className="bg-zinc-800 text-zinc-300 text-xs capitalize">
                {ft.replace("_", " ")}
              </Badge>
            ))}
          </div>

          <p className="mt-6 text-zinc-300">{betaTest.description}</p>

          {betaTest.testingInstructions && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold text-zinc-50 mb-4">Testing Instructions</h2>
              <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                {betaTest.testingInstructions.split("\n").map((line, i) => (
                  <p key={i} className="text-sm text-zinc-300 py-0.5">{line}</p>
                ))}
              </div>
            </div>
          )}

          {betaTest.requirements && (
            <div className="mt-4 text-sm text-zinc-500">
              <strong className="text-zinc-300">Requirements:</strong> {betaTest.requirements}
            </div>
          )}

          {isCreator && (
            <CreatorApplicantsSection
              betaTestId={id}
              rewardType={betaTest.reward.type}
              applicants={creatorApplicants}
            />
          )}

          <FeedbackSection
            betaTestId={id}
            isAcceptedTester={isAcceptedTester}
            existingFeedback={existingFeedback}
            isCreator={isCreator}
            hasSubmittedFeedback={hasSubmittedFeedback}
          />
        </div>

        {/* Right column */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
            <div className="mb-4">
              <p className="text-sm text-zinc-500 mb-1">{betaTest.spots.filled} of {betaTest.spots.total} spots filled</p>
              <div className="h-2 rounded-full bg-zinc-800">
                <div className="h-2 rounded-full bg-indigo-600" style={{ width: `${fillPercent}%` }} />
              </div>
              <p className="mt-1 text-sm text-zinc-400">{spotsRemaining} spots remaining</p>
            </div>

            <div className="mb-4 rounded bg-zinc-800 p-3 text-center">
              <p className="text-sm text-zinc-500">Reward</p>
              <p className="text-lg font-bold text-violet-400">{betaTest.reward.description}</p>
            </div>

            <FundingCard
              betaTestId={id}
              isCreator={isCreator}
              countryCode={countryCode}
              paymentsEnabledForCountry={paymentsEnabledForCountry}
              rewardType={betaTest.reward.type}
              rewardCurrency={betaTest.reward.currency}
              poolTotalMinor={betaTest.reward.poolTotalMinor}
              poolFundedMinor={betaTest.reward.poolFundedMinor}
              poolStatus={betaTest.reward.poolStatus}
            />

            <p className="mb-4 text-sm text-zinc-500">
              Deadline:{" "}
              {new Date(betaTest.deadline).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>

            <ApplyButton
              betaTestId={id}
              alreadyApplied={alreadyApplied}
              closed={betaTest.status === "closed"}
              blockedReason={applyBlockedReason}
              rewardType={betaTest.reward.type}
              savedUpiId={savedUpiId}
              savedEmail={savedEmail}
            />

            {creator && (
              <div className="mt-6 border-t border-zinc-800 pt-4">
                <p className="text-sm text-zinc-500 mb-2">Created by</p>
                <Link href={`/seller/${creator.id}`} className="flex items-center gap-2 group">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800">
                    <User className="h-4 w-4 text-zinc-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-50 group-hover:text-indigo-400 transition-colors">{creator.displayName}</p>
                    {creator.bio && <p className="text-xs text-zinc-500 truncate max-w-[200px]">{creator.bio}</p>}
                  </div>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

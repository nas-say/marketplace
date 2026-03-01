import { getBetaTests, getBetaTestsByCreator } from "@/lib/db/beta-tests";
import { getProfiles } from "@/lib/db/profiles";
import { BetaPageClient } from "./beta-client";
import { auth } from "@clerk/nextjs/server";

export default async function BetaPage() {
  const { userId } = await auth();

  const [betaTests, profiles, myBetaTests] = await Promise.all([
    getBetaTests(),
    getProfiles(),
    userId ? getBetaTestsByCreator(userId) : Promise.resolve([]),
  ]);

  const draftBetaTests = myBetaTests.filter((bt) => bt.status === "draft");

  const topTesters = profiles
    .filter((u) => u.stats.feedbackGiven > 0)
    .sort((a, b) => b.stats.feedbackGiven - a.stats.feedbackGiven)
    .slice(0, 5);

  return (
    <BetaPageClient
      betaTests={betaTests}
      draftBetaTests={draftBetaTests}
      canViewDrafts={Boolean(userId)}
      topTesters={topTesters}
    />
  );
}

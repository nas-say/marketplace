import { getBetaTests, getBetaTestsByCreator } from "@/lib/db/beta-tests";
import { getTopTesters } from "@/lib/db/profiles";
import { BetaPageClient } from "./beta-client";
import { auth } from "@clerk/nextjs/server";

export default async function BetaPage() {
  const { userId } = await auth();

  const [betaTests, topTesters, myBetaTests] = await Promise.all([
    getBetaTests(),
    getTopTesters(5),
    userId ? getBetaTestsByCreator(userId) : Promise.resolve([]),
  ]);

  const draftBetaTests = myBetaTests.filter((bt) => bt.status === "draft");

  return (
    <BetaPageClient
      betaTests={betaTests}
      draftBetaTests={draftBetaTests}
      canViewDrafts={Boolean(userId)}
      topTesters={topTesters}
    />
  );
}

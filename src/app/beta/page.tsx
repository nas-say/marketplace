import { getBetaTests } from "@/lib/db/beta-tests";
import { getProfiles } from "@/lib/db/profiles";
import { BetaPageClient } from "./beta-client";

export default async function BetaPage() {
  const [betaTests, profiles] = await Promise.all([getBetaTests(), getProfiles()]);
  const topTesters = profiles
    .filter((u) => u.stats.feedbackGiven > 0)
    .sort((a, b) => b.stats.feedbackGiven - a.stats.feedbackGiven)
    .slice(0, 5);
  return <BetaPageClient betaTests={betaTests} topTesters={topTesters} />;
}

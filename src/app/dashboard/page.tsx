import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getAllListingsBySeller } from "@/lib/db/listings";
import { getBetaTests } from "@/lib/db/beta-tests";
import { getProfile } from "@/lib/db/profiles";
import { formatPrice } from "@/lib/data";
import { DashboardClient } from "./dashboard-client";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const clerkUser = await currentUser();

  const [profile, listings, allBetaTests] = await Promise.all([
    getProfile(userId),
    getAllListingsBySeller(userId),
    getBetaTests(),
  ]);

  const myBetaTests = allBetaTests.filter((bt) => bt.creatorId === userId);

  const displayName =
    profile?.displayName ??
    clerkUser?.firstName ??
    clerkUser?.emailAddresses?.[0]?.emailAddress?.split("@")[0] ??
    "there";

  const stats = {
    totalEarnings: formatPrice(profile?.stats.totalEarnings ?? 0),
    activeListings: listings.filter((l) => l.status === "active").length,
    betaTests: myBetaTests.length,
    feedbackGiven: profile?.stats.feedbackGiven ?? 0,
  };

  return (
    <DashboardClient
      displayName={displayName}
      stats={stats}
      listings={listings}
      betaTests={myBetaTests}
    />
  );
}

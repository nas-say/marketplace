import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getAllListingsBySeller, getUnlockedListings, getListingAnalytics } from "@/lib/db/listings";
import { getConnectsBalance } from "@/lib/db/connects";
import { getSavedSearchesByUser } from "@/lib/db/saved-searches";
import { getOffersForSeller, getOffersForBuyer } from "@/lib/db/offers";
import { getBetaTestsByCreator } from "@/lib/db/beta-tests";
import { getProfile } from "@/lib/db/profiles";
import { formatPrice } from "@/lib/formatting";
import { getUserApplications } from "@/lib/db/applications";
import { isAdminUser } from "@/lib/admin-access";
import { DashboardClient } from "./dashboard-client";
import type { Metadata } from "next";
import { privatePageMetadata } from "@/lib/seo";

export const metadata: Metadata = privatePageMetadata("Dashboard");

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const clerkUser = await currentUser();

  const [profile, listings, allBetaTests, unlockedListings, myApplications, connectsBalance, savedSearches, receivedOffers, myOffers] = await Promise.all([
    getProfile(userId),
    getAllListingsBySeller(userId),
    getBetaTestsByCreator(userId),
    getUnlockedListings(userId),
    getUserApplications(userId),
    getConnectsBalance(userId),
    getSavedSearchesByUser(userId),
    getOffersForSeller(userId),
    getOffersForBuyer(userId),
  ]);

  const listingAnalytics = await getListingAnalytics(listings.map((l) => l.id));

  const myBetaTests = allBetaTests;

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
    betaTestsCompleted: profile?.stats.betaTestsCompleted ?? 0,
  };

  return (
    <DashboardClient
      displayName={displayName}
      isAdmin={isAdminUser(userId)}
      stats={stats}
      listings={listings}
      betaTests={myBetaTests}
      unlockedListings={unlockedListings}
      myApplications={myApplications}
      listingAnalytics={listingAnalytics}
      connectsBalance={connectsBalance}
      savedSearches={savedSearches}
      receivedOffers={receivedOffers}
      myOffers={myOffers}
    />
  );
}

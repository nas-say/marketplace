import { getListings } from "@/lib/db/listings";
import { getActiveBetaTests } from "@/lib/db/beta-tests";
import { HeroAurora } from "./hero-aurora";
import { HeroClient } from "./hero-client";

export async function Hero() {
  const [listings, betaTests] = await Promise.all([getListings(), getActiveBetaTests()]);
  const totalSalesValue = listings.reduce((sum, l) => sum + l.askingPrice, 0);
  const verifiedCount = listings.filter((listing) => listing.ownershipVerified).length;
  const proposalCount = listings.filter((listing) => listing.contactMode === "proposal").length;
  const leadListing =
    [...listings]
      .sort((a, b) => {
        const verificationDelta = Number(b.ownershipVerified) - Number(a.ownershipVerified);
        if (verificationDelta !== 0) return verificationDelta;
        return b.metrics.mrr - a.metrics.mrr;
      })[0] ?? null;

  return (
    <section className="gradient-hero relative overflow-hidden">
      <HeroAurora />
      <HeroClient
        listingsCount={listings.length}
        betaTestsCount={betaTests.length}
        totalSalesValue={totalSalesValue}
        verifiedCount={verifiedCount}
        proposalCount={proposalCount}
        leadListing={leadListing}
      />
    </section>
  );
}

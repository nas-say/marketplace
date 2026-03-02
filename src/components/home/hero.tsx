import { getListings } from "@/lib/db/listings";
import { getActiveBetaTests } from "@/lib/db/beta-tests";
import { HeroParallaxBackdrop } from "./hero-parallax-backdrop";
import { HeroClient } from "./hero-client";

export async function Hero() {
  const [listings, betaTests] = await Promise.all([getListings(), getActiveBetaTests()]);
  const totalSalesValue = listings.reduce((sum, l) => sum + l.askingPrice, 0);

  return (
    <section className="gradient-hero relative overflow-hidden py-24 sm:py-32">
      <HeroParallaxBackdrop />
      <HeroClient
        listingsCount={listings.length}
        betaTestsCount={betaTests.length}
        totalSalesValue={totalSalesValue}
      />
    </section>
  );
}

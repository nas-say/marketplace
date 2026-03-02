import { getListings } from "@/lib/db/listings";
import { getActiveBetaTests } from "@/lib/db/beta-tests";
import { HeroParallaxBackdrop } from "./hero-parallax-backdrop";
import { HeroAurora } from "./hero-aurora";
import { HeroClient } from "./hero-client";

export async function Hero() {
  const [listings, betaTests] = await Promise.all([getListings(), getActiveBetaTests()]);
  const totalSalesValue = listings.reduce((sum, l) => sum + l.askingPrice, 0);

  return (
    <section className="gradient-hero relative overflow-hidden">
      <HeroAurora />
      <HeroParallaxBackdrop />
      <HeroClient
        listingsCount={listings.length}
        betaTestsCount={betaTests.length}
        totalSalesValue={totalSalesValue}
      />
    </section>
  );
}

import { Hero } from "@/components/home/hero";
import { FeaturedListings } from "@/components/home/featured-listings";
import { HowItWorksSteps } from "@/components/home/how-it-works-steps";
import { CategoriesGrid } from "@/components/home/categories-grid";
import { BetaSpotlight } from "@/components/home/beta-spotlight";
import { CtaBanner } from "@/components/home/cta-banner";

export default function HomePage() {
  return (
    <>
      <Hero />
      <FeaturedListings />
      <HowItWorksSteps />
      <CategoriesGrid />
      <BetaSpotlight />
      <CtaBanner />
    </>
  );
}

import { Hero } from "@/components/home/hero";
import { FeaturedListings } from "@/components/home/featured-listings";
import { HowItWorksSteps } from "@/components/home/how-it-works-steps";
import { CategoriesGrid } from "@/components/home/categories-grid";
import { BetaSpotlight } from "@/components/home/beta-spotlight";
import { CtaBanner } from "@/components/home/cta-banner";
import { SectionReveal } from "@/components/shared/section-reveal";

export default function HomePage() {
  return (
    <>
      <SectionReveal variant="zoom-in">
        <Hero />
      </SectionReveal>
      <SectionReveal delay={0.04} variant="drift-left">
        <FeaturedListings />
      </SectionReveal>
      <SectionReveal delay={0.08} variant="rise">
        <HowItWorksSteps />
      </SectionReveal>
      <SectionReveal delay={0.1} variant="drift-right">
        <CategoriesGrid />
      </SectionReveal>
      <SectionReveal delay={0.12} variant="tilt-up">
        <BetaSpotlight />
      </SectionReveal>
      <SectionReveal delay={0.14} variant="zoom-in">
        <CtaBanner />
      </SectionReveal>
    </>
  );
}

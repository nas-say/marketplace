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
      <SectionReveal>
        <Hero />
      </SectionReveal>
      <SectionReveal delay={0.05}>
        <FeaturedListings />
      </SectionReveal>
      <SectionReveal delay={0.08}>
        <HowItWorksSteps />
      </SectionReveal>
      <SectionReveal delay={0.1}>
        <CategoriesGrid />
      </SectionReveal>
      <SectionReveal delay={0.12}>
        <BetaSpotlight />
      </SectionReveal>
      <SectionReveal delay={0.14}>
        <CtaBanner />
      </SectionReveal>
    </>
  );
}

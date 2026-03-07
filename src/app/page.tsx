import type { Metadata } from "next";
import { Hero } from "@/components/home/hero";
import { FeaturedListings } from "@/components/home/featured-listings";
import { HowItWorksSteps } from "@/components/home/how-it-works-steps";
import { CategoriesGrid } from "@/components/home/categories-grid";
import { BetaSpotlight } from "@/components/home/beta-spotlight";
import { CtaBanner } from "@/components/home/cta-banner";
import { JsonLd } from "@/components/shared/json-ld";
import { SectionReveal } from "@/components/shared/section-reveal";
import { absoluteUrl, publicPageMetadata } from "@/lib/seo";

export const metadata: Metadata = publicPageMetadata({
  title: "Buy, Sell & Beta-Test Indie Products",
  description:
    "Discover verified SaaS, templates, extensions, APIs, and online businesses. Connect with sellers and join high-quality beta tests.",
  path: "/",
});

export default function HomePage() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "SideFlip",
      url: absoluteUrl("/"),
      potentialAction: {
        "@type": "SearchAction",
        target: `${absoluteUrl("/browse")}?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "SideFlip",
      url: absoluteUrl("/"),
      logo: absoluteUrl("/images/logo.svg"),
      sameAs: [],
    },
  ];

  return (
    <>
      <JsonLd data={jsonLd} />
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

import type { MetadataRoute } from "next";
import { getListings } from "@/lib/db/listings";
import { getBetaTests } from "@/lib/db/beta-tests";
import { absoluteUrl } from "@/lib/seo";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [listings, betaTests] = await Promise.all([getListings(), getBetaTests()]);
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/browse"), lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    { url: absoluteUrl("/beta"), lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    { url: absoluteUrl("/how-it-works"), lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: absoluteUrl("/terms"), lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: absoluteUrl("/privacy"), lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: absoluteUrl("/refund"), lastModified: now, changeFrequency: "monthly", priority: 0.4 },
  ];

  const listingRoutes: MetadataRoute.Sitemap = listings.map((listing) => ({
    url: absoluteUrl(`/listing/${listing.id}`),
    lastModified: new Date(listing.updatedAt || listing.createdAt),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const betaRoutes: MetadataRoute.Sitemap = betaTests
    .filter((bt) => bt.status !== "closed")
    .map((betaTest) => ({
      url: absoluteUrl(`/beta/${betaTest.id}`),
      lastModified: new Date(betaTest.updatedAt || betaTest.createdAt),
      changeFrequency: "daily" as const,
      priority: 0.8,
    }));

  const sellerLastModified = new Map<string, Date>();
  for (const listing of listings) {
    const d = new Date(listing.updatedAt || listing.createdAt);
    const prev = sellerLastModified.get(listing.sellerId);
    if (!prev || d > prev) sellerLastModified.set(listing.sellerId, d);
  }
  for (const betaTest of betaTests) {
    const d = new Date(betaTest.updatedAt || betaTest.createdAt);
    const prev = sellerLastModified.get(betaTest.creatorId);
    if (!prev || d > prev) sellerLastModified.set(betaTest.creatorId, d);
  }

  const sellerRoutes: MetadataRoute.Sitemap = Array.from(sellerLastModified.entries())
    .filter(([id]) => id.length > 0)
    .map(([id, lastMod]) => ({
      url: absoluteUrl(`/seller/${id}`),
      lastModified: lastMod,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

  return [...staticRoutes, ...listingRoutes, ...betaRoutes, ...sellerRoutes];
}

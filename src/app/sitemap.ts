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

  const betaRoutes: MetadataRoute.Sitemap = betaTests.map((betaTest) => ({
    url: absoluteUrl(`/beta/${betaTest.id}`),
    lastModified: new Date(betaTest.updatedAt || betaTest.createdAt),
    changeFrequency: "daily",
    priority: 0.8,
  }));

  const sellerIds = new Set<string>();
  for (const listing of listings) sellerIds.add(listing.sellerId);
  for (const betaTest of betaTests) sellerIds.add(betaTest.creatorId);

  const sellerRoutes: MetadataRoute.Sitemap = Array.from(sellerIds)
    .filter((id) => id.length > 0)
    .map((id) => ({
      url: absoluteUrl(`/seller/${id}`),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    }));

  return [...staticRoutes, ...listingRoutes, ...betaRoutes, ...sellerRoutes];
}

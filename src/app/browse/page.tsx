import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { getListings } from "@/lib/db/listings";
import { BrowseClient } from "./browse-client";
import { publicPageMetadata } from "@/lib/seo";

export const metadata: Metadata = publicPageMetadata({
  title: "Browse Projects",
  description: "Explore verified side projects with real metrics, pricing, and seller details.",
  path: "/browse",
});

export default async function BrowsePage() {
  const { userId } = await auth();
  const listings = await getListings();
  return <BrowseClient initialListings={listings} userId={userId ?? null} />;
}

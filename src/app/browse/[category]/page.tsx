import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getListings } from "@/lib/db/listings";
import { BrowseClient } from "../browse-client";
import { CATEGORY_LABELS } from "@/lib/constants";
import { publicPageMetadata } from "@/lib/seo";
import type { Metadata } from "next";

interface Props { params: Promise<{ category: string }> }

export function generateStaticParams() {
  return Object.keys(CATEGORY_LABELS).map((category) => ({ category }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const label = CATEGORY_LABELS[category];
  if (!label) return { title: "Not Found" };
  return publicPageMetadata({
    title: `${label} for Sale`,
    description: `Browse ${label.toLowerCase()} side projects for sale on SideFlip. Real metrics, verified sellers, transparent pricing.`,
    path: `/browse/${category}`,
  });
}

export default async function CategoryPage({ params }: Props) {
  const { category } = await params;
  if (!CATEGORY_LABELS[category]) notFound();

  const { userId } = await auth();
  const listings = await getListings();

  return (
    <BrowseClient
      initialListings={listings}
      userId={userId ?? null}
      initialCategory={category}
    />
  );
}

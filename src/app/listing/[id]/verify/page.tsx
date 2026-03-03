import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { getListingByIdForSeller } from "@/lib/db/listings";
import { getListingVerificationsForSeller } from "@/lib/db/listing-verifications";
import { VerifyListingClient } from "./verify-client";
import type { Metadata } from "next";
import { NO_INDEX_ROBOTS } from "@/lib/seo";

interface Props {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: "Verify Ownership",
  description: "Verify listing ownership with repo, domain, or manual review.",
  robots: NO_INDEX_ROBOTS,
};

export default async function VerifyListingPage({ params }: Props) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const listing = await getListingByIdForSeller(userId, id);
  if (!listing) notFound();

  const verifications = await getListingVerificationsForSeller(userId, id);
  return <VerifyListingClient listing={listing} verifications={verifications} />;
}

import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { getListingById, getListingByIdForSeller } from "@/lib/db/listings";
import { getListingVerificationsForSeller } from "@/lib/db/listing-verifications";
import { VerifyListingClient } from "./verify-client";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const listing = await getListingById(id);
  if (!listing) return {};
  return {
    title: `Verify Ownership — ${listing.title} | SideFlip`,
    description: "Verify listing ownership with repo, domain, or manual review.",
  };
}

export default async function VerifyListingPage({ params }: Props) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const listing = await getListingByIdForSeller(userId, id);
  if (!listing) notFound();

  const verifications = await getListingVerificationsForSeller(userId, id);
  return <VerifyListingClient listing={listing} verifications={verifications} />;
}

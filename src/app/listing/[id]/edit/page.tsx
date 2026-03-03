import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { getListingById } from "@/lib/db/listings";
import { EditListingForm } from "./edit-form";
import type { Metadata } from "next";
import { privatePageMetadata } from "@/lib/seo";

interface Props { params: Promise<{ id: string }> }

export const metadata: Metadata = privatePageMetadata("Edit Listing");

export default async function EditListingPage({ params }: Props) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const listing = await getListingById(id);
  if (!listing) notFound();
  if (listing.sellerId !== userId) redirect(`/listing/${id}`);

  return <EditListingForm listing={listing} />;
}

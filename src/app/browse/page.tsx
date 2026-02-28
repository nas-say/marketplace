import { getListings } from "@/lib/db/listings";
import { BrowseClient } from "./browse-client";

export default async function BrowsePage() {
  const listings = await getListings();
  return <BrowseClient initialListings={listings} />;
}

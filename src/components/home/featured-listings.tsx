import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getFeaturedListings, getListings } from "@/lib/db/listings";
import { ListingCard } from "@/components/listing/listing-card";

export async function FeaturedListings() {
  const featuredListings = await getFeaturedListings();
  const listings =
    featuredListings.length > 0 ? featuredListings : (await getListings()).slice(0, 4);

  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="eyebrow">Featured inventory</p>
            <h2 className="mt-3 text-4xl font-semibold text-zinc-50 sm:text-5xl">Listings worth a serious look.</h2>
            <p className="mt-3 text-[15px] leading-7 text-slate-400">
              {featuredListings.length > 0
                ? "Higher-signal listings with stronger metrics, clearer trust markers, and cleaner operator fit."
                : "Fresh listings from across the marketplace, even when no paid featured slots are active."}
            </p>
          </div>
          <Link
            href="/browse"
            className="hidden items-center gap-1 text-sm text-sky-300 transition-colors hover:text-sky-200 sm:flex"
          >
            View all listings
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
        <div className="mt-6 sm:hidden">
          <Link
            href="/browse"
            className="flex items-center gap-1 text-sm text-sky-300 transition-colors hover:text-sky-200"
          >
            View all listings
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

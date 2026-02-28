import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getFeaturedListings } from "@/lib/db/listings";
import { ListingCard } from "@/components/listing/listing-card";

export async function FeaturedListings() {
  const listings = await getFeaturedListings();

  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-bold text-zinc-50">Featured Projects</h2>
            <p className="mt-2 text-zinc-400">Hand-picked projects with strong revenue and growth.</p>
          </div>
          <Link
            href="/browse"
            className="hidden sm:flex items-center gap-1 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            View all projects
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
        <div className="mt-6 sm:hidden">
          <Link
            href="/browse"
            className="flex items-center gap-1 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            View all projects
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

import { getFeaturedListings } from "@/lib/data";
import { ListingCard } from "@/components/listing/listing-card";

export function FeaturedListings() {
  const listings = getFeaturedListings();

  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-zinc-50">Featured Projects</h2>
        <p className="mt-2 text-zinc-400">Hand-picked projects with strong revenue and growth.</p>
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </div>
    </section>
  );
}

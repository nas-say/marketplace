import { getProfile } from "@/lib/db/profiles";
import { getListingsBySeller } from "@/lib/db/listings";
import { getBetaTests } from "@/lib/db/beta-tests";
import { formatPrice } from "@/lib/data";
import { ListingCard } from "@/components/listing/listing-card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/shared/stat-card";
import { User, MapPin, Globe, Twitter, Github, DollarSign, Package, Star } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const seller = await getProfile(id);
  if (!seller) return {};
  return { title: `${seller.displayName} — SideFlip` };
}

export default async function SellerPage({ params }: Props) {
  const { id } = await params;
  const [seller, listings, allBetaTests] = await Promise.all([
    getProfile(id),
    getListingsBySeller(id),
    getBetaTests(),
  ]);

  if (!seller) notFound();

  const activeBetaTests = allBetaTests.filter((bt) => bt.creatorId === id && bt.status !== "closed");

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 text-sm text-zinc-500">
        <Link href="/" className="hover:text-zinc-300">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/browse" className="hover:text-zinc-300">Browse</Link>
        <span className="mx-2">/</span>
        <span className="text-zinc-300">{seller.displayName}</span>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[300px_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-zinc-800 mb-3">
                <User className="h-10 w-10 text-zinc-500" />
              </div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-zinc-50">{seller.displayName}</h1>
                {seller.verified && <Badge className="bg-green-500/10 text-green-400 border-green-500/20">Verified</Badge>}
              </div>
              <p className="mt-1 text-sm text-zinc-400">{seller.bio}</p>
            </div>
            <div className="space-y-2 text-sm text-zinc-500 mb-6">
              {seller.location && <div className="flex items-center gap-2"><MapPin className="h-4 w-4 shrink-0" /><span>{seller.location}</span></div>}
              {seller.website && (
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 shrink-0" />
                  <a href={seller.website} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-400 truncate">{seller.website.replace(/^https?:\/\//, "")}</a>
                </div>
              )}
              {seller.social.twitter && (
                <div className="flex items-center gap-2">
                  <Twitter className="h-4 w-4 shrink-0" />
                  <a href={`https://twitter.com/${seller.social.twitter}`} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-400">@{seller.social.twitter}</a>
                </div>
              )}
              {seller.social.github && (
                <div className="flex items-center gap-2">
                  <Github className="h-4 w-4 shrink-0" />
                  <a href={`https://github.com/${seller.social.github}`} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-400">{seller.social.github}</a>
                </div>
              )}
            </div>
            <div className="border-t border-zinc-800 pt-4 text-xs text-zinc-500 text-center">
              Member since {new Date(seller.stats.memberSince).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </div>
          </div>
        </aside>

        <div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 mb-8">
            <StatCard label="Total Sales" value={String(seller.stats.totalSales)} icon={<Star className="h-4 w-4" />} />
            <StatCard label="Total Earnings" value={formatPrice(seller.stats.totalEarnings)} icon={<DollarSign className="h-4 w-4" />} />
            <StatCard label="Active Listings" value={String(listings.length)} icon={<Package className="h-4 w-4" />} />
          </div>

          <div className="mb-10">
            <h2 className="text-xl font-bold text-zinc-50 mb-4">Active Listings{listings.length > 0 && <span className="ml-2 text-sm font-normal text-zinc-500">({listings.length})</span>}</h2>
            {listings.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-zinc-800 py-16 text-center">
                <Package className="h-8 w-8 text-zinc-700 mb-2" />
                <p className="text-zinc-500 text-sm">No active listings</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {listings.map((listing) => <ListingCard key={listing.id} listing={listing} />)}
              </div>
            )}
          </div>

          {activeBetaTests.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-zinc-50 mb-4">Open Beta Tests<span className="ml-2 text-sm font-normal text-zinc-500">({activeBetaTests.length})</span></h2>
              <div className="space-y-3">
                {activeBetaTests.map((bt) => (
                  <Link key={bt.id} href={`/beta/${bt.id}`} className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 hover:border-zinc-600 transition-colors">
                    <div>
                      <p className="font-medium text-zinc-200">{bt.title}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">{bt.spots.filled}/{bt.spots.total} spots filled · {bt.reward.description}</p>
                    </div>
                    <Badge className={bt.status === "accepting" ? "bg-green-500/10 text-green-400" : "bg-amber-500/10 text-amber-400"}>
                      {bt.status === "accepting" ? "Open" : "Almost Full"}
                    </Badge>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

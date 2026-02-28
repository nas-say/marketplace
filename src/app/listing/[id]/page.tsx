import { getListingById, getUserById, formatPrice, formatNumber, getListings } from "@/lib/data";
import { CATEGORY_LABELS } from "@/lib/constants";
import { TechStackBadges } from "@/components/shared/tech-stack-badges";
import { StatCard } from "@/components/shared/stat-card";
import { PurchaseCard } from "@/components/listing/purchase-card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, CheckCircle, User } from "lucide-react";
import Link from "next/link";

interface ListingDetailPageProps {
  params: Promise<{ id: string }>;
}

export function generateStaticParams() {
  return getListings().map((listing) => ({ id: listing.id }));
}

export default async function ListingDetailPage({ params }: ListingDetailPageProps) {
  const { id } = await params;
  const listing = getListingById(id);

  if (!listing) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-zinc-50">Listing not found</h1>
        <Link href="/browse" className="mt-4 text-indigo-400 hover:underline">Back to browse</Link>
      </div>
    );
  }

  const seller = getUserById(listing.sellerId);
  const TrendIcon = listing.metrics.revenueTrend === "up" ? TrendingUp : listing.metrics.revenueTrend === "down" ? TrendingDown : Minus;

  const assetLabels: Record<string, string> = {
    source_code: "Source Code",
    domain: "Domain Name",
    user_database: "User Database",
    documentation: "Documentation",
    hosting_setup: "Hosting Setup",
    support_period: "Support Period",
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <div className="mb-6 text-sm text-zinc-500">
        <Link href="/" className="hover:text-zinc-300">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/browse" className="hover:text-zinc-300">Browse</Link>
        <span className="mx-2">/</span>
        <span className="text-zinc-300">{listing.title}</span>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
        {/* Left column */}
        <div>
          <div className="flex items-start gap-3 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-zinc-50">{listing.title}</h1>
              <div className="mt-2 flex items-center gap-2">
                <Badge className="bg-indigo-600">{CATEGORY_LABELS[listing.category]}</Badge>
                <span className="text-sm text-zinc-500">Listed {new Date(listing.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
              </div>
            </div>
          </div>

          {/* Screenshot placeholder */}
          <div className="mb-8 flex h-64 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900">
            <span className="text-zinc-600">Screenshots</span>
          </div>

          {/* Description */}
          <div className="prose prose-invert max-w-none mb-8">
            {listing.description.split("\n").map((line, i) => {
              if (line.startsWith("## ")) return <h2 key={i} className="text-xl font-bold text-zinc-50 mt-6 mb-2">{line.replace("## ", "")}</h2>;
              if (line.startsWith("- ")) return <li key={i} className="text-zinc-300 ml-4">{line.replace("- ", "")}</li>;
              if (line.trim() === "") return <br key={i} />;
              return <p key={i} className="text-zinc-300">{line}</p>;
            })}
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
            <StatCard label="Monthly Revenue" value={formatPrice(listing.metrics.mrr)} icon={<TrendIcon className="h-4 w-4" />} />
            <StatCard label="Monthly Profit" value={formatPrice(listing.metrics.monthlyProfit)} />
            <StatCard label="Monthly Visitors" value={formatNumber(listing.metrics.monthlyVisitors)} />
            <StatCard label="Registered Users" value={formatNumber(listing.metrics.registeredUsers)} />
          </div>

          {/* Tech Stack */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-zinc-50 mb-3">Tech Stack</h3>
            <TechStackBadges stack={listing.techStack} max={10} />
          </div>

          {/* Assets included */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-zinc-50 mb-3">What&apos;s Included</h3>
            <div className="grid grid-cols-2 gap-2">
              {listing.assetsIncluded.map((asset) => (
                <div key={asset} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-zinc-300">{assetLabels[asset] || asset}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Seller info */}
          {seller && (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
              <h3 className="text-lg font-semibold text-zinc-50 mb-3">Seller</h3>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800">
                  <User className="h-5 w-5 text-zinc-500" />
                </div>
                <div>
                  <p className="font-medium text-zinc-50">{seller.displayName}</p>
                  <p className="text-sm text-zinc-500">Member since {new Date(seller.stats.memberSince).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</p>
                </div>
                {seller.verified && <Badge className="bg-green-500/10 text-green-500 ml-auto">Verified</Badge>}
              </div>
            </div>
          )}
        </div>

        {/* Right column - sticky price card */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <PurchaseCard
            askingPrice={formatPrice(listing.askingPrice)}
            openToOffers={listing.openToOffers}
            age={listing.metrics.age}
            revenueTrend={listing.metrics.revenueTrend}
          />
        </div>
      </div>
    </div>
  );
}

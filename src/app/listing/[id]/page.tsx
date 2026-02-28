import { getListingById, getUserById, formatPrice, formatNumber, getListings, getSimilarListings, getListingsBySeller, getRevenueMultiple } from "@/lib/data";
import { CATEGORY_LABELS } from "@/lib/constants";
import { TechStackBadges } from "@/components/shared/tech-stack-badges";
import { StatCard } from "@/components/shared/stat-card";
import { PurchaseCard } from "@/components/listing/purchase-card";
import { ListingCard } from "@/components/listing/listing-card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, CheckCircle, User, ExternalLink } from "lucide-react";
import Link from "next/link";

interface ListingDetailPageProps {
  params: Promise<{ id: string }>;
}

export function generateStaticParams() {
  return getListings().map((listing) => ({ id: listing.id }));
}

function renderDescription(text: string) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];

  const flushList = (key: string) => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={key} className="mb-4 space-y-1 ml-4 list-disc list-outside">
          {listItems.map((item, i) => (
            <li key={i} className="text-zinc-300">{item}</li>
          ))}
        </ul>
      );
      listItems = [];
    }
  };

  lines.forEach((line, i) => {
    if (line.startsWith("## ")) {
      flushList(`list-before-${i}`);
      elements.push(
        <h2 key={i} className="text-xl font-bold text-zinc-50 mt-8 mb-3 first:mt-0">
          {line.replace("## ", "")}
        </h2>
      );
    } else if (line.startsWith("- ")) {
      listItems.push(line.replace("- ", ""));
    } else if (line.trim() === "") {
      flushList(`list-${i}`);
    } else {
      flushList(`list-before-p-${i}`);
      elements.push(<p key={i} className="text-zinc-300 mb-3">{line}</p>);
    }
  });
  flushList("list-end");

  return elements;
}

export default async function ListingDetailPage({ params }: ListingDetailPageProps) {
  const { id } = await params;
  const listing = getListingById(id);

  if (!listing) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-zinc-50">Listing not found</h1>
        <Link href="/browse" className="mt-4 text-indigo-400 hover:underline block">Back to browse</Link>
      </div>
    );
  }

  const seller = getUserById(listing.sellerId);
  const similarListings = getSimilarListings(listing);
  const sellerOtherListings = seller ? getListingsBySeller(listing.sellerId).filter((l) => l.id !== listing.id).slice(0, 2) : [];

  const TrendIcon =
    listing.metrics.revenueTrend === "up"
      ? TrendingUp
      : listing.metrics.revenueTrend === "down"
      ? TrendingDown
      : Minus;

  const trendColor =
    listing.metrics.revenueTrend === "up"
      ? "text-green-400"
      : listing.metrics.revenueTrend === "down"
      ? "text-red-400"
      : "text-zinc-400";

  const revenueMultiple = getRevenueMultiple(listing.askingPrice, listing.metrics.mrr);

  const assetLabels: Record<string, string> = {
    source_code: "Source Code",
    domain: "Domain Name",
    user_database: "User Database",
    documentation: "Documentation",
    hosting_setup: "Hosting Setup",
    support_period: "30-day Support",
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
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                <Badge className="bg-indigo-600">{CATEGORY_LABELS[listing.category]}</Badge>
                <span className="text-sm text-zinc-500">
                  Listed {new Date(listing.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
                {listing.metrics.revenueTrend !== "flat" && (
                  <span className={`flex items-center gap-1 text-sm font-medium ${trendColor}`}>
                    <TrendIcon className="h-3.5 w-3.5" />
                    Revenue {listing.metrics.revenueTrend === "up" ? "growing" : "declining"}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Screenshot placeholder with gradient */}
          <div className={`mb-8 flex h-64 flex-col items-center justify-center rounded-lg border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-800`}>
            <span className="text-4xl font-black tracking-wider text-zinc-700">
              {listing.title.split(" ").map((w) => w[0]).join("").slice(0, 3)}
            </span>
            <span className="mt-2 text-xs text-zinc-600">Screenshots coming soon</span>
          </div>

          {/* Description */}
          <div className="mb-8">
            {renderDescription(listing.description)}
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
            <StatCard
              label="Monthly Revenue"
              value={formatPrice(listing.metrics.mrr)}
              icon={<TrendIcon className={`h-4 w-4 ${trendColor}`} />}
            />
            <StatCard label="Monthly Profit" value={formatPrice(listing.metrics.monthlyProfit)} />
            <StatCard label="Monthly Visitors" value={formatNumber(listing.metrics.monthlyVisitors)} />
            <StatCard label="Registered Users" value={formatNumber(listing.metrics.registeredUsers)} />
          </div>

          {/* Revenue multiple callout */}
          {listing.metrics.mrr > 0 && (
            <div className="mb-8 rounded-lg border border-indigo-500/20 bg-indigo-500/5 p-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <p className="text-sm font-medium text-zinc-300">Revenue Multiple</p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Asking price ÷ monthly revenue — typical SaaS range is 20–40×
                  </p>
                </div>
                <p className="text-3xl font-bold text-indigo-400">{revenueMultiple}</p>
              </div>
            </div>
          )}

          {/* Tech Stack */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-zinc-50 mb-3">Tech Stack</h3>
            <TechStackBadges stack={listing.techStack} max={20} />
          </div>

          {/* Assets included */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-zinc-50 mb-3">What&apos;s Included</h3>
            <div className="grid grid-cols-2 gap-2">
              {listing.assetsIncluded.map((asset) => (
                <div key={asset} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                  <span className="text-zinc-300">{assetLabels[asset] || asset}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Seller info */}
          {seller && (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 mb-8">
              <h3 className="text-lg font-semibold text-zinc-50 mb-3">About the Seller</h3>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800 shrink-0">
                  <User className="h-6 w-6 text-zinc-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link href={`/seller/${seller.id}`} className="font-semibold text-zinc-50 hover:text-indigo-400 transition-colors">
                      {seller.displayName}
                    </Link>
                    {seller.verified && (
                      <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-xs">Verified</Badge>
                    )}
                  </div>
                  <p className="text-sm text-zinc-400 mt-0.5">{seller.bio}</p>
                  <div className="mt-1 flex items-center gap-3 text-xs text-zinc-500">
                    <span>{seller.stats.totalSales} sales</span>
                    <span>Member since {new Date(seller.stats.memberSince).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>
                    {seller.website && (
                      <a href={seller.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-0.5 hover:text-indigo-400">
                        Website <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Seller's other listings */}
              {sellerOtherListings.length > 0 && (
                <div className="mt-4 border-t border-zinc-800 pt-4">
                  <p className="text-xs text-zinc-500 mb-2">More from this seller</p>
                  <div className="space-y-2">
                    {sellerOtherListings.map((l) => (
                      <Link key={l.id} href={`/listing/${l.id}`} className="flex items-center justify-between rounded-md border border-zinc-800 px-3 py-2 hover:border-zinc-600 transition-colors">
                        <span className="text-sm text-zinc-300">{l.title}</span>
                        <span className="text-sm font-medium text-violet-400">{formatPrice(l.askingPrice)}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
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
            revenueMultiple={revenueMultiple}
            mrr={formatPrice(listing.metrics.mrr)}
          />
        </div>
      </div>

      {/* Similar listings */}
      {similarListings.length > 0 && (
        <div className="mt-16 border-t border-zinc-800 pt-12">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-zinc-50">Similar Projects</h2>
              <p className="mt-1 text-zinc-400 text-sm">More {CATEGORY_LABELS[listing.category]} listings</p>
            </div>
            <Link href={`/browse?category=${listing.category}`} className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {similarListings.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

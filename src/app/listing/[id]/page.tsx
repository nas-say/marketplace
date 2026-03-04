import {
  getListingById,
  getListingByIdForSeller,
  getSimilarListings,
  getListingsBySeller,
  recordListingView,
} from "@/lib/db/listings";
import { after } from "next/server";
import { getProfile } from "@/lib/db/profiles";
import { getConnectsBalance, isListingUnlocked, getUnlockCost } from "@/lib/db/connects";
import { getRevenueMultiple, formatPrice, formatNumber } from "@/lib/data";
import { CATEGORY_LABELS } from "@/lib/constants";
import { TechStackBadges } from "@/components/shared/tech-stack-badges";
import { StatCard } from "@/components/shared/stat-card";
import { PurchaseCard } from "@/components/listing/purchase-card";
import { ListingCard } from "@/components/listing/listing-card";
import { SellerWebsiteGate } from "./seller-section";
import { OfferSection } from "./offer-section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { JsonLd } from "@/components/shared/json-ld";
import { TrendingUp, TrendingDown, Minus, CheckCircle, User, ShieldCheck, Lock } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import { absoluteUrl, NO_INDEX_ROBOTS, publicPageMetadata } from "@/lib/seo";

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const listing = await getListingById(id);
  if (!listing) {
    return {
      title: "Listing Not Found",
      robots: NO_INDEX_ROBOTS,
    };
  }

  return publicPageMetadata({
    title: `${listing.title} for Sale`,
    description: listing.pitch,
    path: `/listing/${listing.id}`,
    type: "article",
  });
}

function renderDescription(text: string) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];

  const flushList = (key: string) => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={key} className="mb-4 space-y-1 ml-4 list-disc list-outside">
          {listItems.map((item, i) => <li key={i} className="text-zinc-300">{item}</li>)}
        </ul>
      );
      listItems = [];
    }
  };

  lines.forEach((line, i) => {
    if (line.startsWith("## ")) {
      flushList(`l-${i}`);
      elements.push(<h2 key={i} className="text-xl font-bold text-zinc-50 mt-8 mb-3 first:mt-0">{line.replace("## ", "")}</h2>);
    } else if (line.startsWith("- ")) {
      listItems.push(line.replace("- ", ""));
    } else if (line.trim() === "") {
      flushList(`e-${i}`);
    } else {
      flushList(`p-${i}`);
      elements.push(<p key={i} className="text-zinc-300 mb-3">{line}</p>);
    }
  });
  flushList("end");
  return elements;
}

export default async function ListingDetailPage({ params }: Props) {
  const { id } = await params;
  const { userId } = await auth();
  let listing = await getListingById(id);
  if (!listing && userId) {
    listing = await getListingByIdForSeller(userId, id);
  }
  if (!listing) notFound();

  const isSeller = userId === listing.sellerId;

  // Pending listings must stay private until the owner verifies ownership.
  if (listing.status === "pending_verification" && !isSeller) notFound();

  const [seller, similarListings, sellerListings, unlocked, connectsBalance] = await Promise.all([
    getProfile(listing.sellerId),
    getSimilarListings(listing),
    getListingsBySeller(listing.sellerId),
    userId ? isListingUnlocked(userId, listing.id) : Promise.resolve(false),
    userId ? getConnectsBalance(userId) : Promise.resolve(0),
  ]);

  const sellerOtherListings = sellerListings.filter((l) => l.id !== listing.id).slice(0, 2);
  const unlockCost = getUnlockCost(listing.askingPrice);

  // Track view — fire after response is sent, skip seller's own views
  if (!isSeller && (listing.status === "active" || listing.status === "under_offer")) {
    after(() => recordListingView(listing.id, userId ?? null));
  }

  const TrendIcon = listing.metrics.revenueTrend === "up" ? TrendingUp : listing.metrics.revenueTrend === "down" ? TrendingDown : Minus;
  const trendColor = listing.metrics.revenueTrend === "up" ? "text-green-400" : listing.metrics.revenueTrend === "down" ? "text-red-400" : "text-zinc-400";
  const revenueMultiple = getRevenueMultiple(listing.askingPrice, listing.metrics.mrr);

  const assetLabels: Record<string, string> = {
    source_code: "Source Code", domain: "Domain Name", user_database: "User Database",
    documentation: "Documentation", hosting_setup: "Hosting Setup", support_period: "30-day Support",
  };

  const listingJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: listing.title,
    description: listing.pitch,
    category: CATEGORY_LABELS[listing.category],
    brand: {
      "@type": "Brand",
      name: "SideFlip",
    },
    offers: {
      "@type": "Offer",
      price: (listing.askingPrice / 100).toFixed(2),
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: absoluteUrl(`/listing/${listing.id}`),
      seller: {
        "@type": "Person",
        name: seller?.displayName ?? "Seller",
      },
    },
    additionalProperty: [
      { "@type": "PropertyValue", name: "MRR", value: (listing.metrics.mrr / 100).toFixed(2) },
      {
        "@type": "PropertyValue",
        name: "Monthly Profit",
        value: (listing.metrics.monthlyProfit / 100).toFixed(2),
      },
      { "@type": "PropertyValue", name: "Monthly Visitors", value: String(listing.metrics.monthlyVisitors) },
      { "@type": "PropertyValue", name: "Registered Users", value: String(listing.metrics.registeredUsers) },
    ],
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <JsonLd data={listingJsonLd} />
      <div className="mb-6 text-sm text-zinc-500">
        <Link href="/" className="hover:text-zinc-300">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/browse" className="hover:text-zinc-300">Browse</Link>
        <span className="mx-2">/</span>
        <span className="text-zinc-300">{listing.title}</span>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
        <div>
          <div className="flex items-start gap-3 mb-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-zinc-50">{listing.title}</h1>
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                <Badge className="bg-indigo-600">{CATEGORY_LABELS[listing.category]}</Badge>
                {listing.ownershipVerified && (
                  <Badge className="bg-emerald-500/10 text-emerald-300 border-emerald-500/20">
                    {listing.ownershipVerificationMethod === "repo"
                      ? "Repo Verified"
                      : listing.ownershipVerificationMethod === "domain"
                        ? "Domain Verified"
                        : "Manually Reviewed"}
                  </Badge>
                )}
                {listing.status === "pending_verification" && isSeller && (
                  <Badge className="bg-amber-500/10 text-amber-300 border-amber-500/20">
                    Pending Verification
                  </Badge>
                )}
                <span className="text-sm text-zinc-500">Listed {new Date(listing.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                {listing.metrics.revenueTrend !== "flat" && (
                  <span className={`flex items-center gap-1 text-sm font-medium ${trendColor}`}>
                    <TrendIcon className="h-3.5 w-3.5" />
                    Revenue {listing.metrics.revenueTrend === "up" ? "growing" : "declining"}
                  </span>
                )}
              </div>
              <div className="mt-3 rounded-md border border-zinc-800 bg-zinc-900/70 p-3 text-xs text-zinc-400">
                <p className="text-zinc-200">Trust checks</p>
                <p className="mt-1">
                  Ownership:{" "}
                  <span className="text-zinc-300">
                    {listing.ownershipVerified
                      ? listing.ownershipVerificationMethod === "repo"
                        ? "Repo verified"
                        : listing.ownershipVerificationMethod === "domain"
                          ? "Domain verified"
                          : "Manually reviewed"
                      : "Pending verification"}
                  </span>
                </p>
                <p className="mt-1">Seller contact stays locked until buyer unlocks with connects.</p>
                <p className="mt-1">Deals close off-platform between buyer and seller; escrow is recommended for larger amounts.</p>
              </div>
            </div>
            {isSeller && (
              <Link href={`/listing/${listing.id}/edit`} className="shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-zinc-700 text-zinc-400 hover:text-zinc-50"
                >
                  Edit listing
                </Button>
              </Link>
            )}
          </div>

          {listing.status === "under_offer" && !isSeller && (
            <div className="mb-6 rounded-lg border border-violet-500/30 bg-violet-500/10 p-4">
              <p className="text-sm text-violet-300">
                This listing is currently under offer. You can still unlock and contact the seller — deals aren&apos;t final until both parties agree.
              </p>
            </div>
          )}

          {isSeller && listing.status === "pending_verification" && (
            <div className="mb-6 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
              <p className="text-sm text-amber-300">
                This listing is hidden from buyers until ownership verification is completed.
              </p>
              <Link
                href={`/listing/${listing.id}/verify`}
                className="mt-2 inline-flex items-center gap-1 text-sm text-indigo-300 hover:text-indigo-200"
              >
                <ShieldCheck className="h-4 w-4" />
                Verify ownership now
              </Link>
            </div>
          )}

          {listing.screenshots.length > 0 && (
            <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {listing.screenshots.map((url, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={url}
                  alt={`${listing.title} screenshot ${i + 1}`}
                  className="aspect-video w-full rounded-lg border border-zinc-800 object-cover"
                />
              ))}
            </div>
          )}

          <div className="mb-8">{renderDescription(listing.description)}</div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
            <StatCard label="Monthly Revenue" value={formatPrice(listing.metrics.mrr)} icon={<TrendIcon className={`h-4 w-4 ${trendColor}`} />} />
            <StatCard label="Monthly Profit" value={formatPrice(listing.metrics.monthlyProfit)} />
            <StatCard label="Monthly Visitors" value={formatNumber(listing.metrics.monthlyVisitors)} />
            <StatCard label="Registered Users" value={formatNumber(listing.metrics.registeredUsers)} />
          </div>

          {listing.metrics.mrr > 0 && (
            <div className="mb-8 rounded-lg border border-indigo-500/20 bg-indigo-500/5 p-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <p className="text-sm font-medium text-zinc-300">Revenue Multiple</p>
                  <p className="text-xs text-zinc-500 mt-0.5">Asking price ÷ monthly revenue — typical SaaS range is 20–40×</p>
                </div>
                <p className="text-3xl font-bold text-indigo-400">{revenueMultiple}</p>
              </div>
            </div>
          )}

          <div className="mb-8">
            <h3 className="text-lg font-semibold text-zinc-50 mb-3">Tech Stack</h3>
            <TechStackBadges stack={listing.techStack} max={20} />
          </div>

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

          {seller && (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 mb-8">
              <h3 className="text-lg font-semibold text-zinc-50 mb-3">About the Seller</h3>
              {!isSeller && !unlocked ? (
                <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900/80 border border-zinc-700">
                      <Lock className="h-5 w-5 text-zinc-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-zinc-200">Seller details are locked</p>
                      <p className="mt-1 text-xs text-zinc-500">
                        Unlock this listing to view seller profile, website, and more projects from this seller.
                      </p>
                      <p className="mt-2 text-xs text-indigo-300">Use the unlock card on the right ({unlockCost} connects).</p>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800 shrink-0">
                      <User className="h-6 w-6 text-zinc-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link href={`/seller/${seller.id}`} className="font-semibold text-zinc-50 hover:text-indigo-400 transition-colors">
                          {seller.displayName}
                        </Link>
                        {seller.verified && <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-xs">Verified</Badge>}
                      </div>
                      <p className="text-sm text-zinc-400 mt-0.5">{seller.bio}</p>
                      <div className="mt-1 flex items-center gap-3 text-xs text-zinc-500 flex-wrap">
                        <span>{seller.stats.totalSales} sales</span>
                        <span>Member since {new Date(seller.stats.memberSince).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>
                        <SellerWebsiteGate
                          listingId={listing.id}
                          isUnlocked={unlocked}
                          website={unlocked ? (seller.website ?? null) : null}
                          userId={userId ?? null}
                          connectsBalance={connectsBalance}
                          unlockCost={unlockCost}
                        />
                      </div>
                    </div>
                  </div>
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
                </>
              )}
            </div>
          )}
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          {isSeller && listing.status === "pending_verification" ? (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
              <p className="text-sm text-amber-300">
                Complete ownership verification to publish this listing.
              </p>
              <Link href={`/listing/${listing.id}/verify`} className="mt-2 inline-flex text-sm text-indigo-300 hover:text-indigo-200">
                Go to verification →
              </Link>
            </div>
          ) : (
            <>
              <PurchaseCard
                askingPrice={formatPrice(listing.askingPrice)}
                openToOffers={listing.openToOffers}
                age={listing.metrics.age}
                revenueTrend={listing.metrics.revenueTrend}
                revenueMultiple={revenueMultiple}
                mrr={formatPrice(listing.metrics.mrr)}
                listingId={listing.id}
                isUnlocked={unlocked}
                userId={userId ?? null}
                connectsBalance={connectsBalance}
                unlockCost={unlockCost}
              />
              {listing.openToOffers && !isSeller && (
                <OfferSection
                  listingId={listing.id}
                  askingPriceCents={listing.askingPrice}
                  userId={userId ?? null}
                />
              )}
            </>
          )}
        </div>
      </div>

      {similarListings.length > 0 && (
        <div className="mt-16 border-t border-zinc-800 pt-12">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-zinc-50">Similar Projects</h2>
              <p className="mt-1 text-zinc-400 text-sm">More {CATEGORY_LABELS[listing.category]} listings</p>
            </div>
            <Link href={`/browse?category=${listing.category}`} className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">View all →</Link>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {similarListings.map((l) => <ListingCard key={l.id} listing={l} />)}
          </div>
        </div>
      )}
    </div>
  );
}

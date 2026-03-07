"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Bookmark,
  BookmarkCheck,
  Flame,
  Sparkles,
  ShieldCheck,
  Handshake,
  ArrowUpRight,
  Clock3,
  MessageSquareText,
} from "lucide-react";
import { Listing } from "@/types/listing";
import { TechStackBadges } from "@/components/shared/tech-stack-badges";
import { formatPrice, formatNumber } from "@/lib/formatting";
import { CATEGORY_ACCENT_CLASSES, CATEGORY_LABELS } from "@/lib/constants";
import { useWatchlist } from "@/lib/use-watchlist";
import { TiltCardShell } from "@/components/shared/tilt-card-shell";
import { ProductPreviewPanel } from "@/components/shared/product-preview-panel";

const HOT_VISITOR_THRESHOLD = 4000;
const NEW_LISTING_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;
const NEW_LISTING_CUTOFF = Date.now() - NEW_LISTING_WINDOW_MS;
const STALE_THRESHOLD_DAYS = 30;
const NOW_TS = Date.now();

interface ListingCardProps {
  listing: Listing;
}

export function ListingCard({ listing }: ListingCardProps) {
  const { isWatchlisted, toggle } = useWatchlist(listing.id);

  const isNew = new Date(listing.createdAt).getTime() > NEW_LISTING_CUTOFF;
  const isHot = listing.metrics.monthlyVisitors >= HOT_VISITOR_THRESHOLD;
  const daysSinceUpdate = Math.floor(
    (NOW_TS - new Date(listing.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
  );
  const isStale = daysSinceUpdate >= STALE_THRESHOLD_DAYS;

  const accentClassName =
    CATEGORY_ACCENT_CLASSES[listing.category] ?? "from-zinc-700/20 via-zinc-500/10 to-transparent";

  const trustLabel = listing.ownershipVerified
    ? listing.ownershipVerificationMethod === "repo"
      ? "Repository verified"
      : listing.ownershipVerificationMethod === "domain"
        ? "Domain verified"
        : "Manually reviewed"
    : "Trust check pending";

  const summaryBadges: Array<{ key: string; className: string; label: React.ReactNode }> = [];
  if (listing.featured) {
    summaryBadges.push({
      key: "featured",
      className: "border-amber-400/25 bg-amber-400/10 text-amber-200",
      label: "Featured",
    });
  }
  if (listing.status === "under_offer") {
    summaryBadges.push({
      key: "under-offer",
      className: "border-blue-400/20 bg-blue-400/10 text-blue-200",
      label: "Under offer",
    });
  } else if (isHot) {
    summaryBadges.push({
      key: "hot",
      className: "border-orange-400/20 bg-orange-400/10 text-orange-200",
      label: (
        <>
          <Flame className="mr-1 h-3 w-3" />
          Hot
        </>
      ),
    });
  } else if (isNew) {
    summaryBadges.push({
      key: "new",
      className: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
      label: (
        <>
          <Sparkles className="mr-1 h-3 w-3" />
          New
        </>
      ),
    });
  }

  return (
    <TiltCardShell className="relative" overlayClassName="rounded-[28px]">
      <Link href={`/listing/${listing.id}`} className="block h-full">
        <Card className="card-hover flex h-full min-h-[520px] cursor-pointer flex-col gap-0 overflow-hidden rounded-[28px] border-white/10 bg-[#0b1120]/95 py-0">
          <CardContent className="flex flex-1 flex-col p-5">
            <ProductPreviewPanel
              className="h-[188px]"
              imageSrc={listing.screenshots[0] ?? null}
              eyebrow={CATEGORY_LABELS[listing.category]}
              accentClassName={accentClassName}
              stats={[
                { label: "Ask", value: formatPrice(listing.askingPrice) },
                { label: "MRR", value: formatPrice(listing.metrics.mrr) },
                { label: "Visitors", value: formatNumber(listing.metrics.monthlyVisitors) },
                { label: "Users", value: formatNumber(listing.metrics.registeredUsers) },
              ]}
              footer={listing.contactMode === "proposal" ? "Proposal gate enabled" : "Direct unlock flow"}
            />

            <div className="mt-5 flex items-start justify-between gap-3 pr-10">
              <div>
                <p className="text-xs uppercase tracking-[0.26em] text-slate-500">
                  {CATEGORY_LABELS[listing.category]}  /  {trustLabel}
                </p>
                <h3 className="mt-3 line-clamp-2 text-[1.8rem] font-semibold leading-tight text-zinc-50">
                  {listing.title}
                </h3>
              </div>
              <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-slate-500" />
            </div>

            <p className="mt-3 line-clamp-3 min-h-[72px] text-sm leading-6 text-slate-300">{listing.pitch}</p>

            <div className="mt-4 flex min-h-6 flex-wrap gap-2">
              {summaryBadges.map((badge) => (
                <Badge key={badge.key} className={badge.className}>
                  {badge.label}
                </Badge>
              ))}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-[20px] border border-white/10 bg-white/[0.04] p-4">
                <p className="eyebrow">Monthly profit</p>
                <p className="mt-2 text-lg font-semibold text-zinc-50">
                  {formatPrice(listing.metrics.monthlyProfit)}
                </p>
              </div>
              <div className="rounded-[20px] border border-white/10 bg-white/[0.04] p-4">
                <p className="eyebrow">Product age</p>
                <p className="mt-2 text-lg font-semibold text-zinc-50">{listing.metrics.age}</p>
              </div>
              <div className="rounded-[20px] border border-white/10 bg-white/[0.04] p-4">
                <p className="eyebrow">Buyer flow</p>
                <p className="mt-2 text-sm font-medium text-zinc-50">
                  {listing.contactMode === "proposal" ? "Seller screens buyers" : "Unlock and message"}
                </p>
              </div>
              <div className="rounded-[20px] border border-white/10 bg-white/[0.04] p-4">
                <p className="eyebrow">Assets included</p>
                <p className="mt-2 text-lg font-semibold text-zinc-50">{listing.assetsIncluded.length}</p>
              </div>
            </div>

            <div className="mt-4 rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
              <div className="grid grid-cols-1 gap-4 text-sm text-slate-300 sm:grid-cols-3">
                <div>
                  <p className="eyebrow">Trust</p>
                  <p className="mt-2 inline-flex items-center gap-1 text-sm text-zinc-100">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
                    {trustLabel}
                  </p>
                </div>
                <div>
                  <p className="eyebrow">Contact mode</p>
                  <p className="mt-2 inline-flex items-center gap-1 text-sm text-zinc-100">
                    <MessageSquareText className="h-3.5 w-3.5 text-sky-300" />
                    {listing.contactMode === "proposal" ? "Offer first, reveal later" : "Instant unlock"}
                  </p>
                </div>
                <div>
                  <p className="eyebrow">Freshness</p>
                  <p className="mt-2 inline-flex items-center gap-1 text-sm text-zinc-100">
                    <Clock3 className="h-3.5 w-3.5 text-amber-300" />
                    {isStale ? `${daysSinceUpdate}d since last refresh` : "Recently refreshed"}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 min-h-6">
              <TechStackBadges stack={listing.techStack} max={3} />
            </div>

            <div className="mt-auto flex items-end justify-between gap-4 pt-5">
              <div>
                <p className="eyebrow">Acquisition thesis</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Revenue, traffic, and buyer flow are visible before you spend connects.
                </p>
              </div>
              <div className="text-right">
                {listing.openToOffers ? (
                  <p className="inline-flex items-center gap-1 text-sm text-sky-200">
                    <Handshake className="h-3.5 w-3.5" />
                    Open to offers
                  </p>
                ) : (
                  <p className="text-sm text-slate-400">Fixed ask</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>

      <button
        onClick={(e) => {
          e.preventDefault();
          toggle();
        }}
        className="absolute right-4 top-5 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-[#121a2a]/90 opacity-0 transition-opacity hover:border-sky-400/30 hover:bg-[#182134] group-hover:opacity-100"
        title={isWatchlisted ? "Remove from watchlist" : "Save to watchlist"}
      >
        {isWatchlisted ? (
          <BookmarkCheck className="h-4 w-4 text-sky-300" />
        ) : (
          <Bookmark className="h-4 w-4 text-slate-400" />
        )}
      </button>
    </TiltCardShell>
  );
}

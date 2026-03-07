"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Bookmark,
  BookmarkCheck,
  Flame,
  Sparkles,
  ShieldCheck,
  Handshake,
  ArrowUpRight,
} from "lucide-react";
import { Listing } from "@/types/listing";
import { TechStackBadges } from "@/components/shared/tech-stack-badges";
import { formatPrice, formatNumber } from "@/lib/formatting";
import { CATEGORY_LABELS } from "@/lib/constants";
import { useWatchlist } from "@/lib/use-watchlist";
import { TiltCardShell } from "@/components/shared/tilt-card-shell";

// Category gradient backgrounds
const CATEGORY_GRADIENTS: Record<string, string> = {
  saas: "from-blue-500 to-sky-300",
  "mobile-app": "from-sky-500 to-cyan-300",
  "chrome-extension": "from-indigo-500 to-blue-300",
  domain: "from-emerald-500 to-lime-300",
  "open-source": "from-orange-500 to-amber-300",
  "bot-automation": "from-cyan-500 to-teal-300",
  api: "from-rose-500 to-orange-300",
  "template-theme": "from-amber-500 to-yellow-300",
};

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

  const TrendIcon =
    listing.metrics.revenueTrend === "up"
      ? TrendingUp
      : listing.metrics.revenueTrend === "down"
      ? TrendingDown
      : Minus;

  const trendColor =
    listing.metrics.revenueTrend === "up"
      ? "text-green-500"
      : listing.metrics.revenueTrend === "down"
      ? "text-red-500"
      : "text-zinc-500";

  const isNew = new Date(listing.createdAt).getTime() > NEW_LISTING_CUTOFF;
  const isHot = listing.metrics.monthlyVisitors >= HOT_VISITOR_THRESHOLD;
  const daysSinceUpdate = Math.floor(
    (NOW_TS - new Date(listing.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
  );
  const isStale = daysSinceUpdate >= STALE_THRESHOLD_DAYS;

  const gradient = CATEGORY_GRADIENTS[listing.category] ?? "from-zinc-800 to-zinc-900";

  return (
    <TiltCardShell className="relative" overlayClassName="rounded-[28px]">
      <Link href={`/listing/${listing.id}`} className="block h-full">
        <Card className="card-hover flex h-full min-h-[396px] cursor-pointer flex-col gap-0 overflow-hidden rounded-[28px] border-white/10 bg-[#0b1120]/95 py-0">
          <div className={`h-1.5 w-full bg-gradient-to-r ${gradient}`} />
          <CardContent className="flex flex-1 flex-col p-0">
            <div className="border-b border-white/[0.08] p-5">
              <div className="flex items-start justify-between gap-3 pr-10">
                <div>
                  <p className="eyebrow">{CATEGORY_LABELS[listing.category]}</p>
                  <h3 className="mt-4 line-clamp-2 text-2xl font-semibold leading-tight text-zinc-50">
                    {listing.title}
                  </h3>
                </div>
                <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-slate-500" />
              </div>
              <p className="mt-3 line-clamp-3 min-h-[72px] text-sm leading-6 text-slate-300">{listing.pitch}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {listing.featured && (
                  <Badge className="border-amber-400/25 bg-amber-400/10 text-amber-200">Featured</Badge>
                )}
                {listing.status === "under_offer" && (
                  <Badge className="border-blue-400/20 bg-blue-400/10 text-blue-200">Under offer</Badge>
                )}
                {listing.contactMode === "proposal" && (
                  <Badge className="border-sky-400/20 bg-sky-400/10 text-sky-200">Proposal gate</Badge>
                )}
                {isNew && listing.status !== "under_offer" && (
                  <Badge className="border-emerald-400/20 bg-emerald-400/10 text-emerald-200">
                    <Sparkles className="mr-1 h-3 w-3" />
                    New
                  </Badge>
                )}
                {isHot && (
                  <Badge className="border-orange-400/20 bg-orange-400/10 text-orange-200">
                    <Flame className="mr-1 h-3 w-3" />
                    Hot
                  </Badge>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-px border-b border-white/[0.08] bg-white/[0.08]">
              <div className="bg-[#0b1120] p-4">
                <p className="eyebrow">MRR</p>
                <div className="mt-2 flex items-center gap-2">
                  <TrendIcon className={`h-3.5 w-3.5 ${trendColor}`} />
                  <p className="text-lg font-semibold text-zinc-50">{formatPrice(listing.metrics.mrr)}</p>
                </div>
              </div>
              <div className="bg-[#0b1120] p-4">
                <p className="eyebrow">Visitors</p>
                <p className="mt-2 text-lg font-semibold text-zinc-50">
                  {formatNumber(listing.metrics.monthlyVisitors)}
                </p>
              </div>
              <div className="bg-[#0b1120] p-4">
                <p className="eyebrow">Users</p>
                <p className="mt-2 text-lg font-semibold text-zinc-50">
                  {formatNumber(listing.metrics.registeredUsers)}
                </p>
              </div>
              <div className="bg-[#0b1120] p-4">
                <p className="eyebrow">Contact</p>
                <p className="mt-2 text-sm font-medium text-zinc-50">
                  {listing.contactMode === "proposal" ? "Seller screens buyers" : "Unlock and message"}
                </p>
              </div>
            </div>

            <div className="flex flex-1 flex-col p-5">
              <div className="min-h-[48px]">
                {listing.ownershipVerified ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-medium text-emerald-200">
                    <ShieldCheck className="h-3 w-3" />
                    {listing.ownershipVerificationMethod === "repo"
                      ? "Repository ownership verified"
                      : listing.ownershipVerificationMethod === "domain"
                        ? "Domain ownership verified"
                        : "Manually reviewed by SideFlip"}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/25 bg-amber-400/10 px-2.5 py-1 text-[11px] font-medium text-amber-200">
                    Trust check pending
                  </span>
                )}
              </div>

              <div className="mt-4 min-h-6">
                <TechStackBadges stack={listing.techStack} max={4} />
              </div>

              <div className="mt-auto flex items-end justify-between gap-4 pt-5">
                <div>
                  <p className="eyebrow">Ask</p>
                  <p className="mt-2 text-2xl font-semibold text-amber-200">{formatPrice(listing.askingPrice)}</p>
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
                  <p className="mt-2 text-xs text-slate-500">
                    {isStale ? `Last updated ${daysSinceUpdate}d ago` : "Recently refreshed"}
                  </p>
                </div>
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

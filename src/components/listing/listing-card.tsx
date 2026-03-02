"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, Bookmark, BookmarkCheck, Flame, Sparkles } from "lucide-react";
import { Listing } from "@/types/listing";
import { TechStackBadges } from "@/components/shared/tech-stack-badges";
import { formatPrice, formatNumber } from "@/lib/data";
import { CATEGORY_LABELS } from "@/lib/constants";
import { useWatchlist } from "@/lib/use-watchlist";
import { TiltCardShell } from "@/components/shared/tilt-card-shell";

// Category gradient backgrounds
const CATEGORY_GRADIENTS: Record<string, string> = {
  saas: "from-indigo-900/60 to-indigo-700/20",
  "mobile-app": "from-violet-900/60 to-violet-700/20",
  "chrome-extension": "from-blue-900/60 to-blue-700/20",
  domain: "from-emerald-900/60 to-emerald-700/20",
  "open-source": "from-orange-900/60 to-orange-700/20",
  "bot-automation": "from-cyan-900/60 to-cyan-700/20",
  api: "from-rose-900/60 to-rose-700/20",
  "template-theme": "from-amber-900/60 to-amber-700/20",
};

// Category initials for the placeholder
const CATEGORY_INITIALS: Record<string, string> = {
  saas: "SaaS",
  "mobile-app": "APP",
  "chrome-extension": "EXT",
  domain: "DOM",
  "open-source": "OSS",
  "bot-automation": "BOT",
  api: "API",
  "template-theme": "UI",
};

const CATEGORY_TEXT_COLORS: Record<string, string> = {
  saas: "text-indigo-400",
  "mobile-app": "text-violet-400",
  "chrome-extension": "text-blue-400",
  domain: "text-emerald-400",
  "open-source": "text-orange-400",
  "bot-automation": "text-cyan-400",
  api: "text-rose-400",
  "template-theme": "text-amber-400",
};

const HOT_VISITOR_THRESHOLD = 4000;
const NEW_LISTING_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;
const NEW_LISTING_CUTOFF = Date.now() - NEW_LISTING_WINDOW_MS;

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

  const gradient = CATEGORY_GRADIENTS[listing.category] ?? "from-zinc-800 to-zinc-900";
  const initials = CATEGORY_INITIALS[listing.category] ?? "?";
  const textColor = CATEGORY_TEXT_COLORS[listing.category] ?? "text-zinc-400";

  return (
    <TiltCardShell className="relative" overlayClassName="rounded-lg">
      <Link href={`/listing/${listing.id}`}>
        <Card className="card-hover flex h-full min-h-[360px] cursor-pointer flex-col border-zinc-800 bg-zinc-900">
          {/* Gradient thumbnail */}
          <div
            className={`relative h-40 bg-gradient-to-br ${gradient} rounded-t-lg flex flex-col items-center justify-center gap-1`}
          >
            <span className={`text-2xl font-bold tracking-widest ${textColor} opacity-60`}>
              {initials}
            </span>
            <span className="text-xs text-zinc-600">{listing.title}</span>

            {/* Category badge */}
            <Badge className="absolute top-2 left-2 bg-zinc-900/70 text-zinc-300 text-xs backdrop-blur-sm border border-zinc-700">
              {CATEGORY_LABELS[listing.category]}
            </Badge>

            {/* New / Hot badges */}
            <div className="absolute top-2 right-2 flex flex-col gap-1">
              {isNew && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-green-500/15 border border-green-500/30 px-1.5 py-0.5 text-[10px] font-semibold text-green-400">
                  <Sparkles className="h-2.5 w-2.5" />
                  New
                </span>
              )}
              {isHot && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-orange-500/15 border border-orange-500/30 px-1.5 py-0.5 text-[10px] font-semibold text-orange-400">
                  <Flame className="h-2.5 w-2.5" />
                  Hot
                </span>
              )}
            </div>
          </div>

          <CardContent className="flex flex-1 flex-col p-4">
            <h3 className="font-semibold text-zinc-50 truncate">{listing.title}</h3>
            <p className="mt-1 text-sm text-zinc-400 line-clamp-1">{listing.pitch}</p>

            <div className="mt-3 min-h-4 flex items-center gap-3 text-xs text-zinc-500">
              <span className="flex items-center gap-1">
                <TrendIcon className={`h-3 w-3 ${trendColor}`} />
                {formatPrice(listing.metrics.mrr)}/mo
              </span>
              <span>{formatNumber(listing.metrics.monthlyVisitors)} visitors</span>
            </div>

            <div className="mt-3 min-h-6">
              <TechStackBadges stack={listing.techStack} max={3} />
            </div>

            <div className="mt-auto flex items-center justify-between pt-3">
              <span className="text-lg font-bold text-violet-400">
                {formatPrice(listing.askingPrice)}
              </span>
              <div className="flex items-center gap-2">
                {listing.ownershipVerified && (
                  <span className="text-[10px] text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded px-1.5 py-0.5">
                    {listing.ownershipVerificationMethod === "repo"
                      ? "Repo verified"
                      : listing.ownershipVerificationMethod === "domain"
                        ? "Domain verified"
                        : "Reviewed"}
                  </span>
                )}
                {listing.openToOffers && (
                  <span className="text-xs text-zinc-500">Open to offers</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>

      {/* Watchlist button — outside the Link to avoid nested anchors */}
      <button
        onClick={(e) => {
          e.preventDefault();
          toggle();
        }}
        className="absolute bottom-[4.5rem] right-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-zinc-800/90 border border-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-zinc-700"
        title={isWatchlisted ? "Remove from watchlist" : "Save to watchlist"}
      >
        {isWatchlisted ? (
          <BookmarkCheck className="h-3.5 w-3.5 text-indigo-400" />
        ) : (
          <Bookmark className="h-3.5 w-3.5 text-zinc-400" />
        )}
      </button>
    </TiltCardShell>
  );
}

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Listing } from "@/types/listing";
import { TechStackBadges } from "@/components/shared/tech-stack-badges";
import { formatPrice, formatNumber } from "@/lib/data";
import { CATEGORY_LABELS } from "@/lib/constants";

interface ListingCardProps {
  listing: Listing;
}

export function ListingCard({ listing }: ListingCardProps) {
  const TrendIcon = listing.metrics.revenueTrend === "up"
    ? TrendingUp
    : listing.metrics.revenueTrend === "down"
    ? TrendingDown
    : Minus;

  const trendColor = listing.metrics.revenueTrend === "up"
    ? "text-green-500"
    : listing.metrics.revenueTrend === "down"
    ? "text-red-500"
    : "text-zinc-500";

  return (
    <Link href={`/listing/${listing.id}`}>
      <Card className="card-hover cursor-pointer border-zinc-800 bg-zinc-900">
        <div className="relative h-40 bg-zinc-800 rounded-t-lg flex items-center justify-center">
          <span className="text-zinc-600 text-sm">Screenshot</span>
          <Badge className="absolute top-2 left-2 bg-indigo-600 text-xs">
            {CATEGORY_LABELS[listing.category]}
          </Badge>
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold text-zinc-50 truncate">{listing.title}</h3>
          <p className="mt-1 text-sm text-zinc-400 line-clamp-1">{listing.pitch}</p>

          <div className="mt-3 flex items-center gap-3 text-xs text-zinc-500">
            <span className="flex items-center gap-1">
              <TrendIcon className={`h-3 w-3 ${trendColor}`} />
              {formatPrice(listing.metrics.mrr)}/mo
            </span>
            <span>{formatNumber(listing.metrics.monthlyVisitors)} visitors</span>
          </div>

          <div className="mt-3">
            <TechStackBadges stack={listing.techStack} max={3} />
          </div>

          <div className="mt-3 flex items-center justify-between">
            <span className="text-lg font-bold text-violet-400">
              {formatPrice(listing.askingPrice)}
            </span>
            {listing.openToOffers && (
              <span className="text-xs text-zinc-500">Open to offers</span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

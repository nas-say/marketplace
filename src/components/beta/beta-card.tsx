import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BetaTest } from "@/types/beta-test";
import { CATEGORY_LABELS } from "@/lib/constants";

interface BetaCardProps {
  betaTest: BetaTest;
}

export function BetaCard({ betaTest }: BetaCardProps) {
  const spotsRemaining = betaTest.spots.total - betaTest.spots.filled;
  const fillPercent = (betaTest.spots.filled / betaTest.spots.total) * 100;

  const statusColor =
    betaTest.status === "draft"
      ? "bg-violet-500/10 text-violet-400"
      : betaTest.status === "accepting"
      ? "bg-green-500/10 text-green-500"
      : betaTest.status === "almost_full"
      ? "bg-amber-500/10 text-amber-500"
      : "bg-zinc-500/10 text-zinc-500";

  const statusLabel =
    betaTest.status === "draft"
      ? "Draft (Funding Pending)"
      : betaTest.status === "accepting"
      ? "Accepting Testers"
      : betaTest.status === "almost_full"
      ? "Almost Full"
      : "Closed";

  return (
    <Link href={`/beta/${betaTest.id}`}>
      <Card className="card-hover cursor-pointer border-zinc-800 bg-zinc-900">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-zinc-50">{betaTest.title}</h3>
              <p className="mt-1 text-sm text-zinc-400 line-clamp-2">{betaTest.description}</p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-1">
            <Badge className={statusColor}>{statusLabel}</Badge>
            <Badge variant="secondary" className="bg-zinc-800 text-zinc-300 text-xs">
              {CATEGORY_LABELS[betaTest.category]}
            </Badge>
            {betaTest.platform.map((p) => (
              <Badge key={p} variant="outline" className="border-zinc-700 text-zinc-400 text-xs capitalize">
                {p}
              </Badge>
            ))}
          </div>

          <div className="mt-4">
            <div className="flex justify-between text-xs text-zinc-500 mb-1">
              <span>{betaTest.spots.filled} of {betaTest.spots.total} spots filled</span>
              <span>{spotsRemaining} left</span>
            </div>
            <div className="h-2 rounded-full bg-zinc-800">
              <div
                className="h-2 rounded-full bg-indigo-600 transition-all"
                style={{ width: `${fillPercent}%` }}
              />
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm font-medium text-violet-400">
              {betaTest.reward.description}
            </span>
            <span className="text-xs text-zinc-500">
              Due {new Date(betaTest.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

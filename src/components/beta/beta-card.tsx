"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BetaTest } from "@/types/beta-test";
import { CATEGORY_LABELS } from "@/lib/constants";
import { calculateCashBetaPayout } from "@/lib/payments/beta-payouts";
import { TiltCardShell } from "@/components/shared/tilt-card-shell";

interface BetaCardProps {
  betaTest: BetaTest;
}

function formatCurrencyMinor(amountMinor: number, currency = "INR"): string {
  const normalized = currency.toUpperCase();
  const amount = amountMinor / 100;
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: normalized,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${normalized} ${(amountMinor / 100).toFixed(2)}`;
  }
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
  const cashPayout =
    betaTest.reward.type === "cash" ? calculateCashBetaPayout(Number(betaTest.reward.amount ?? 0)) : null;

  return (
    <TiltCardShell overlayClassName="rounded-lg">
      <Link href={`/beta/${betaTest.id}`}>
        <Card className="card-hover flex h-full min-h-[360px] cursor-pointer flex-col border-zinc-800 bg-zinc-900">
          <CardContent className="flex flex-1 flex-col p-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="line-clamp-2 min-h-[56px] font-semibold text-zinc-50">{betaTest.title}</h3>
                <p className="mt-1 line-clamp-2 min-h-10 text-sm text-zinc-400">{betaTest.description}</p>
              </div>
            </div>

            <div className="mt-3 flex min-h-[56px] max-h-[56px] flex-wrap content-start gap-1 overflow-hidden">
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
              <div className="mb-1 flex justify-between text-xs text-zinc-500">
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

            <div className="mt-auto flex items-end justify-between pt-3">
              <div className="max-w-[78%]">
                <span className="line-clamp-2 text-sm font-medium text-violet-400">
                  {betaTest.reward.description}
                </span>
                {cashPayout && (
                  <p className="text-[11px] text-zinc-500">
                    Net after 5% fee: {formatCurrencyMinor(cashPayout.netMinor, betaTest.reward.currency)}
                  </p>
                )}
              </div>
              <span className="text-right text-xs text-zinc-500">
                Due {new Date(betaTest.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
            </div>
          </CardContent>
        </Card>
      </Link>
    </TiltCardShell>
  );
}

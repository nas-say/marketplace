"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BetaTest } from "@/types/beta-test";
import { CATEGORY_LABELS } from "@/lib/constants";
import { calculateCashBetaPayout } from "@/lib/payments/beta-payouts";
import { TiltCardShell } from "@/components/shared/tilt-card-shell";
import { ArrowUpRight, IndianRupee, ShieldCheck, Star, Users } from "lucide-react";

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
      ? "bg-slate-500/10 text-slate-300 border-slate-400/15"
      : betaTest.status === "accepting"
      ? "bg-emerald-500/10 text-emerald-300 border-emerald-400/15"
      : betaTest.status === "almost_full"
      ? "bg-amber-500/10 text-amber-300 border-amber-400/15"
      : "bg-zinc-500/10 text-zinc-400 border-zinc-400/15";

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
  const trustBadge =
    betaTest.reward.type === "cash"
      ? betaTest.reward.poolStatus === "funded"
        ? {
            className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
            label: "Reward pool funded",
          }
        : betaTest.reward.poolStatus === "partial"
          ? {
              className: "border-amber-500/30 bg-amber-500/10 text-amber-300",
              label: "Reward pool partially funded",
            }
          : {
              className: "border-amber-500/30 bg-amber-500/10 text-amber-300",
              label: "Reward funding pending",
            }
      : {
          className: "border-sky-500/30 bg-sky-500/10 text-sky-300",
          label: "Premium access reward",
        };

  return (
    <TiltCardShell overlayClassName="rounded-[28px]">
      <Link href={`/beta/${betaTest.id}`} className="block h-full">
        <Card className="card-hover flex h-full min-h-[396px] cursor-pointer flex-col gap-0 overflow-hidden rounded-[28px] border-white/10 bg-[#0b1120]/95 py-0">
          <div className="h-1.5 w-full bg-gradient-to-r from-sky-400 via-blue-500 to-amber-300" />
          <CardContent className="flex flex-1 flex-col p-0">
            <div className="border-b border-white/[0.08] p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="eyebrow">{CATEGORY_LABELS[betaTest.category]}</p>
                  <h3 className="mt-4 line-clamp-2 min-h-[62px] text-2xl font-semibold leading-tight text-zinc-50">
                    {betaTest.title}
                  </h3>
                </div>
                <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-slate-500" />
              </div>
              <p className="mt-3 line-clamp-3 min-h-[72px] text-sm leading-6 text-slate-300">
                {betaTest.description}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge className={statusColor}>{statusLabel}</Badge>
                <Badge variant="outline" className={`border text-xs ${trustBadge.className}`}>
                  {trustBadge.label}
                </Badge>
                {betaTest.platform.slice(0, 2).map((p) => (
                  <Badge key={p} variant="outline" className="border-white/10 bg-white/5 text-slate-300 text-xs capitalize">
                    {p}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-px border-b border-white/[0.08] bg-white/[0.08]">
              <div className="bg-[#0b1120] p-4">
                <p className="eyebrow">Reward</p>
                <p className="mt-2 text-lg font-semibold text-amber-200">{betaTest.reward.description}</p>
              </div>
              <div className="bg-[#0b1120] p-4">
                <p className="eyebrow">Deadline</p>
                <p className="mt-2 text-sm font-medium text-zinc-50">
                  {new Date(betaTest.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </p>
              </div>
            </div>

            <div className="flex flex-1 flex-col p-5">
              <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="eyebrow">Tester capacity</p>
                  <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                    <Users className="h-3.5 w-3.5" />
                    {spotsRemaining} left
                  </span>
                </div>
                <div className="mt-3 h-2 rounded-full bg-white/[0.08]">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-sky-400 to-blue-500 transition-all"
                    style={{ width: `${fillPercent}%` }}
                  />
                </div>
                <p className="mt-2 text-sm text-slate-400">
                  {betaTest.spots.filled} of {betaTest.spots.total} spots filled
                </p>
              </div>

              <div className="mt-4 flex min-h-6 flex-wrap gap-2">
                {betaTest.reward.type === "cash" ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-medium text-emerald-200">
                    <IndianRupee className="h-3 w-3" />
                    SideFlip pays approved testers
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full border border-sky-400/20 bg-sky-400/10 px-2.5 py-1 text-[11px] font-medium text-sky-200">
                    <Star className="h-3 w-3" />
                    Creator grants premium access directly
                  </span>
                )}
                {betaTest.reward.poolStatus === "funded" && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-medium text-emerald-200">
                    <ShieldCheck className="h-3 w-3" />
                    Ready for approvals
                  </span>
                )}
              </div>

              <div className="mt-auto pt-5">
                {cashPayout && (
                  <p className="text-sm text-slate-300">
                    Net tester payout after 5% fee:{" "}
                    <span className="font-semibold text-zinc-50">
                      {formatCurrencyMinor(cashPayout.netMinor, betaTest.reward.currency)}
                    </span>
                  </p>
                )}
                {!cashPayout && (
                  <p className="text-sm text-slate-300">Best for onboarding power users before a wider launch.</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </TiltCardShell>
  );
}

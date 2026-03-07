"use client";

import Link from "next/link";
import { ArrowUpRight, IndianRupee, ShieldCheck, Users } from "lucide-react";
import { BetaTest } from "@/types/beta-test";
import { CATEGORY_ACCENT_CLASSES, CATEGORY_LABELS } from "@/lib/constants";
import { ProductPreviewPanel } from "@/components/shared/product-preview-panel";
import { calculateCashBetaPayout } from "@/lib/payments/beta-payouts";

interface BetaSpotlightRailProps {
  betaTests: BetaTest[];
}

function formatReward(betaTest: BetaTest) {
  if (betaTest.reward.type !== "cash") {
    return betaTest.reward.description;
  }

  const normalized = betaTest.reward.currency.toUpperCase();
  const amount = betaTest.reward.amount / 100;
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: normalized,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${normalized} ${amount.toFixed(0)}`;
  }
}

function formatMinor(amountMinor: number, currency: BetaTest["reward"]["currency"]) {
  const normalized = currency.toUpperCase();
  const amount = amountMinor / 100;
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: normalized,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${normalized} ${amount.toFixed(0)}`;
  }
}

export function BetaSpotlightRail({ betaTests }: BetaSpotlightRailProps) {
  if (betaTests.length === 0) return null;

  return (
    <section className="mb-8 rounded-[32px] border border-cyan-400/10 bg-[linear-gradient(180deg,rgba(12,22,38,0.98),rgba(6,12,22,0.98))] p-5 shadow-[0_24px_80px_rgba(3,7,18,0.35)] sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow text-cyan-200/80">Testing desk</p>
          <h2 className="mt-2 text-2xl font-semibold text-zinc-50">Funded test runs ready now</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            These tests are structured, funded, and already set up for approval flow instead of casual feedback collection.
          </p>
        </div>
        <div className="rounded-full border border-cyan-400/15 bg-cyan-400/5 px-3 py-1.5 text-sm text-cyan-100/85">
          {betaTests.length} ready this week
        </div>
      </div>

      <div className="mt-5 flex snap-x gap-4 overflow-x-auto pb-1">
        {betaTests.map((betaTest) => {
          const cashPayout =
            betaTest.reward.type === "cash" ? calculateCashBetaPayout(Number(betaTest.reward.amount ?? 0)) : null;

          return (
            <Link
              key={betaTest.id}
              href={`/beta/${betaTest.id}`}
              className="group min-w-[290px] max-w-[320px] flex-1 snap-start rounded-[28px] border border-white/10 bg-[#08111f]/92 p-3 transition-colors hover:border-cyan-400/30"
            >
              <ProductPreviewPanel
                className="h-[168px]"
                eyebrow={CATEGORY_LABELS[betaTest.category]}
                accentClassName={CATEGORY_ACCENT_CLASSES[betaTest.category] ?? "from-slate-500/25 to-slate-400/5"}
                stats={[
                  { label: "Reward", value: formatReward(betaTest) },
                  { label: "Spots", value: `${betaTest.spots.total}` },
                  { label: "Filled", value: `${betaTest.spots.filled}` },
                  {
                    label: "Pool",
                    value:
                      betaTest.reward.poolStatus === "funded"
                        ? "Funded"
                        : betaTest.reward.type === "cash"
                          ? "Pending"
                          : "Access",
                  },
                ]}
                footer={betaTest.reward.type === "cash" ? "Manual payout flow live" : "Premium access reward"}
              />

              <div className="mt-4 flex items-start justify-between gap-3">
                <div>
                  <h3 className="line-clamp-2 text-lg font-semibold text-zinc-50">{betaTest.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-400">{betaTest.description}</p>
                </div>
                <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-slate-500 transition-colors group-hover:text-cyan-200" />
              </div>

              <div className="mt-4 flex items-center justify-between gap-3 text-sm">
                <span className="inline-flex items-center gap-1 text-slate-300">
                  {betaTest.reward.type === "cash" ? <IndianRupee className="h-3.5 w-3.5 text-emerald-300" /> : null}
                  {cashPayout ? `Net ${formatMinor(cashPayout.netMinor, betaTest.reward.currency)}` : "Access reward"}
                </span>
                <span className="inline-flex items-center gap-1 text-slate-300">
                  {betaTest.reward.poolStatus === "funded" ? (
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
                  ) : (
                    <Users className="h-3.5 w-3.5 text-cyan-300" />
                  )}
                  {betaTest.spots.total - betaTest.spots.filled} spots left
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

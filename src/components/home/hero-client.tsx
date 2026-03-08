import Link from "next/link";
import { ArrowRight, BadgeCheck, ChartNoAxesCombined, Handshake, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/formatting";
import { AnimatedCount } from "./animated-count";
import type { Listing } from "@/types/listing";
import { CATEGORY_LABELS } from "@/lib/constants";

interface HeroClientProps {
  listingsCount: number;
  betaTestsCount: number;
  totalSalesValue: number;
  verifiedCount: number;
  proposalCount: number;
  leadListing: Listing | null;
}

export function HeroClient({
  listingsCount,
  betaTestsCount,
  totalSalesValue,
  verifiedCount,
  proposalCount,
  leadListing,
}: HeroClientProps) {
  return (
    <div className="relative z-10 w-full py-24 sm:py-28">
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.08fr)_minmax(320px,420px)] lg:items-end">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-sky-500/20 bg-sky-500/8 px-4 py-1.5 text-sm text-sky-200">
              <Zap className="h-3.5 w-3.5" />
              Curated marketplace for indie operators
            </div>
            <div className="editorial-rule max-w-4xl">
              <h1 className="section-title">
                Buy indie products with real traction.
                <br />
                <span className="text-gradient-animated">Recruit serious beta testers.</span>
              </h1>
            </div>
            <p className="section-copy mt-6 max-w-2xl">
              SideFlip is built for founders who want live revenue, real proof, and cleaner deal flow across
              SaaS, templates, extensions, APIs, automations, and online businesses.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300">
                Verified ownership signals
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300">
                Proposal-gated seller contact
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300">
                Cash beta rewards with 5% platform fee
              </span>
            </div>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link href="/browse">
                <Button size="lg" className="min-w-[190px] bg-blue-600 text-white hover:bg-blue-500">
                  Browse Listings
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/create">
                <Button
                  size="lg"
                  variant="outline"
                  className="min-w-[190px] border-white/[0.12] bg-white/5 text-slate-200 hover:border-amber-300/35 hover:bg-amber-300/10"
                >
                  List Your Product
                </Button>
              </Link>
            </div>

            <div className="mt-12 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="metric-panel rounded-2xl p-4">
                <p className="eyebrow">Listings</p>
                <p className="mt-3 text-3xl font-semibold text-white">
                  <AnimatedCount value={listingsCount} variant="integer" />
                </p>
                <p className="mt-1 text-sm text-slate-400">Active listings live now</p>
              </div>
              <div className="metric-panel rounded-2xl p-4">
                <p className="eyebrow">Inventory</p>
                <p className="mt-3 text-3xl font-semibold text-white">
                  <AnimatedCount value={totalSalesValue} variant="currency" />
                </p>
                <p className="mt-1 text-sm text-slate-400">Asking value on-market</p>
              </div>
              <div className="metric-panel rounded-2xl p-4">
                <p className="eyebrow">Beta Tests</p>
                <p className="mt-3 text-3xl font-semibold text-white">
                  <AnimatedCount value={betaTestsCount} variant="integer" />
                </p>
                <p className="mt-1 text-sm text-slate-400">Open programs recruiting testers</p>
              </div>
              <div className="metric-panel rounded-2xl p-4">
                <p className="eyebrow">Connects</p>
                <p className="mt-3 text-3xl font-semibold text-white">Utility</p>
                <p className="mt-1 text-sm text-slate-400">Used only for seller unlocks</p>
              </div>
            </div>
          </div>

          <div className="surface-panel rounded-[28px] p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="eyebrow">Live market snapshot</p>
                <p className="mt-2 font-display text-2xl text-white">What buyers see first</p>
              </div>
              <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                Updated daily
              </div>
            </div>

            {leadListing ? (
              <Link
                href={`/listing/${leadListing.id}`}
                className="mt-6 block rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-5 transition-colors hover:border-sky-400/30"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="eyebrow">{CATEGORY_LABELS[leadListing.category]}</span>
                  <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-medium text-emerald-300">
                    {leadListing.ownershipVerified ? "Verified" : "Pending"}
                  </span>
                </div>
                <h2 className="mt-4 text-2xl font-semibold text-white">{leadListing.title}</h2>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-300">{leadListing.pitch}</p>
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-white/[0.08] bg-black/20 p-3">
                    <p className="eyebrow">MRR</p>
                    <p className="mt-2 text-lg font-semibold text-white">{formatPrice(leadListing.metrics.mrr)}</p>
                  </div>
                  <div className="rounded-2xl border border-white/[0.08] bg-black/20 p-3">
                    <p className="eyebrow">Ask</p>
                    <p className="mt-2 text-lg font-semibold text-white">{formatPrice(leadListing.askingPrice)}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between text-sm text-slate-400">
                  <span className="inline-flex items-center gap-1">
                    {leadListing.contactMode === "proposal" ? (
                      <>
                        <Handshake className="h-4 w-4 text-amber-300" />
                        Proposal-gated contact
                      </>
                    ) : (
                      <>
                        <BadgeCheck className="h-4 w-4 text-sky-300" />
                        Direct unlock contact
                      </>
                    )}
                  </span>
                  <span className="text-sky-300">Open listing</span>
                </div>
              </Link>
            ) : (
              <div className="mt-6 rounded-[24px] border border-white/10 bg-white/[0.04] p-5 text-sm text-slate-400">
                Listings will appear here as soon as inventory is live.
              </div>
            )}

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4">
                <ShieldCheck className="h-4 w-4 text-emerald-300" />
                <p className="mt-3 text-2xl font-semibold text-white">{verifiedCount}</p>
                <p className="mt-1 text-sm text-slate-400">Listings with ownership proof</p>
              </div>
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4">
                <Handshake className="h-4 w-4 text-amber-300" />
                <p className="mt-3 text-2xl font-semibold text-white">{proposalCount}</p>
                <p className="mt-1 text-sm text-slate-400">Listings using proposal-gated contact</p>
              </div>
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4">
                <ChartNoAxesCombined className="h-4 w-4 text-sky-300" />
                <p className="mt-3 text-2xl font-semibold text-white">{betaTestsCount}</p>
                <p className="mt-1 text-sm text-slate-400">Live beta programs recruiting now</p>
              </div>
            </div>

            <p className="mt-5 text-sm leading-6 text-slate-400">
              Beta testing is free to post with rewards. For cash-reward beta tests, SideFlip deducts a 5% platform fee while paying testers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

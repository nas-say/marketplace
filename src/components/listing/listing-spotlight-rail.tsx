"use client";

import Link from "next/link";
import { ArrowUpRight, Handshake, ShieldCheck } from "lucide-react";
import { Listing } from "@/types/listing";
import { CATEGORY_ACCENT_CLASSES, CATEGORY_LABELS } from "@/lib/constants";
import { formatNumber, formatPrice } from "@/lib/formatting";
import { ProductPreviewPanel } from "@/components/shared/product-preview-panel";

interface ListingSpotlightRailProps {
  listings: Listing[];
}

export function ListingSpotlightRail({ listings }: ListingSpotlightRailProps) {
  if (listings.length === 0) return null;

  return (
    <section className="surface-panel mb-8 rounded-[32px] p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Featured desk</p>
          <h2 className="mt-2 text-2xl font-semibold text-zinc-50">Verified acquisition leads</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            A tighter shortlist of projects with better traction, stronger trust signals, or active buyer flow.
          </p>
        </div>
        <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm text-slate-300">
          {listings.length} in spotlight
        </div>
      </div>

      <div className="mt-5 flex snap-x gap-4 overflow-x-auto pb-1">
        {listings.map((listing) => (
          <Link
            key={listing.id}
            href={`/listing/${listing.id}`}
            className="group min-w-[290px] max-w-[320px] flex-1 snap-start rounded-[28px] border border-white/10 bg-[#0a1220]/88 p-3 transition-colors hover:border-sky-400/30"
          >
            <ProductPreviewPanel
              className="h-[168px]"
              imageSrc={listing.screenshots[0] ?? null}
              eyebrow={CATEGORY_LABELS[listing.category]}
              accentClassName={CATEGORY_ACCENT_CLASSES[listing.category] ?? "from-slate-500/25 to-slate-400/5"}
              stats={[
                { label: "Ask", value: formatPrice(listing.askingPrice) },
                { label: "MRR", value: formatPrice(listing.metrics.mrr) },
                { label: "Users", value: formatNumber(listing.metrics.registeredUsers) },
                { label: "Flow", value: listing.contactMode === "proposal" ? "Proposal" : "Direct" },
              ]}
              footer={listing.ownershipVerified ? "Ownership verified" : "Trust review pending"}
            />

            <div className="mt-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="line-clamp-2 text-lg font-semibold text-zinc-50">{listing.title}</h3>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-400">{listing.pitch}</p>
              </div>
              <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-slate-500 transition-colors group-hover:text-sky-200" />
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 text-sm">
              <span className="inline-flex items-center gap-1 text-slate-300">
                {listing.ownershipVerified ? <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" /> : null}
                {listing.ownershipVerified ? "Verified" : "Pending review"}
              </span>
              <span className="inline-flex items-center gap-1 text-slate-300">
                <Handshake className="h-3.5 w-3.5 text-sky-300" />
                {listing.openToOffers ? "Open to offers" : "Fixed ask"}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

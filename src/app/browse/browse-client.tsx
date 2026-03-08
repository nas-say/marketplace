"use client";

import { useState, useMemo } from "react";
import { Listing } from "@/types/listing";
import { ListingGrid } from "@/components/listing/listing-grid";
import { ListingFilters } from "@/components/listing/listing-filters";
import { PageHeader } from "@/components/shared/page-header";
import { ListingSpotlightRail } from "@/components/listing/listing-spotlight-rail";
import { CATEGORY_LABELS } from "@/lib/constants";
import { X, SlidersHorizontal, Bell, BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { createSavedSearchAction } from "./actions";

interface BrowseClientProps {
  initialListings: Listing[];
  userId: string | null;
  initialCategory?: string;
}

export function BrowseClient({ initialListings, userId, initialCategory }: BrowseClientProps) {
  const reduceMotion = useReducedMotion();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(initialCategory ?? "");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sortBy, setSortBy] = useState("newest");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [alertSaved, setAlertSaved] = useState(false);
  const [alertSaving, setAlertSaving] = useState(false);

  const filtered = useMemo(() => {
    let result = [...initialListings];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (l) => l.title.toLowerCase().includes(q) || l.pitch.toLowerCase().includes(q)
      );
    }
    if (category) result = result.filter((l) => l.category === category);
    if (verifiedOnly) result = result.filter((l) => l.ownershipVerified);
    if (minPrice) result = result.filter((l) => l.askingPrice >= Number(minPrice) * 100);
    if (maxPrice) result = result.filter((l) => l.askingPrice <= Number(maxPrice) * 100);

    switch (sortBy) {
      case "price-low": result.sort((a, b) => a.askingPrice - b.askingPrice); break;
      case "price-high": result.sort((a, b) => b.askingPrice - a.askingPrice); break;
      case "revenue": result.sort((a, b) => b.metrics.mrr - a.metrics.mrr); break;
      default: result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    // Featured listings always appear first
    const featured = result.filter((l) => l.featured);
    const rest = result.filter((l) => !l.featured);
    return [...featured, ...rest];
  }, [initialListings, search, category, verifiedOnly, sortBy, minPrice, maxPrice]);

  const spotlightListings = useMemo(() => {
    const featured = filtered.filter((listing) => listing.featured);
    if (featured.length > 0) return featured.slice(0, 3);

    return [...filtered]
      .sort((a, b) => {
        const trustDelta = Number(b.ownershipVerified) - Number(a.ownershipVerified);
        if (trustDelta !== 0) return trustDelta;
        return b.metrics.mrr - a.metrics.mrr;
      })
      .slice(0, 3);
  }, [filtered]);

  const spotlightIds = new Set(spotlightListings.map((listing) => listing.id));
  const gridListings =
    filtered.length > spotlightListings.length
      ? filtered.filter((listing) => !spotlightIds.has(listing.id))
      : filtered;

  const verifiedCount = filtered.filter((listing) => listing.ownershipVerified).length;
  const proposalCount = filtered.filter((listing) => listing.contactMode === "proposal").length;

  const activeFilters = [
    search && { label: `"${search}"`, onRemove: () => setSearch("") },
    category && { label: CATEGORY_LABELS[category], onRemove: () => setCategory("") },
    verifiedOnly && { label: "Verified only", onRemove: () => setVerifiedOnly(false) },
    minPrice && { label: `Min $${minPrice}`, onRemove: () => setMinPrice("") },
    maxPrice && { label: `Max $${maxPrice}`, onRemove: () => setMaxPrice("") },
  ].filter(Boolean) as { label: string; onRemove: () => void }[];

  const clearAll = () => {
    setSearch("");
    setCategory("");
    setVerifiedOnly(false);
    setMinPrice("");
    setMaxPrice("");
    setSortBy("newest");
    setAlertSaved(false);
  };

  const handleSaveSearch = async () => {
    if (!userId) {
      alert("Sign in to save search alerts.");
      return;
    }
    if (alertSaved || alertSaving) return;
    setAlertSaving(true);
    const maxPriceCents = maxPrice ? Math.round(Number(maxPrice) * 100) : null;
    const result = await createSavedSearchAction(category || null, maxPriceCents);
    setAlertSaving(false);
    if (result.error) { alert(result.error); return; }
    setAlertSaved(true);
  };

  const filtersProps = {
    search, onSearchChange: setSearch,
    selectedCategory: category, onCategoryChange: setCategory,
    verifiedOnly, onVerifiedOnlyChange: setVerifiedOnly,
    sortBy, onSortChange: setSortBy,
    minPrice, onMinPriceChange: setMinPrice,
    maxPrice, onMaxPriceChange: setMaxPrice,
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="surface-panel mb-8 rounded-[32px] p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <PageHeader
              eyebrow="Deal Room"
              title="Browse Listings"
              description="Acquisition-ready indie products and online businesses with cleaner deal sheets, trust markers, and clearer buyer flow before you spend connects."
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:w-[420px]">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="eyebrow">Live inventory</p>
              <p className="mt-3 text-3xl font-semibold text-zinc-50">{filtered.length}</p>
              <p className="mt-1 text-sm text-slate-400">Listings matching current filters</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="eyebrow">Verified</p>
              <p className="mt-3 text-3xl font-semibold text-zinc-50">{verifiedCount}</p>
              <p className="mt-1 text-sm text-slate-400">Listings with ownership proof</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="eyebrow">Screened deals</p>
              <p className="mt-3 text-3xl font-semibold text-zinc-50">{proposalCount}</p>
              <p className="mt-1 text-sm text-slate-400">Sellers screening buyers before reveal</p>
            </div>
          </div>
        </div>

        {(category || maxPrice) && (
          <button
            onClick={handleSaveSearch}
            disabled={alertSaving}
            className={`mt-6 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors
              ${alertSaved
                ? "border-sky-400/30 bg-sky-400/10 text-sky-200"
                : "border-white/10 bg-white/5 text-slate-300 hover:border-sky-400/30 hover:text-sky-200"
              }`}
            title={alertSaved ? "Alert saved" : "Save this search for daily alerts"}
          >
            {alertSaved ? <BellRing className="h-3.5 w-3.5" /> : <Bell className="h-3.5 w-3.5" />}
            {alertSaved ? "Alert saved" : "Save search"}
          </button>
        )}
      </div>

      <div className="mb-4 lg:hidden">
        <Button variant="outline" size="sm" className="border-white/10 bg-white/5 text-slate-200" onClick={() => setMobileFiltersOpen((o) => !o)}>
          <SlidersHorizontal className="mr-2 h-4 w-4" />
          Filters
          {activeFilters.length > 0 && (
            <span className="ml-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">{activeFilters.length}</span>
          )}
        </Button>
      </div>

      <AnimatePresence initial={false}>
        {mobileFiltersOpen && (
          <motion.div
            initial={reduceMotion ? undefined : { opacity: 0, y: -8 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="surface-panel mb-6 rounded-[28px] p-4 lg:hidden"
          >
            <ListingFilters {...filtersProps} />
          </motion.div>
        )}
      </AnimatePresence>

      {activeFilters.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <AnimatePresence initial={false}>
            {activeFilters.map((f) => (
              <motion.span
                key={f.label}
                initial={reduceMotion ? undefined : { opacity: 0, scale: 0.92 }}
                animate={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
                exit={reduceMotion ? undefined : { opacity: 0, scale: 0.92 }}
                transition={{ duration: 0.18 }}
                className="inline-flex items-center gap-1 rounded-full border border-sky-400/20 bg-sky-400/10 px-2.5 py-1 text-xs text-sky-200"
              >
                {f.label}
                <button onClick={f.onRemove}><X className="h-3 w-3" /></button>
              </motion.span>
            ))}
          </AnimatePresence>
          <button onClick={clearAll} className="text-xs text-slate-500 underline underline-offset-2 hover:text-slate-300">Clear all</button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[290px_1fr]">
        <aside className="hidden lg:block">
          <ListingFilters {...filtersProps} />
        </aside>
        <div>
          <ListingSpotlightRail listings={spotlightListings} />
          {filtered.length === 0 ? (
            <div className="surface-panel flex flex-col items-center justify-center rounded-[32px] py-24 text-center">
              <p className="eyebrow">No matches</p>
              <p className="mt-3 text-2xl font-semibold text-zinc-50">No projects found</p>
              <p className="mt-2 text-sm text-slate-400">Try adjusting your filters or search term.</p>
              <button onClick={clearAll} className="mt-4 text-sm text-sky-300 hover:text-sky-200">Clear all filters</button>
            </div>
          ) : (
            <ListingGrid listings={gridListings} />
          )}
        </div>
      </div>
    </div>
  );
}

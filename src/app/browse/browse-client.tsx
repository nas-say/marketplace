"use client";

import { useState, useMemo } from "react";
import { Listing } from "@/types/listing";
import { ListingGrid } from "@/components/listing/listing-grid";
import { ListingFilters } from "@/components/listing/listing-filters";
import { PageHeader } from "@/components/shared/page-header";
import { CATEGORY_LABELS } from "@/lib/constants";
import { X, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

interface BrowseClientProps {
  initialListings: Listing[];
}

export function BrowseClient({ initialListings }: BrowseClientProps) {
  const reduceMotion = useReducedMotion();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const filtered = useMemo(() => {
    let result = [...initialListings];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (l) => l.title.toLowerCase().includes(q) || l.pitch.toLowerCase().includes(q)
      );
    }
    if (category) result = result.filter((l) => l.category === category);
    if (minPrice) result = result.filter((l) => l.askingPrice >= Number(minPrice) * 100);
    if (maxPrice) result = result.filter((l) => l.askingPrice <= Number(maxPrice) * 100);

    switch (sortBy) {
      case "price-low": result.sort((a, b) => a.askingPrice - b.askingPrice); break;
      case "price-high": result.sort((a, b) => b.askingPrice - a.askingPrice); break;
      case "revenue": result.sort((a, b) => b.metrics.mrr - a.metrics.mrr); break;
      default: result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return result;
  }, [initialListings, search, category, sortBy, minPrice, maxPrice]);

  const activeFilters = [
    search && { label: `"${search}"`, onRemove: () => setSearch("") },
    category && { label: CATEGORY_LABELS[category], onRemove: () => setCategory("") },
    minPrice && { label: `Min $${minPrice}`, onRemove: () => setMinPrice("") },
    maxPrice && { label: `Max $${maxPrice}`, onRemove: () => setMaxPrice("") },
  ].filter(Boolean) as { label: string; onRemove: () => void }[];

  const clearAll = () => { setSearch(""); setCategory(""); setMinPrice(""); setMaxPrice(""); setSortBy("newest"); };

  const filtersProps = {
    search, onSearchChange: setSearch,
    selectedCategory: category, onCategoryChange: setCategory,
    sortBy, onSortChange: setSortBy,
    minPrice, onMinPriceChange: setMinPrice,
    maxPrice, onMaxPriceChange: setMaxPrice,
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader title="Browse Projects" description={`${filtered.length} project${filtered.length !== 1 ? "s" : ""} available`} />

      <div className="mb-4 lg:hidden">
        <Button variant="outline" size="sm" className="border-zinc-700 text-zinc-300" onClick={() => setMobileFiltersOpen((o) => !o)}>
          <SlidersHorizontal className="mr-2 h-4 w-4" />
          Filters
          {activeFilters.length > 0 && (
            <span className="ml-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">{activeFilters.length}</span>
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
            className="mb-6 rounded-lg border border-zinc-800 bg-zinc-900 p-4 lg:hidden"
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
                className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 text-xs text-indigo-300"
              >
                {f.label}
                <button onClick={f.onRemove}><X className="h-3 w-3" /></button>
              </motion.span>
            ))}
          </AnimatePresence>
          <button onClick={clearAll} className="text-xs text-zinc-500 hover:text-zinc-300 underline underline-offset-2">Clear all</button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="hidden lg:block">
          <ListingFilters {...filtersProps} />
        </aside>
        <div>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <p className="text-lg font-semibold text-zinc-50">No projects found</p>
              <p className="mt-2 text-sm text-zinc-500">Try adjusting your filters or search term.</p>
              <button onClick={clearAll} className="mt-4 text-sm text-indigo-400 hover:text-indigo-300">Clear all filters</button>
            </div>
          ) : (
            <ListingGrid listings={filtered} />
          )}
        </div>
      </div>
    </div>
  );
}

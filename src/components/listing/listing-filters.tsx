"use client";

import { SearchBar } from "@/components/shared/search-bar";
import { CATEGORY_LABELS } from "@/lib/constants";

interface ListingFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  verifiedOnly: boolean;
  onVerifiedOnlyChange: (value: boolean) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
  minPrice: string;
  onMinPriceChange: (value: string) => void;
  maxPrice: string;
  onMaxPriceChange: (value: string) => void;
}

export function ListingFilters({
  search,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  verifiedOnly,
  onVerifiedOnlyChange,
  sortBy,
  onSortChange,
  minPrice,
  onMinPriceChange,
  maxPrice,
  onMaxPriceChange,
}: ListingFiltersProps) {
  return (
    <div className="surface-panel rounded-[28px] p-5">
      <div className="mb-5">
        <p className="eyebrow">Filter desk</p>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Narrow by category, trust level, and price band.
        </p>
      </div>

      <div className="space-y-6">
        <SearchBar value={search} onChange={onSearchChange} />

        <div>
          <h3 className="eyebrow mb-3">Category</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onCategoryChange("")}
              className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
                selectedCategory === ""
                  ? "bg-blue-600 text-white"
                  : "border border-white/10 bg-white/5 text-slate-300 hover:border-sky-400/25"
              }`}
            >
              All
            </button>
            {Object.entries(CATEGORY_LABELS).map(([slug, label]) => (
              <button
                key={slug}
                onClick={() => onCategoryChange(slug)}
                className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
                  selectedCategory === slug
                    ? "bg-blue-600 text-white"
                    : "border border-white/10 bg-white/5 text-slate-300 hover:border-sky-400/25"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="eyebrow mb-3">Price band</h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">$</span>
              <input
                type="number"
                min="0"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => onMinPriceChange(e.target.value)}
                className="h-11 w-full rounded-2xl border border-white/10 bg-white/5 pl-7 pr-3 text-sm text-zinc-50 placeholder:text-slate-500"
              />
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">$</span>
              <input
                type="number"
                min="0"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => onMaxPriceChange(e.target.value)}
                className="h-11 w-full rounded-2xl border border-white/10 bg-white/5 pl-7 pr-3 text-sm text-zinc-50 placeholder:text-slate-500"
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className="eyebrow mb-3">Trust</h3>
          <button
            type="button"
            onClick={() => onVerifiedOnlyChange(!verifiedOnly)}
            className={`w-full rounded-2xl border px-4 py-3 text-left text-sm transition-colors ${
              verifiedOnly
                ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
                : "border-white/10 bg-white/5 text-slate-300 hover:border-sky-400/25"
            }`}
          >
            {verifiedOnly ? "Verified listings only" : "Show all verification states"}
          </button>
        </div>

        <div>
          <h3 className="eyebrow mb-3">Sort</h3>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="h-11 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-zinc-50"
          >
            <option value="newest">Newest first</option>
            <option value="price-low">Price: low to high</option>
            <option value="price-high">Price: high to low</option>
            <option value="revenue">Highest revenue</option>
          </select>
        </div>
      </div>
    </div>
  );
}

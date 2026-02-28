"use client";

import { SearchBar } from "@/components/shared/search-bar";
import { CATEGORY_LABELS } from "@/lib/constants";

interface ListingFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
}

export function ListingFilters({
  search,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  sortBy,
  onSortChange,
}: ListingFiltersProps) {
  return (
    <div className="space-y-6">
      <SearchBar value={search} onChange={onSearchChange} />

      <div>
        <h3 className="mb-3 text-sm font-semibold text-zinc-50">Category</h3>
        <div className="space-y-2">
          <button
            onClick={() => onCategoryChange("")}
            className={`block w-full text-left text-sm px-2 py-1 rounded ${
              selectedCategory === "" ? "bg-indigo-600 text-white" : "text-zinc-400 hover:text-zinc-50"
            }`}
          >
            All Categories
          </button>
          {Object.entries(CATEGORY_LABELS).map(([slug, label]) => (
            <button
              key={slug}
              onClick={() => onCategoryChange(slug)}
              className={`block w-full text-left text-sm px-2 py-1 rounded ${
                selectedCategory === slug ? "bg-indigo-600 text-white" : "text-zinc-400 hover:text-zinc-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-zinc-50">Sort By</h3>
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-50"
        >
          <option value="newest">Newest First</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
          <option value="revenue">Highest Revenue</option>
        </select>
      </div>
    </div>
  );
}

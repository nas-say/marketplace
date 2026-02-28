"use client";

import { useState, useMemo } from "react";
import { getListings } from "@/lib/data";
import { ListingGrid } from "@/components/listing/listing-grid";
import { ListingFilters } from "@/components/listing/listing-filters";
import { PageHeader } from "@/components/shared/page-header";

export default function BrowsePage() {
  const allListings = getListings();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  const filtered = useMemo(() => {
    let result = allListings.filter((l) => l.status === "active");

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (l) => l.title.toLowerCase().includes(q) || l.pitch.toLowerCase().includes(q)
      );
    }

    if (category) {
      result = result.filter((l) => l.category === category);
    }

    switch (sortBy) {
      case "price-low":
        result.sort((a, b) => a.askingPrice - b.askingPrice);
        break;
      case "price-high":
        result.sort((a, b) => b.askingPrice - a.askingPrice);
        break;
      case "revenue":
        result.sort((a, b) => b.metrics.mrr - a.metrics.mrr);
        break;
      default:
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return result;
  }, [allListings, search, category, sortBy]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader title="Browse Projects" description={`${filtered.length} projects available`} />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="hidden lg:block">
          <ListingFilters
            search={search}
            onSearchChange={setSearch}
            selectedCategory={category}
            onCategoryChange={setCategory}
            sortBy={sortBy}
            onSortChange={setSortBy}
          />
        </aside>
        <div>
          {/* Mobile filters */}
          <div className="mb-4 lg:hidden">
            <ListingFilters
              search={search}
              onSearchChange={setSearch}
              selectedCategory={category}
              onCategoryChange={setCategory}
              sortBy={sortBy}
              onSortChange={setSortBy}
            />
          </div>
          <ListingGrid listings={filtered} />
        </div>
      </div>
    </div>
  );
}

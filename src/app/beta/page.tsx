"use client";

import { useState, useMemo } from "react";
import { getBetaTests } from "@/lib/data";
import { BetaGrid } from "@/components/beta/beta-grid";
import { SearchBar } from "@/components/shared/search-bar";
import { PageHeader } from "@/components/shared/page-header";

export default function BetaPage() {
  const allBetaTests = getBetaTests();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const filtered = useMemo(() => {
    let result = [...allBetaTests];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (bt) => bt.title.toLowerCase().includes(q) || bt.description.toLowerCase().includes(q)
      );
    }

    if (statusFilter) {
      result = result.filter((bt) => bt.status === statusFilter);
    }

    return result;
  }, [allBetaTests, search, statusFilter]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader title="Beta Test Board" description="Find projects to test and earn rewards" />

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex-1">
          <SearchBar value={search} onChange={setSearch} placeholder="Search beta tests..." />
        </div>
        <div className="flex gap-2">
          {["", "accepting", "almost_full", "closed"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`rounded-full px-3 py-1 text-sm ${
                statusFilter === status
                  ? "bg-indigo-600 text-white"
                  : "bg-zinc-800 text-zinc-400 hover:text-zinc-50"
              }`}
            >
              {status === "" ? "All" : status === "accepting" ? "Open" : status === "almost_full" ? "Almost Full" : "Closed"}
            </button>
          ))}
        </div>
      </div>

      <BetaGrid betaTests={filtered} />
    </div>
  );
}

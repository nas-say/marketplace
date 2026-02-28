"use client";

import { useState, useMemo } from "react";
import { BetaTest } from "@/types/beta-test";
import { User } from "@/types/user";
import { BetaGrid } from "@/components/beta/beta-grid";
import { SearchBar } from "@/components/shared/search-bar";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Trophy, User as UserIcon } from "lucide-react";

interface Props {
  betaTests: BetaTest[];
  topTesters: User[];
}

const medalColors = ["text-yellow-400", "text-zinc-300", "text-amber-600", "text-zinc-400", "text-zinc-400"];

export function BetaPageClient({ betaTests, topTesters }: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const filtered = useMemo(() => {
    let result = [...betaTests];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((bt) => bt.title.toLowerCase().includes(q) || bt.description.toLowerCase().includes(q));
    }
    if (statusFilter) result = result.filter((bt) => bt.status === statusFilter);
    return result;
  }, [betaTests, search, statusFilter]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader title="Beta Test Board" description="Find projects to test and earn rewards" />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_280px]">
        <div>
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex-1">
              <SearchBar value={search} onChange={setSearch} placeholder="Search beta tests..." />
            </div>
            <div className="flex gap-2 flex-wrap">
              {["", "accepting", "almost_full", "closed"].map((status) => (
                <button key={status} onClick={() => setStatusFilter(status)}
                  className={`rounded-full px-3 py-1 text-sm transition-colors ${statusFilter === status ? "bg-indigo-600 text-white" : "bg-zinc-800 text-zinc-400 hover:text-zinc-50"}`}>
                  {status === "" ? "All" : status === "accepting" ? "Open" : status === "almost_full" ? "Almost Full" : "Closed"}
                </button>
              ))}
            </div>
          </div>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="font-semibold text-zinc-50">No beta tests found</p>
              <p className="mt-1 text-sm text-zinc-500">Try a different search or filter.</p>
            </div>
          ) : (
            <BetaGrid betaTests={filtered} />
          )}
        </div>
        <aside>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5 sticky top-24">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="h-4 w-4 text-yellow-400" />
              <h3 className="text-sm font-semibold text-zinc-50">Top Beta Testers</h3>
            </div>
            <div className="space-y-3">
              {topTesters.map((user, i) => (
                <div key={user.id} className="flex items-center gap-3">
                  <span className={`text-sm font-bold w-4 text-center ${medalColors[i]}`}>
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`}
                  </span>
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-800 shrink-0">
                    <UserIcon className="h-4 w-4 text-zinc-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <p className="text-sm font-medium text-zinc-200 truncate">{user.displayName}</p>
                      {user.verified && <span className="shrink-0 text-[10px] text-green-400">✓</span>}
                    </div>
                    <p className="text-xs text-zinc-500">{user.stats.feedbackGiven} feedbacks</p>
                  </div>
                  <Badge variant="secondary" className="bg-zinc-800 text-zinc-400 text-xs shrink-0">
                    {user.stats.betaTestsCompleted} tests
                  </Badge>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-zinc-600 text-center">Rankings based on feedback submitted</p>
          </div>
        </aside>
      </div>
    </div>
  );
}

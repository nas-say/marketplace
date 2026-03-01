"use client";

import { useState } from "react";
import { Listing } from "@/types/listing";
import { BetaTest } from "@/types/beta-test";
import { StatCard } from "@/components/shared/stat-card";
import { PageHeader } from "@/components/shared/page-header";
import { BetaCard } from "@/components/beta/beta-card";
import { DollarSign, Package, TestTube, MessageSquare, PlusCircle, Pencil, Trash2, CheckCheck, Eye, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/data";
import { deleteListingAction, markSoldAction } from "./actions";

const MONTHLY_DATA = [
  { month: "Mar", value: 22, label: "$22K" }, { month: "Apr", value: 35, label: "$35K" },
  { month: "May", value: 28, label: "$28K" }, { month: "Jun", value: 52, label: "$52K" },
  { month: "Jul", value: 41, label: "$41K" }, { month: "Aug", value: 68, label: "$68K" },
  { month: "Sep", value: 58, label: "$58K" }, { month: "Oct", value: 74, label: "$74K" },
  { month: "Nov", value: 45, label: "$45K" }, { month: "Dec", value: 80, label: "$80K" },
  { month: "Jan", value: 65, label: "$65K" }, { month: "Feb", value: 100, label: "$100K" },
];

const tabs = ["Overview", "My Listings", "Beta Tests", "Earnings"];

interface Props {
  displayName: string;
  stats: { totalEarnings: string; activeListings: number; betaTests: number; feedbackGiven: number };
  listings: Listing[];
  betaTests: BetaTest[];
}

export function DashboardClient({ displayName, stats, listings, betaTests }: Props) {
  const [activeTab, setActiveTab] = useState("Overview");
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  const [myListings, setMyListings] = useState(listings);

  const handleDelete = async (listingId: string) => {
    if (!window.confirm("Delete this listing? This cannot be undone.")) return;
    const result = await deleteListingAction(listingId);
    if (!result.error) setMyListings((prev) => prev.filter((l) => l.id !== listingId));
  };

  const handleMarkSold = async (listingId: string) => {
    if (!window.confirm("Mark this listing as sold?")) return;
    const result = await markSoldAction(listingId);
    if (!result.error) setMyListings((prev) => prev.map((l) => l.id === listingId ? { ...l, status: "sold" as const } : l));
  };

  const recentActivity = [
    { text: betaTests[0] ? `New feedback received on ${betaTests[0].title}` : "No recent beta test activity", time: "2 hours ago", dot: "bg-green-500" },
    { text: listings[0] ? `${listings[0].title} viewed 45 times today` : "No recent listing views", time: "1 day ago", dot: "bg-indigo-500" },
    { text: betaTests[1] ? `${betaTests[1].title} is almost full` : "Create a beta test to get started", time: "3 days ago", dot: "bg-amber-500" },
    { text: listings[1] ? `${listings[1].title} price updated` : "Add more listings to track activity", time: "5 days ago", dot: "bg-zinc-500" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-start justify-between mb-8">
        <PageHeader title="Dashboard" description={`Welcome back, ${displayName}`} />
        <Link href="/create">
          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-500 shrink-0">
            <PlusCircle className="mr-1.5 h-4 w-4" />New Listing
          </Button>
        </Link>
      </div>

      <div className="mb-8 flex gap-1 rounded-lg bg-zinc-900 p-1 overflow-x-auto">
        {tabs.map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === tab ? "bg-zinc-800 text-zinc-50" : "text-zinc-400 hover:text-zinc-50"}`}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Overview" && (
        <div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
            <StatCard label="Total Earnings" value={stats.totalEarnings} icon={<DollarSign className="h-4 w-4" />} />
            <StatCard label="Active Listings" value={String(stats.activeListings)} icon={<Package className="h-4 w-4" />} />
            <StatCard label="Beta Tests" value={String(stats.betaTests)} icon={<TestTube className="h-4 w-4" />} />
            <StatCard label="Feedback Given" value={String(stats.feedbackGiven)} icon={<MessageSquare className="h-4 w-4" />} />
          </div>
          <h3 className="text-lg font-semibold text-zinc-50 mb-4">Recent Activity</h3>
          <div className="space-y-2">
            {recentActivity.map((a, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3">
                <span className={`h-2 w-2 shrink-0 rounded-full ${a.dot}`} />
                <span className="flex-1 text-sm text-zinc-300">{a.text}</span>
                <span className="text-xs text-zinc-500 whitespace-nowrap">{a.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "My Listings" && (
        <div>
          {myListings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Package className="h-10 w-10 text-zinc-700 mb-3" />
              <p className="font-semibold text-zinc-50">No listings yet</p>
              <p className="mt-1 text-sm text-zinc-500">List your first project to start selling.</p>
              <Link href="/create" className="mt-4"><Button size="sm" className="bg-indigo-600 hover:bg-indigo-500">Create listing</Button></Link>
            </div>
          ) : (
            <div className="space-y-3">
              {myListings.map((listing) => (
                <div key={listing.id} className="flex items-center gap-4 rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-zinc-200 truncate">{listing.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-sm text-zinc-400">{formatPrice(listing.askingPrice)}</span>
                      <Badge className={
                        listing.status === "active"
                          ? "bg-green-500/10 text-green-400 border-green-500/20"
                          : listing.status === "sold"
                            ? "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                            : listing.status === "pending_verification"
                              ? "bg-indigo-500/10 text-indigo-300 border-indigo-500/20"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      }>
                        {listing.status === "pending_verification" ? "pending verification" : listing.status}
                      </Badge>
                      {listing.ownershipVerified && (
                        <Badge className="bg-emerald-500/10 text-emerald-300 border-emerald-500/20">
                          {listing.ownershipVerificationMethod === "repo"
                            ? "repo verified"
                            : listing.ownershipVerificationMethod === "domain"
                              ? "domain verified"
                              : "manually reviewed"}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link href={`/listing/${listing.id}`}>
                      <Button size="sm" variant="outline" className="border-zinc-700 text-zinc-400 hover:text-zinc-50 px-2">
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                    <Link href={`/listing/${listing.id}/edit`}>
                      <Button size="sm" variant="outline" className="border-zinc-700 text-zinc-400 hover:text-zinc-50 px-2">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                    {listing.status === "pending_verification" && (
                      <Link href={`/listing/${listing.id}/verify`}>
                        <Button size="sm" variant="outline" className="border-indigo-500/40 text-indigo-300 hover:text-indigo-200 px-2">
                          <ShieldCheck className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    )}
                    {listing.status === "active" && (
                      <Button size="sm" variant="outline" className="border-zinc-700 text-amber-400 hover:text-amber-300 px-2" onClick={() => handleMarkSold(listing.id)}>
                        <CheckCheck className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button size="sm" variant="outline" className="border-zinc-700 text-red-400 hover:text-red-300 px-2" onClick={() => handleDelete(listing.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "Beta Tests" && (
        <div>
          <h3 className="text-lg font-semibold text-zinc-50 mb-4">My Beta Tests</h3>
          {betaTests.length === 0 ? (
            <p className="text-center text-zinc-500 py-12">No beta tests yet.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {betaTests.map((bt) => <BetaCard key={bt.id} betaTest={bt} />)}
            </div>
          )}
        </div>
      )}

      {activeTab === "Earnings" && (
        <div>
          <div className="grid grid-cols-3 gap-4 mb-8">
            <StatCard label="Total Earned" value={stats.totalEarnings} />
            <StatCard label="Total Sales" value={String(listings.filter((l) => l.status === "sold").length)} />
            <StatCard label="Active Listings" value={String(stats.activeListings)} />
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-zinc-50">Monthly Earnings</h3>
              <span className="text-xs text-zinc-500">Last 12 months</span>
            </div>
            <div className="flex items-end gap-1.5 h-44">
              {MONTHLY_DATA.map((d, i) => (
                <div key={i} className="relative flex-1 flex flex-col items-center gap-1.5"
                  onMouseEnter={() => setHoveredBar(i)} onMouseLeave={() => setHoveredBar(null)}>
                  {hoveredBar === i && (
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-zinc-700 px-2 py-0.5 text-[10px] text-zinc-100 shadow z-10">{d.label}</div>
                  )}
                  <div className={`w-full rounded-t transition-colors ${hoveredBar === i ? "bg-indigo-400" : i === MONTHLY_DATA.length - 1 ? "bg-indigo-500" : "bg-indigo-800 hover:bg-indigo-600"}`}
                    style={{ height: `${(d.value / 100) * 100}%` }} />
                  <span className="text-[9px] text-zinc-500">{d.month}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { getListings, getBetaTests, formatPrice, getUserById } from "@/lib/data";
import { StatCard } from "@/components/shared/stat-card";
import { PageHeader } from "@/components/shared/page-header";
import { ListingCard } from "@/components/listing/listing-card";
import { BetaCard } from "@/components/beta/beta-card";
import { DollarSign, Package, TestTube, MessageSquare, PlusCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const tabs = ["Overview", "My Listings", "Beta Tests", "Earnings"];

// Simulated monthly earnings data for the chart (relative values)
const MONTHLY_DATA = [
  { month: "Mar", value: 22, label: "$22K" },
  { month: "Apr", value: 35, label: "$35K" },
  { month: "May", value: 28, label: "$28K" },
  { month: "Jun", value: 52, label: "$52K" },
  { month: "Jul", value: 41, label: "$41K" },
  { month: "Aug", value: 68, label: "$68K" },
  { month: "Sep", value: 58, label: "$58K" },
  { month: "Oct", value: 74, label: "$74K" },
  { month: "Nov", value: 45, label: "$45K" },
  { month: "Dec", value: 80, label: "$80K" },
  { month: "Jan", value: 65, label: "$65K" },
  { month: "Feb", value: 100, label: "$100K" },
];

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("Overview");
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  const currentUser = getUserById("usr_001");
  const myListings = getListings().filter((l) => l.sellerId === "usr_001");
  const myBetaTests = getBetaTests().filter((bt) => bt.creatorId === "usr_001");

  if (!currentUser) return null;

  // Activity derived from real data
  const recentActivity = [
    {
      text: `New feedback received on ${myBetaTests[0]?.title ?? "beta test"}`,
      time: "2 hours ago",
      dot: "bg-green-500",
    },
    {
      text: `${myListings[0]?.title ?? "Listing"} viewed 45 times today`,
      time: "1 day ago",
      dot: "bg-indigo-500",
    },
    {
      text: `${myBetaTests[1]?.title ?? "Beta test"} is almost full (${myBetaTests[1]?.spots.filled ?? 0}/${myBetaTests[1]?.spots.total ?? 0} spots)`,
      time: "3 days ago",
      dot: "bg-amber-500",
    },
    {
      text: `${myListings[1]?.title ?? "Listing"} price updated`,
      time: "5 days ago",
      dot: "bg-zinc-500",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-start justify-between mb-8">
        <PageHeader title="Dashboard" description={`Welcome back, ${currentUser.displayName}`} />
        <Link href="/create">
          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-500 shrink-0">
            <PlusCircle className="mr-1.5 h-4 w-4" />
            New Listing
          </Button>
        </Link>
      </div>

      {/* Tabs */}
      <div className="mb-8 flex gap-1 rounded-lg bg-zinc-900 p-1 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === tab ? "bg-zinc-800 text-zinc-50" : "text-zinc-400 hover:text-zinc-50"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Overview" && (
        <div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
            <StatCard
              label="Total Earnings"
              value={formatPrice(currentUser.stats.totalEarnings)}
              icon={<DollarSign className="h-4 w-4" />}
            />
            <StatCard
              label="Active Listings"
              value={String(myListings.filter((l) => l.status === "active").length)}
              icon={<Package className="h-4 w-4" />}
            />
            <StatCard
              label="Beta Tests"
              value={String(myBetaTests.length)}
              icon={<TestTube className="h-4 w-4" />}
            />
            <StatCard
              label="Feedback Given"
              value={String(currentUser.stats.feedbackGiven)}
              icon={<MessageSquare className="h-4 w-4" />}
            />
          </div>

          <h3 className="text-lg font-semibold text-zinc-50 mb-4">Recent Activity</h3>
          <div className="space-y-2">
            {recentActivity.map((activity, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3"
              >
                <span className={`h-2 w-2 shrink-0 rounded-full ${activity.dot}`} />
                <span className="flex-1 text-sm text-zinc-300">{activity.text}</span>
                <span className="text-xs text-zinc-500 whitespace-nowrap">{activity.time}</span>
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
              <Link href="/create" className="mt-4">
                <Button size="sm" className="bg-indigo-600 hover:bg-indigo-500">Create listing</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {myListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "Beta Tests" && (
        <div>
          <h3 className="text-lg font-semibold text-zinc-50 mb-4">My Beta Tests</h3>
          {myBetaTests.length === 0 ? (
            <p className="text-center text-zinc-500 py-12">No beta tests yet.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {myBetaTests.map((bt) => (
                <BetaCard key={bt.id} betaTest={bt} />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "Earnings" && (
        <div>
          <div className="grid grid-cols-3 gap-4 mb-8">
            <StatCard label="Total Earned" value={formatPrice(currentUser.stats.totalEarnings)} />
            <StatCard label="Total Sales" value={String(currentUser.stats.totalSales)} />
            <StatCard
              label="Avg Sale Price"
              value={
                currentUser.stats.totalSales > 0
                  ? formatPrice(currentUser.stats.totalEarnings / currentUser.stats.totalSales)
                  : "$0"
              }
            />
          </div>

          {/* Chart */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-zinc-50">Monthly Earnings</h3>
              <span className="text-xs text-zinc-500">Last 12 months</span>
            </div>
            <div className="flex items-end gap-1.5 h-44">
              {MONTHLY_DATA.map((d, i) => (
                <div
                  key={i}
                  className="relative flex-1 flex flex-col items-center gap-1.5"
                  onMouseEnter={() => setHoveredBar(i)}
                  onMouseLeave={() => setHoveredBar(null)}
                >
                  {/* Tooltip */}
                  {hoveredBar === i && (
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-zinc-700 px-2 py-0.5 text-[10px] text-zinc-100 shadow z-10">
                      {d.label}
                    </div>
                  )}
                  <div
                    className={`w-full rounded-t transition-colors ${
                      hoveredBar === i ? "bg-indigo-400" : i === MONTHLY_DATA.length - 1 ? "bg-indigo-500" : "bg-indigo-800 hover:bg-indigo-600"
                    }`}
                    style={{ height: `${(d.value / 100) * 100}%` }}
                  />
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

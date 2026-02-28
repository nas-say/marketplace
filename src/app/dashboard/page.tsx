"use client";

import { useState } from "react";
import { getListings, getBetaTests, formatPrice, getUserById } from "@/lib/data";
import { StatCard } from "@/components/shared/stat-card";
import { PageHeader } from "@/components/shared/page-header";
import { ListingCard } from "@/components/listing/listing-card";
import { BetaCard } from "@/components/beta/beta-card";
import { DollarSign, Package, TestTube, MessageSquare } from "lucide-react";

const tabs = ["Overview", "My Listings", "Beta Tests", "Earnings"];

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("Overview");

  // Mock: pretend user is usr_001
  const currentUser = getUserById("usr_001");
  const myListings = getListings().filter((l) => l.sellerId === "usr_001");
  const myBetaTests = getBetaTests().filter((bt) => bt.creatorId === "usr_001");

  if (!currentUser) return null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader title="Dashboard" description={`Welcome back, ${currentUser.displayName}`} />

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
            <StatCard label="Total Earnings" value={formatPrice(currentUser.stats.totalEarnings)} icon={<DollarSign className="h-4 w-4" />} />
            <StatCard label="Active Listings" value={String(myListings.length)} icon={<Package className="h-4 w-4" />} />
            <StatCard label="Beta Tests" value={String(myBetaTests.length)} icon={<TestTube className="h-4 w-4" />} />
            <StatCard label="Feedback Given" value={String(currentUser.stats.feedbackGiven)} icon={<MessageSquare className="h-4 w-4" />} />
          </div>

          <h3 className="text-lg font-semibold text-zinc-50 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {[
              { text: "New feedback received on FlowBoard beta test", time: "2 hours ago" },
              { text: "Analytics Dashboard SaaS listing viewed 45 times", time: "1 day ago" },
              { text: "PingDash beta test published", time: "3 days ago" },
              { text: "RankCheck listing price updated", time: "5 days ago" },
            ].map((activity, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 p-3">
                <span className="text-sm text-zinc-300">{activity.text}</span>
                <span className="text-xs text-zinc-500 whitespace-nowrap ml-4">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "My Listings" && (
        <div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {myListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
          {myListings.length === 0 && (
            <p className="text-center text-zinc-500 py-12">You haven&apos;t listed any projects yet.</p>
          )}
        </div>
      )}

      {activeTab === "Beta Tests" && (
        <div>
          <h3 className="text-lg font-semibold text-zinc-50 mb-4">My Beta Tests</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {myBetaTests.map((bt) => (
              <BetaCard key={bt.id} betaTest={bt} />
            ))}
          </div>
          {myBetaTests.length === 0 && (
            <p className="text-center text-zinc-500 py-12">No beta tests yet.</p>
          )}
        </div>
      )}

      {activeTab === "Earnings" && (
        <div>
          <div className="grid grid-cols-3 gap-4 mb-8">
            <StatCard label="Total Earned" value={formatPrice(currentUser.stats.totalEarnings)} />
            <StatCard label="Total Sales" value={String(currentUser.stats.totalSales)} />
            <StatCard label="Avg Sale Price" value={currentUser.stats.totalSales > 0 ? formatPrice(currentUser.stats.totalEarnings / currentUser.stats.totalSales) : "$0"} />
          </div>

          {/* Placeholder earnings chart */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
            <h3 className="text-lg font-semibold text-zinc-50 mb-4">Monthly Earnings</h3>
            <div className="flex items-end gap-2 h-40">
              {[40, 65, 45, 80, 55, 90, 70, 95, 60, 85, 75, 100].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full rounded-t bg-indigo-600" style={{ height: `${h}%` }} />
                  <span className="text-[10px] text-zinc-500">{["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"][i]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

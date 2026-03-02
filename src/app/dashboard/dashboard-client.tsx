"use client";

import { useState } from "react";
import { Listing } from "@/types/listing";
import { BetaTest } from "@/types/beta-test";
import { StatCard } from "@/components/shared/stat-card";
import { PageHeader } from "@/components/shared/page-header";
import { BetaCard } from "@/components/beta/beta-card";
import { DollarSign, Package, TestTube, MessageSquare, PlusCircle, Pencil, Trash2, CheckCheck, Eye, ShieldCheck, Lock, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/data";
import { deleteDraftBetaTestAction, deleteListingAction, markSoldAction } from "./actions";

const MONTHLY_DATA = [
  { month: "Mar", value: 22, label: "$22K" }, { month: "Apr", value: 35, label: "$35K" },
  { month: "May", value: 28, label: "$28K" }, { month: "Jun", value: 52, label: "$52K" },
  { month: "Jul", value: 41, label: "$41K" }, { month: "Aug", value: 68, label: "$68K" },
  { month: "Sep", value: 58, label: "$58K" }, { month: "Oct", value: 74, label: "$74K" },
  { month: "Nov", value: 45, label: "$45K" }, { month: "Dec", value: 80, label: "$80K" },
  { month: "Jan", value: 65, label: "$65K" }, { month: "Feb", value: 100, label: "$100K" },
];

const tabs = ["Overview", "My Listings", "Beta Tests", "Earnings", "As Buyer"];

interface ApplicationRow {
  betaTestId: string;
  status: string;
  createdAt: string;
  betaTest: { id: string; title: string; status: string } | null;
}

interface Props {
  displayName: string;
  isAdmin: boolean;
  stats: { totalEarnings: string; activeListings: number; betaTests: number; feedbackGiven: number };
  listings: Listing[];
  betaTests: BetaTest[];
  unlockedListings: Listing[];
  myApplications: ApplicationRow[];
}

export function DashboardClient({
  displayName,
  isAdmin,
  stats,
  listings,
  betaTests,
  unlockedListings,
  myApplications,
}: Props) {
  const [activeTab, setActiveTab] = useState("Overview");
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  const [myListings, setMyListings] = useState(listings);
  const [myBetaTests, setMyBetaTests] = useState(betaTests);
  const [deletingDraftId, setDeletingDraftId] = useState<string | null>(null);

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

  const handleDeleteDraftBetaTest = async (betaTestId: string) => {
    if (!window.confirm("Delete this draft beta test? This cannot be undone.")) return;
    setDeletingDraftId(betaTestId);
    const result = await deleteDraftBetaTestAction(betaTestId);
    setDeletingDraftId(null);

    if (result.error) {
      window.alert(result.error);
      return;
    }

    setMyBetaTests((prev) => prev.filter((bt) => bt.id !== betaTestId));
  };

  const recentActivity = [
    listings[0]
      ? {
          text: `Listing "${listings[0].title}" is ${listings[0].status}`,
          time: new Date(listings[0].createdAt).toLocaleDateString(),
          dot: "bg-indigo-500",
        }
      : { text: "List your first project to start selling", time: "", dot: "bg-zinc-700" },
    myBetaTests[0]
      ? {
          text: `Beta test "${myBetaTests[0].title}" — ${myBetaTests[0].spots.total - myBetaTests[0].spots.filled} spots remaining`,
          time: new Date(myBetaTests[0].createdAt).toLocaleDateString(),
          dot: "bg-green-500",
        }
      : { text: "Create a beta test to recruit testers", time: "", dot: "bg-zinc-700" },
    listings[1]
      ? {
          text: `Listing "${listings[1].title}" — ${listings[1].status}`,
          time: new Date(listings[1].createdAt).toLocaleDateString(),
          dot: "bg-indigo-500",
        }
      : { text: "Add more listings to reach more buyers", time: "", dot: "bg-zinc-700" },
    myBetaTests[1]
      ? {
          text: `Beta test "${myBetaTests[1].title}" — ${myBetaTests[1].spots.filled} of ${myBetaTests[1].spots.total} spots filled`,
          time: new Date(myBetaTests[1].createdAt).toLocaleDateString(),
          dot: "bg-amber-500",
        }
      : { text: "Multiple beta tests help you test faster", time: "", dot: "bg-zinc-700" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-start justify-between mb-8">
        <PageHeader title="Dashboard" description={`Welcome back, ${displayName}`} />
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Link href="/admin">
              <Button size="sm" variant="outline" className="border-amber-500/40 text-amber-300 hover:text-amber-200">
                Admin
              </Button>
            </Link>
          )}
          <Link href="/create">
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-500 shrink-0">
              <PlusCircle className="mr-1.5 h-4 w-4" />New Listing
            </Button>
          </Link>
        </div>
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
            <StatCard label="Beta Tests" value={String(myBetaTests.length)} icon={<TestTube className="h-4 w-4" />} />
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
          {myBetaTests.length === 0 ? (
            <p className="text-center text-zinc-500 py-12">No beta tests yet.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {myBetaTests.map((bt) => (
                <div key={bt.id} className="relative">
                  <BetaCard betaTest={bt} />
                  {bt.status === "draft" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute right-3 top-3 z-20 border-red-500/40 bg-zinc-950/80 text-red-300 hover:bg-red-500/10 hover:text-red-200"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        void handleDeleteDraftBetaTest(bt.id);
                      }}
                      disabled={deletingDraftId === bt.id}
                    >
                      {deletingDraftId === bt.id ? (
                        <>
                          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                          Delete Draft
                        </>
                      )}
                    </Button>
                  )}
                </div>
              ))}
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

      {activeTab === "As Buyer" && (
        <div className="space-y-8">
          <div>
            <h3 className="text-lg font-semibold text-zinc-50 mb-4">Unlocked Listings</h3>
            {unlockedListings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center rounded-lg border border-zinc-800 bg-zinc-900">
                <Lock className="h-8 w-8 text-zinc-700 mb-3" />
                <p className="font-medium text-zinc-400">No listings unlocked yet</p>
                <p className="mt-1 text-sm text-zinc-600">Unlock a listing to see the seller&apos;s contact info.</p>
                <Link href="/browse" className="mt-4">
                  <Button size="sm" className="bg-indigo-600 hover:bg-indigo-500">Browse listings</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {unlockedListings.map((listing) => (
                  <div key={listing.id} className="flex items-center gap-4 rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-zinc-200 truncate">{listing.title}</p>
                      <span className="text-sm text-zinc-400">{formatPrice(listing.askingPrice)}</span>
                    </div>
                    <Link href={`/listing/${listing.id}`}>
                      <Button size="sm" variant="outline" className="border-zinc-700 text-zinc-400 hover:text-zinc-50 px-2">
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-lg font-semibold text-zinc-50 mb-4">My Beta Applications</h3>
            {myApplications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center rounded-lg border border-zinc-800 bg-zinc-900">
                <TestTube className="h-8 w-8 text-zinc-700 mb-3" />
                <p className="font-medium text-zinc-400">No applications yet</p>
                <p className="mt-1 text-sm text-zinc-600">Apply to beta tests to earn rewards.</p>
                <Link href="/beta" className="mt-4">
                  <Button size="sm" className="bg-indigo-600 hover:bg-indigo-500">Browse beta tests</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {myApplications.map((application) => (
                  <div key={application.betaTestId} className="flex items-center gap-4 rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-zinc-200 truncate">
                        {application.betaTest?.title ?? application.betaTestId}
                      </p>
                      <Badge className={
                        application.status === "accepted"
                          ? "bg-green-500/10 text-green-400 border-green-500/20"
                          : application.status === "rejected"
                            ? "bg-red-500/10 text-red-400 border-red-500/20"
                            : "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                      }>
                        {application.status}
                      </Badge>
                    </div>
                    {application.betaTest && (
                      <Link href={`/beta/${application.betaTestId}`}>
                        <Button size="sm" variant="outline" className="border-zinc-700 text-zinc-400 hover:text-zinc-50 px-2">
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

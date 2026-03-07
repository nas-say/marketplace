"use client";

import { useState, useCallback } from "react";
import { Listing } from "@/types/listing";
import { BetaTest } from "@/types/beta-test";
import { StatCard } from "@/components/shared/stat-card";
import { PageHeader } from "@/components/shared/page-header";
import { BetaCard } from "@/components/beta/beta-card";
import {
  DollarSign,
  Package,
  TestTube,
  MessageSquare,
  PlusCircle,
  Pencil,
  Trash2,
  CheckCheck,
  Eye,
  ShieldCheck,
  Lock,
  Loader2,
  CalendarDays,
  ArrowUpRight,
  Unlock,
  Handshake,
  RotateCcw,
  Star,
  Zap,
  Bell,
  X,
  Check,
  CircleX,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/formatting";
import { getTesterScore, getListingCompleteness } from "@/lib/scoring";
import { SavedSearch } from "@/lib/db/saved-searches";
import { OfferWithListing } from "@/lib/db/offers";
import {
  deleteDraftBetaTestAction,
  deleteListingAction,
  markSoldAction,
  markUnderOfferAction,
  markActiveAction,
  boostListingAction,
  deleteSavedSearchAction,
  respondToOfferAction,
  refreshListingAction,
} from "./actions";

const MONTHLY_DATA = [
  { month: "Mar", value: 22, label: "$22K" }, { month: "Apr", value: 35, label: "$35K" },
  { month: "May", value: 28, label: "$28K" }, { month: "Jun", value: 52, label: "$52K" },
  { month: "Jul", value: 41, label: "$41K" }, { month: "Aug", value: 68, label: "$68K" },
  { month: "Sep", value: 58, label: "$58K" }, { month: "Oct", value: 74, label: "$74K" },
  { month: "Nov", value: 45, label: "$45K" }, { month: "Dec", value: 80, label: "$80K" },
  { month: "Jan", value: 65, label: "$65K" }, { month: "Feb", value: 100, label: "$100K" },
];

const tabs = ["Overview", "My Listings", "Beta Tests", "Earnings", "As Buyer"];
const CATEGORY_LABELS: Record<Listing["category"], string> = {
  saas: "SaaS",
  "mobile-app": "Mobile App",
  "chrome-extension": "Chrome Extension",
  domain: "Domain",
  "open-source": "Open Source",
  "bot-automation": "Automation",
  api: "API",
  "template-theme": "Template",
};

interface ApplicationRow {
  betaTestId: string;
  status: string;
  createdAt: string;
  betaTest: { id: string; title: string; status: string } | null;
}

interface Props {
  displayName: string;
  isAdmin: boolean;
  stats: { totalEarnings: string; activeListings: number; betaTests: number; feedbackGiven: number; betaTestsCompleted: number };
  listings: Listing[];
  betaTests: BetaTest[];
  unlockedListings: Listing[];
  myApplications: ApplicationRow[];
  listingAnalytics: Record<string, { views: number; unlocks: number }>;
  connectsBalance: number;
  savedSearches: SavedSearch[];
  receivedOffers: OfferWithListing[];
  myOffers: OfferWithListing[];
}

export function DashboardClient({
  displayName,
  isAdmin,
  stats,
  listings,
  betaTests,
  unlockedListings,
  myApplications,
  listingAnalytics,
  connectsBalance,
  savedSearches,
  receivedOffers,
  myOffers,
}: Props) {
  const [activeTab, setActiveTab] = useState("Overview");
  const [betaSubTab, setBetaSubTab] = useState<"posted" | "applied">("posted");
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  const [myListings, setMyListings] = useState(listings);
  const [myBetaTests, setMyBetaTests] = useState(betaTests);
  const [deletingDraftId, setDeletingDraftId] = useState<string | null>(null);
  const [boostingListingId, setBoostingListingId] = useState<string | null>(null);
  const [mySavedSearches, setMySavedSearches] = useState(savedSearches);
  const [balance, setBalance] = useState(connectsBalance);
  const [myReceivedOffers, setMyReceivedOffers] = useState(receivedOffers);
  const mySubmittedOffers = myOffers;

  const testerScore = getTesterScore({ betaTestsCompleted: stats.betaTestsCompleted, feedbackGiven: stats.feedbackGiven });

  const [onboardingDismissed, setOnboardingDismissed] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("sideflip:onboarding-dismissed") === "1";
  });
  const dismissOnboarding = () => {
    localStorage.setItem("sideflip:onboarding-dismissed", "1");
    setOnboardingDismissed(true);
  };
  const showOnboarding = !onboardingDismissed && listings.length === 0 && betaTests.length === 0;

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

  const handleMarkUnderOffer = async (listingId: string) => {
    if (!window.confirm("Mark this listing as under offer?")) return;
    const result = await markUnderOfferAction(listingId);
    if (!result.error) setMyListings((prev) => prev.map((l) => l.id === listingId ? { ...l, status: "under_offer" as const } : l));
  };

  const handleMarkActive = async (listingId: string) => {
    if (!window.confirm("Mark this listing as active again?")) return;
    const result = await markActiveAction(listingId);
    if (!result.error) setMyListings((prev) => prev.map((l) => l.id === listingId ? { ...l, status: "active" as const } : l));
  };

  const handleKeepActive = async (listingId: string) => {
    await refreshListingAction(listingId);
    setMyListings((prev) => prev.map((l) => l.id === listingId ? { ...l, updatedAt: new Date().toISOString() } : l));
  };

  const handleBoost = useCallback(async (listingId: string, durationDays: 7 | 14 | 30) => {
    setBoostingListingId(listingId);
    const result = await boostListingAction(listingId, durationDays);
    setBoostingListingId(null);
    if (result.error) { window.alert(result.error); return; }
    const featuredUntil = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();
    setMyListings((prev) => prev.map((l) => l.id === listingId ? { ...l, featured: true, featuredUntil } : l));
    const COSTS: Record<number, number> = { 7: 5, 14: 8, 30: 15 };
    setBalance((b) => b - (COSTS[durationDays] ?? 0));
  }, []);

  const handleDeleteSavedSearch = async (id: string) => {
    const result = await deleteSavedSearchAction(id);
    if (!result.error) setMySavedSearches((prev) => prev.filter((s) => s.id !== id));
  };

  const handleRespondToOffer = async (offerId: string, status: "accepted" | "rejected") => {
    const result = await respondToOfferAction(offerId, status);
    if (result.error) { window.alert(result.error); return; }
    setMyReceivedOffers((prev) =>
      prev.map((o) => (o.id === offerId ? { ...o, status } : o))
    );
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
          {showOnboarding && (
            <div className="mb-8 rounded-lg border border-indigo-500/30 bg-indigo-500/5 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-zinc-50">Welcome to SideFlip! 🚀</p>
                  <p className="mt-0.5 text-sm text-zinc-400">Get started in 3 steps to reach buyers.</p>
                </div>
                <button onClick={dismissOnboarding} className="text-zinc-600 hover:text-zinc-400 mt-0.5">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {[
                  { step: "1", label: "Create a listing", desc: "List your side project with metrics and assets.", href: "/create", cta: "Create listing" },
                  { step: "2", label: "Verify ownership", desc: "Verified listings get 3× more unlocks from buyers.", href: null, cta: null },
                  { step: "3", label: "Boost your listing", desc: "Use Connects to feature your listing at the top of browse.", href: "/connects", cta: "Get Connects" },
                ].map((s) => (
                  <div key={s.step} className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">{s.step}</span>
                    <p className="mt-2 font-medium text-zinc-200 text-sm">{s.label}</p>
                    <p className="mt-0.5 text-xs text-zinc-500">{s.desc}</p>
                    {s.href && (
                      <Link href={s.href} className="mt-2 inline-block text-xs text-indigo-400 hover:text-indigo-300">{s.cta} →</Link>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-5 mb-8">
            <StatCard label="Total Earnings" value={stats.totalEarnings} icon={<DollarSign className="h-4 w-4" />} />
            <StatCard
              label="Active Listings"
              value={String(stats.activeListings)}
              secondaryValue={`${unlockedListings.length} unlocked`}
              icon={<Package className="h-4 w-4" />}
            />
            <StatCard label="Beta Tests" value={String(myBetaTests.length)} icon={<TestTube className="h-4 w-4" />} />
            <StatCard label="Feedback Given" value={String(stats.feedbackGiven)} icon={<MessageSquare className="h-4 w-4" />} />
            <StatCard
              label="Tester Score"
              value={testerScore.tier !== "none" ? `${testerScore.score}/100` : "—"}
              secondaryValue={testerScore.tier !== "none" ? testerScore.label : undefined}
              icon={<Star className="h-4 w-4" />}
            />
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
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-sm text-zinc-400">{formatPrice(listing.askingPrice)}</span>
                      <Badge className={
                        listing.status === "active"
                          ? "bg-green-500/10 text-green-400 border-green-500/20"
                          : listing.status === "sold"
                            ? "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                            : listing.status === "under_offer"
                              ? "bg-violet-500/10 text-violet-300 border-violet-500/20"
                              : listing.status === "pending_verification"
                                ? "bg-indigo-500/10 text-indigo-300 border-indigo-500/20"
                                : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      }>
                        {listing.status === "pending_verification" ? "pending verification"
                          : listing.status === "under_offer" ? "under offer"
                          : listing.status}
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
                    {(listingAnalytics[listing.id]?.views > 0 || listingAnalytics[listing.id]?.unlocks > 0) && (
                      <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />{listingAnalytics[listing.id]?.views ?? 0} views
                        </span>
                        <span className="flex items-center gap-1">
                          <Unlock className="h-3 w-3" />{listingAnalytics[listing.id]?.unlocks ?? 0} unlocks
                        </span>
                      </div>
                    )}
                    {(() => {
                      const { score } = getListingCompleteness(listing);
                      const color = score >= 80 ? "text-green-400" : score >= 50 ? "text-amber-400" : "text-red-400";
                      return <span className={`text-xs ${color} mt-0.5 block`}>{score}% complete</span>;
                    })()}
                    {listing.featured && listing.featuredUntil && (
                      <span className="text-xs text-amber-400 mt-0.5 block">
                        Featured until {new Date(listing.featuredUntil).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    )}
                    {listing.status === "active" && (() => {
                      const days = Math.floor((Date.now() - new Date(listing.updatedAt).getTime()) / 86400000);
                      if (days < 30) return null;
                      return (
                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-xs text-amber-400">⚠ Not updated in {days}d</span>
                          <button
                            onClick={() => handleKeepActive(listing.id)}
                            className="text-[10px] font-medium text-indigo-400 hover:text-indigo-300 underline underline-offset-2"
                          >
                            Keep active
                          </button>
                        </div>
                      );
                    })()}
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
                      <>
                        <Button size="sm" variant="outline" className="border-zinc-700 text-violet-400 hover:text-violet-300 px-2" title="Mark as under offer" onClick={() => handleMarkUnderOffer(listing.id)}>
                          <Handshake className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="outline" className="border-zinc-700 text-amber-400 hover:text-amber-300 px-2" title="Mark as sold" onClick={() => handleMarkSold(listing.id)}>
                          <CheckCheck className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                    {listing.status === "under_offer" && (
                      <Button size="sm" variant="outline" className="border-zinc-700 text-green-400 hover:text-green-300 px-2" title="Re-activate listing" onClick={() => handleMarkActive(listing.id)}>
                        <RotateCcw className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {!listing.featured && listing.status === "active" && (
                      boostingListingId === listing.id ? (
                        <div className="flex items-center gap-1">
                          {([7, 14, 30] as const).map((d) => {
                            const costs: Record<number, number> = { 7: 5, 14: 8, 30: 15 };
                            return (
                              <button
                                key={d}
                                onClick={() => handleBoost(listing.id, d)}
                                disabled={balance < costs[d]}
                                className="rounded border border-amber-500/40 bg-amber-500/10 px-2 py-1 text-[10px] font-medium text-amber-300 hover:bg-amber-500/20 disabled:opacity-40"
                                title={`${d}d — ${costs[d]} connects`}
                              >
                                {d}d·{costs[d]}c
                              </button>
                            );
                          })}
                          <button onClick={() => setBoostingListingId(null)} className="text-zinc-500 hover:text-zinc-300 px-1">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-amber-500/30 text-amber-400 hover:text-amber-300 px-2"
                          title={`Boost listing (${balance} connects available)`}
                          onClick={() => setBoostingListingId(listing.id)}
                        >
                          <Zap className="h-3.5 w-3.5" />
                        </Button>
                      )
                    )}
                    <Button size="sm" variant="outline" className="border-zinc-700 text-red-400 hover:text-red-300 px-2" onClick={() => handleDelete(listing.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {myReceivedOffers.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-zinc-50 mb-4">Received Offers</h3>
              <div className="space-y-2">
                {myReceivedOffers.map((offer) => (
                  <div key={offer.id} className="flex items-center gap-4 rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-zinc-200">
                          {offer.amountCents != null ? formatPrice(offer.amountCents) : "Proposal (no price)"}
                        </span>
                        <Badge className={
                          offer.status === "accepted"
                            ? "bg-green-500/10 text-green-400 border-green-500/20"
                            : offer.status === "rejected"
                              ? "bg-red-500/10 text-red-400 border-red-500/20"
                              : "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                        }>
                          {offer.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-zinc-500 mt-0.5 truncate">
                        {offer.listingTitle} · {new Date(offer.createdAt).toLocaleDateString()}
                      </p>
                      {offer.message && (
                        <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{offer.message}</p>
                      )}
                    </div>
                    {offer.status === "pending" && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleRespondToOffer(offer.id, "accepted")}
                          className="rounded-md border border-green-500/40 bg-green-500/10 p-1.5 text-green-400 hover:bg-green-500/20"
                          title="Accept offer"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleRespondToOffer(offer.id, "rejected")}
                          className="rounded-md border border-red-500/40 bg-red-500/10 p-1.5 text-red-400 hover:bg-red-500/20"
                          title="Reject offer"
                        >
                          <CircleX className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "Beta Tests" && (
        <div>
          <h3 className="mb-4 text-lg font-semibold text-zinc-50">Beta Tests</h3>

          <div className="mb-5 inline-flex gap-1 rounded-lg bg-zinc-900 p-1">
            <button
              onClick={() => setBetaSubTab("posted")}
              className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                betaSubTab === "posted"
                  ? "bg-zinc-800 text-zinc-50"
                  : "text-zinc-400 hover:text-zinc-50"
              }`}
            >
              Posted ({myBetaTests.length})
            </button>
            <button
              onClick={() => setBetaSubTab("applied")}
              className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                betaSubTab === "applied"
                  ? "bg-zinc-800 text-zinc-50"
                  : "text-zinc-400 hover:text-zinc-50"
              }`}
            >
              Applied ({myApplications.length})
            </button>
          </div>

          {betaSubTab === "posted" && myBetaTests.length === 0 ? (
            <p className="py-12 text-center text-zinc-500">No beta tests posted yet.</p>
          ) : betaSubTab === "posted" ? (
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
          ) : myApplications.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 py-12 text-center">
              <TestTube className="mb-3 h-8 w-8 text-zinc-700" />
              <p className="font-medium text-zinc-400">No applications yet</p>
              <p className="mt-1 text-sm text-zinc-600">Apply to beta tests to earn rewards.</p>
              <Link href="/beta" className="mt-4">
                <Button size="sm" className="bg-indigo-600 hover:bg-indigo-500">Browse beta tests</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {myApplications.map((application) => (
                <Link
                  key={application.betaTestId}
                  href={`/beta/${application.betaTestId}`}
                  className="group block rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 transition-colors hover:border-indigo-500/40 hover:bg-zinc-900/90"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-zinc-200">{application.betaTest?.title ?? application.betaTestId}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <Badge
                          className={
                            application.status === "accepted"
                              ? "bg-green-500/10 border-green-500/20 text-green-400"
                              : application.status === "rejected"
                                ? "bg-red-500/10 border-red-500/20 text-red-400"
                                : "bg-zinc-500/10 border-zinc-500/20 text-zinc-400"
                          }
                        >
                          Application: {application.status}
                        </Badge>
                        {application.betaTest && (
                          <Badge
                            className={
                              application.betaTest.status === "accepting"
                                ? "bg-green-500/10 border-green-500/20 text-green-400"
                                : application.betaTest.status === "almost_full"
                                  ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                                  : application.betaTest.status === "closed"
                                    ? "bg-zinc-500/10 border-zinc-500/20 text-zinc-400"
                                    : "bg-violet-500/10 border-violet-500/20 text-violet-300"
                            }
                          >
                            Beta: {application.betaTest.status}
                          </Badge>
                        )}
                      </div>
                      <p className="mt-2 flex items-center gap-1.5 text-xs text-zinc-500">
                        <CalendarDays className="h-3.5 w-3.5" />
                        Applied on{" "}
                        {new Date(application.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <span className="mt-1 flex items-center gap-1 text-xs text-indigo-300/90 transition-transform group-hover:translate-x-0.5">
                      Open
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </Link>
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
          {mySubmittedOffers.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-zinc-50 mb-4">My Offers</h3>
              <div className="space-y-2">
                {mySubmittedOffers.map((offer) => (
                  <Link
                    key={offer.id}
                    href={`/listing/${offer.listingId}`}
                    className="group flex items-center gap-4 rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 transition-colors hover:border-indigo-500/40"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-zinc-200">
                          {offer.amountCents != null ? formatPrice(offer.amountCents) : "Proposal (no price)"}
                        </span>
                        <Badge className={
                          offer.status === "accepted"
                            ? "bg-green-500/10 text-green-400 border-green-500/20"
                            : offer.status === "rejected"
                              ? "bg-red-500/10 text-red-400 border-red-500/20"
                              : "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                        }>
                          {offer.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-zinc-500 mt-0.5 truncate">
                        {offer.listingTitle} · {new Date(offer.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <ArrowUpRight className="h-3.5 w-3.5 text-zinc-500 group-hover:text-indigo-300 shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          )}
          <div>
            <h3 className="text-lg font-semibold text-zinc-50 mb-4">Saved Alerts</h3>
            {mySavedSearches.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center rounded-lg border border-zinc-800 bg-zinc-900">
                <Bell className="h-8 w-8 text-zinc-700 mb-3" />
                <p className="font-medium text-zinc-400">No saved alerts</p>
                <p className="mt-1 text-sm text-zinc-600">Browse listings and click the bell icon to create one.</p>
                <Link href="/browse" className="mt-4">
                  <Button size="sm" className="bg-indigo-600 hover:bg-indigo-500">Browse listings</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {mySavedSearches.map((s) => (
                  <div key={s.id} className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3">
                    <span className="text-sm text-zinc-300">
                      {s.category ? CATEGORY_LABELS[s.category as Listing["category"]] ?? s.category : "Any category"}
                      {s.maxPriceCents ? ` · Under $${(s.maxPriceCents / 100).toLocaleString()}` : ""}
                    </span>
                    <button onClick={() => handleDeleteSavedSearch(s.id)} className="text-zinc-600 hover:text-red-400 ml-4">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
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
                  <Link
                    key={listing.id}
                    href={`/listing/${listing.id}`}
                    className="group block rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 transition-colors hover:border-indigo-500/40 hover:bg-zinc-900/90"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-zinc-200">{listing.title}</p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                          <Badge className="bg-zinc-500/10 border-zinc-500/20 text-zinc-300">
                            {CATEGORY_LABELS[listing.category]}
                          </Badge>
                          <Badge
                            className={
                              listing.status === "active"
                                ? "bg-green-500/10 border-green-500/20 text-green-400"
                                : listing.status === "sold"
                                  ? "bg-zinc-500/10 border-zinc-500/20 text-zinc-400"
                                  : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                            }
                          >
                            {listing.status}
                          </Badge>
                          {listing.ownershipVerified && (
                            <Badge className="bg-emerald-500/10 border-emerald-500/20 text-emerald-300">
                              verified
                            </Badge>
                          )}
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-400">
                          <span>{formatPrice(listing.askingPrice)}</span>
                          <span>MRR {formatPrice(listing.metrics.mrr)}</span>
                          <span className="text-zinc-500">
                            Updated{" "}
                            {new Date(listing.updatedAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      </div>
                      <span className="mt-1 flex items-center gap-1 text-xs text-indigo-300/90 transition-transform group-hover:translate-x-0.5">
                        Open
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

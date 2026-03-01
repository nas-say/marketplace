"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Minus, Lock, Zap, Loader2 } from "lucide-react";
import Link from "next/link";
import { unlockListingAction } from "@/app/connects/actions";
import { toast } from "sonner";

interface PurchaseCardProps {
  askingPrice: string;
  openToOffers: boolean;
  age: string;
  revenueTrend: "up" | "flat" | "down";
  revenueMultiple?: string;
  mrr?: string;
  listingId: string;
  isUnlocked: boolean;
  userId: string | null;
  connectsBalance: number;
  unlockCost: number;
}

export function PurchaseCard({
  askingPrice,
  openToOffers,
  age,
  revenueTrend,
  revenueMultiple,
  mrr,
  listingId,
  isUnlocked,
  userId,
  connectsBalance,
  unlockCost,
}: PurchaseCardProps) {
  const router = useRouter();
  const [unlocking, setUnlocking] = useState(false);
  const [unlockError, setUnlockError] = useState("");

  const TrendIcon =
    revenueTrend === "up" ? TrendingUp : revenueTrend === "down" ? TrendingDown : Minus;
  const trendColor =
    revenueTrend === "up" ? "text-green-400" : revenueTrend === "down" ? "text-red-400" : "text-zinc-400";
  const trendLabel =
    revenueTrend === "up" ? "Growing" : revenueTrend === "down" ? "Declining" : "Stable";

  const handleUnlock = async () => {
    setUnlocking(true);
    setUnlockError("");
    const result = await unlockListingAction(listingId);
    if (result.error) {
      setUnlockError(result.error);
      setUnlocking(false);
      return;
    }
    toast.success("Listing unlocked! Seller contact info is now visible.");
    router.refresh();
  };

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
      <p className="text-3xl font-bold text-violet-400">{askingPrice}</p>
      {openToOffers && <p className="mt-1 text-sm text-zinc-500">Open to offers</p>}

      {isUnlocked ? (
        <div className="mt-4 rounded-lg border border-green-500/20 bg-green-500/5 p-4">
          <p className="mb-1 text-sm font-semibold text-green-400">Seller info unlocked</p>
          <p className="text-xs text-zinc-400">
            Check the seller section below for contact details. Reach out directly to discuss the acquisition.
          </p>
        </div>
      ) : (
        <div className="mt-4 rounded-lg border border-zinc-700 bg-zinc-800/50 p-4 text-center">
          <Lock className="h-5 w-5 text-zinc-500 mx-auto mb-2" />
          <p className="text-sm font-medium text-zinc-300 mb-1">Unlock to connect with seller</p>
          <p className="text-xs text-zinc-500 mb-3">Costs {unlockCost} connects — one-time per listing</p>
          {!userId ? (
            <Link href="/sign-in">
              <Button size="sm" className="w-full bg-indigo-600 hover:bg-indigo-500">
                Sign in to unlock
              </Button>
            </Link>
          ) : connectsBalance >= unlockCost ? (
            <>
              <Button
                size="sm"
                className="w-full bg-indigo-600 hover:bg-indigo-500"
                onClick={handleUnlock}
                disabled={unlocking}
              >
                {unlocking
                  ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Unlocking...</>
                  : <><Zap className="mr-1.5 h-3.5 w-3.5" />Unlock — {unlockCost} connects</>}
              </Button>
              {unlockError && <p className="mt-2 text-xs text-red-400">{unlockError}</p>}
            </>
          ) : (
            <Link href="/connects">
              <Button size="sm" variant="outline" className="w-full border-zinc-600 text-zinc-300 hover:bg-zinc-700">
                <Zap className="mr-1.5 h-3.5 w-3.5 text-indigo-400" />
                Get connects
              </Button>
            </Link>
          )}
        </div>
      )}

      <div className="mt-6 space-y-3 border-t border-zinc-800 pt-4">
        {mrr && (
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500">Monthly revenue</span>
            <span className="text-zinc-300">{mrr}/mo</span>
          </div>
        )}
        {revenueMultiple && revenueMultiple !== "N/A" && (
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500">Revenue multiple</span>
            <span className="font-semibold text-indigo-400">{revenueMultiple}</span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-zinc-500">Project age</span>
          <span className="text-zinc-300">{age}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-zinc-500">Revenue trend</span>
          <span className={`flex items-center gap-1 font-medium ${trendColor}`}>
            <TrendIcon className="h-3.5 w-3.5" />
            {trendLabel}
          </span>
        </div>
      </div>
    </div>
  );
}

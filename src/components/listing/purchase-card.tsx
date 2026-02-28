"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PaymentPlaceholder } from "@/components/shared/payment-placeholder";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface PurchaseCardProps {
  askingPrice: string;
  openToOffers: boolean;
  age: string;
  revenueTrend: "up" | "flat" | "down";
  revenueMultiple?: string;
  mrr?: string;
}

export function PurchaseCard({
  askingPrice,
  openToOffers,
  age,
  revenueTrend,
  revenueMultiple,
  mrr,
}: PurchaseCardProps) {
  const [paymentOpen, setPaymentOpen] = useState(false);

  const TrendIcon =
    revenueTrend === "up" ? TrendingUp : revenueTrend === "down" ? TrendingDown : Minus;

  const trendColor =
    revenueTrend === "up"
      ? "text-green-400"
      : revenueTrend === "down"
      ? "text-red-400"
      : "text-zinc-400";

  const trendLabel =
    revenueTrend === "up" ? "Growing" : revenueTrend === "down" ? "Declining" : "Stable";

  return (
    <>
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
        <p className="text-3xl font-bold text-violet-400">{askingPrice}</p>
        {openToOffers && (
          <p className="mt-1 text-sm text-zinc-500">Open to offers</p>
        )}

        <Button
          className="mt-4 w-full bg-indigo-600 hover:bg-indigo-500"
          onClick={() => setPaymentOpen(true)}
        >
          Buy This Project
        </Button>
        <Button variant="outline" className="mt-2 w-full border-zinc-700 text-zinc-300">
          Make an Offer
        </Button>
        <Button variant="ghost" className="mt-2 w-full text-zinc-400 hover:text-zinc-50">
          Contact Seller
        </Button>

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
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500">Platform fee</span>
            <span className="text-zinc-300">5%</span>
          </div>
        </div>
      </div>

      <PaymentPlaceholder open={paymentOpen} onClose={() => setPaymentOpen(false)} />
    </>
  );
}

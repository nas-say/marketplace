"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PaymentPlaceholder } from "@/components/shared/payment-placeholder";

interface PurchaseCardProps {
  askingPrice: string;
  openToOffers: boolean;
  age: string;
  revenueTrend: "up" | "flat" | "down";
}

export function PurchaseCard({
  askingPrice,
  openToOffers,
  age,
  revenueTrend,
}: PurchaseCardProps) {
  const [paymentOpen, setPaymentOpen] = useState(false);

  return (
    <>
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
        <p className="text-3xl font-bold text-violet-400">{askingPrice}</p>
        {openToOffers && <p className="mt-1 text-sm text-zinc-500">Open to offers</p>}
        <Button className="mt-4 w-full bg-indigo-600 hover:bg-indigo-500" onClick={() => setPaymentOpen(true)}>
          Buy This Project
        </Button>
        <Button variant="outline" className="mt-2 w-full border-zinc-700 text-zinc-300">
          Make an Offer
        </Button>
        <Button variant="ghost" className="mt-2 w-full text-zinc-400 hover:text-zinc-50">
          Contact Seller
        </Button>

        <div className="mt-6 space-y-3 border-t border-zinc-800 pt-4">
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500">Project age</span>
            <span className="text-zinc-300">{age}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500">Revenue trend</span>
            <span className="text-zinc-300 capitalize">{revenueTrend}</span>
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

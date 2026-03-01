"use client";

import { useState } from "react";
import { Zap, Gift, ArrowUpRight, ArrowDownRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { giftConnectsAction } from "./actions";
import type { Currency } from "@/lib/geo";

const BUNDLES: Record<Currency, Array<{ connects: number; price: string; description: string; popular?: boolean }>> = {
  USD: [
    { connects: 5,  price: "$5",   description: "Good for 2 unlocks" },
    { connects: 10, price: "$9",   description: "Good for 5 unlocks", popular: true },
    { connects: 25, price: "$20",  description: "Good for 12 unlocks" },
  ],
  INR: [
    { connects: 10, price: "₹200", description: "Good for 5 unlocks" },
    { connects: 25, price: "₹380", description: "Good for 12 unlocks", popular: true },
    { connects: 60, price: "₹820", description: "Good for 30 unlocks" },
  ],
  EUR: [
    { connects: 5,  price: "€4.50", description: "Good for 2 unlocks" },
    { connects: 10, price: "€8.50", description: "Good for 5 unlocks", popular: true },
    { connects: 25, price: "€19",   description: "Good for 12 unlocks" },
  ],
  GBP: [
    { connects: 5,  price: "£4",    description: "Good for 2 unlocks" },
    { connects: 10, price: "£7.50", description: "Good for 5 unlocks", popular: true },
    { connects: 25, price: "£17",   description: "Good for 12 unlocks" },
  ],
};

const CURRENCY_LABELS: Record<Currency, string> = {
  USD: "USD", INR: "INR", EUR: "EUR", GBP: "GBP",
};

interface Transaction {
  id: string;
  amount: number;
  type: string;
  description: string | null;
  createdAt: string;
}

interface Props {
  balance: number;
  transactions: Transaction[];
  currency: Currency;
}

export function ConnectsClient({ balance: initialBalance, transactions, currency }: Props) {
  const [balance, setBalance] = useState(initialBalance);
  const [loading, setLoading] = useState(false);
  const [claimed, setClaimed] = useState(false);

  const bundles = BUNDLES[currency];
  const freeAmount = currency === "INR" ? 10 : 5;

  const handleClaim = async () => {
    setLoading(true);
    const result = await giftConnectsAction(freeAmount);
    if (!result.error) {
      setBalance((b) => b + freeAmount);
      setClaimed(true);
    }
    setLoading(false);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-start justify-between mb-8">
        <PageHeader title="Connects" description="Unlock seller info and initiate deals" />
        <div className="flex items-center gap-2 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-4 py-2.5 shrink-0">
          <Zap className="h-5 w-5 text-indigo-400" />
          <span className="text-2xl font-bold text-indigo-300">{balance}</span>
          <span className="text-sm text-indigo-400/80">connects</span>
        </div>
      </div>

      {/* Early access gift */}
      <div className="mb-8 rounded-lg border border-amber-500/30 bg-amber-500/10 p-5">
        <div className="flex items-start gap-3">
          <Gift className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-amber-300">Early Access Perk</p>
            <p className="text-sm text-amber-400/80 mt-0.5">
              Payments are setting up. Claim {freeAmount} free connects now to unlock seller info and try the platform.
            </p>
            <Button
              size="sm"
              variant="outline"
              className="mt-3 border-amber-500/40 text-amber-300 hover:bg-amber-500/10"
              onClick={handleClaim}
              disabled={loading || claimed}
            >
              {loading ? (
                <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Claiming...</>
              ) : claimed ? (
                `Claimed ✓ — ${freeAmount} connects added`
              ) : (
                `Claim ${freeAmount} free connects`
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Bundle options */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-zinc-50">Connect Bundles</h2>
        <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">{CURRENCY_LABELS[currency]}</span>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-3">
        {bundles.map((bundle) => (
          <div
            key={bundle.connects}
            className={`relative rounded-lg border bg-zinc-900 p-5 ${bundle.popular ? "border-indigo-500/50" : "border-zinc-800"}`}
          >
            {bundle.popular && (
              <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-indigo-600 text-white border-0 whitespace-nowrap">
                Most Popular
              </Badge>
            )}
            <p className="text-2xl font-bold text-zinc-50">{bundle.connects}</p>
            <p className="text-sm text-zinc-500">connects</p>
            <p className="mt-2 text-xl font-semibold text-violet-400">{bundle.price}</p>
            <p className="text-xs text-zinc-500 mt-0.5">{bundle.description}</p>
            {/* TODO: Replace with LemonSqueezy checkout URL for this currency+bundle when ready */}
            <Button className="mt-4 w-full bg-zinc-800 hover:bg-zinc-800 text-zinc-500 cursor-not-allowed" disabled>
              Coming Soon
            </Button>
          </div>
        ))}
      </div>
      <p className="text-xs text-zinc-600 mb-10 text-center">
        Payments via LemonSqueezy — coming soon. Each listing unlock costs 2 connects.
      </p>

      {/* Transaction history */}
      {transactions.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-zinc-50 mb-4">Transaction History</h2>
          <div className="space-y-2">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3">
                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${tx.amount > 0 ? "bg-green-500/10" : "bg-red-500/10"}`}>
                  {tx.amount > 0
                    ? <ArrowUpRight className="h-4 w-4 text-green-400" />
                    : <ArrowDownRight className="h-4 w-4 text-red-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-300">{tx.description ?? tx.type}</p>
                  <p className="text-xs text-zinc-500">
                    {new Date(tx.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>
                <span className={`text-sm font-semibold tabular-nums ${tx.amount > 0 ? "text-green-400" : "text-red-400"}`}>
                  {tx.amount > 0 ? "+" : ""}{tx.amount}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

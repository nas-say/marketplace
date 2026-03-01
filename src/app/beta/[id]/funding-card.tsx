"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

type PoolStatus = "not_required" | "pending" | "partial" | "funded";
type RewardType = "cash" | "premium_access";
type Currency = "INR" | "USD" | "EUR" | "GBP";

interface Props {
  betaTestId: string;
  isCreator: boolean;
  countryCode: string;
  paymentsEnabledForCountry: boolean;
  rewardType: RewardType;
  rewardCurrency: Currency;
  poolTotalMinor: number;
  poolFundedMinor: number;
  poolStatus: PoolStatus;
}

interface RazorpayOrderResponse {
  keyId: string;
  orderId: string;
  amount: number;
  currency: string;
  error?: string;
}

interface RazorpayHandlerPayload {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

type RazorpayInstance = {
  open: () => void;
  on: (event: string, handler: (response: unknown) => void) => void;
};

type RazorpayConstructor = new (options: Record<string, unknown>) => RazorpayInstance;

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

async function loadRazorpayCheckoutScript(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (window.Razorpay) return true;
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(!!window.Razorpay);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function formatMinorAmount(minor: number, currency: Currency) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(minor / 100);
}

export function FundingCard({
  betaTestId,
  isCreator,
  countryCode,
  paymentsEnabledForCountry,
  rewardType,
  rewardCurrency,
  poolTotalMinor,
  poolFundedMinor,
  poolStatus,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [markingInterest, setMarkingInterest] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  if (rewardType !== "cash" || poolTotalMinor <= 0) {
    return (
      <div className="mb-4 rounded border border-zinc-800 bg-zinc-800/60 p-3 text-left">
        <p className="text-sm font-medium text-zinc-300">Reward Funding</p>
        <p className="text-xs text-zinc-500 mt-1">No upfront funding is required for this reward type.</p>
      </div>
    );
  }

  const remainingMinor = Math.max(0, poolTotalMinor - poolFundedMinor);
  const funded = poolStatus === "funded" || remainingMinor === 0;

  const handleFund = async () => {
    if (!isCreator || funded || loading) return;
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const scriptReady = await loadRazorpayCheckoutScript();
      if (!scriptReady || !window.Razorpay) {
        setError("Could not load Razorpay checkout.");
        setLoading(false);
        return;
      }

      const orderRes = await fetch("/api/payments/razorpay/beta/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ betaTestId }),
      });
      const orderJson = (await orderRes.json()) as RazorpayOrderResponse;
      if (!orderRes.ok || orderJson.error) {
        setError(orderJson.error ?? "Could not create funding order.");
        setLoading(false);
        return;
      }

      const razorpay = new window.Razorpay({
        key: orderJson.keyId,
        amount: orderJson.amount,
        currency: orderJson.currency,
        name: "SideFlip",
        description: "Beta reward pool funding",
        order_id: orderJson.orderId,
        theme: { color: "#4f46e5" },
        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },
        handler: async (payload: RazorpayHandlerPayload) => {
          const verifyRes = await fetch("/api/payments/razorpay/beta/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ betaTestId, ...payload }),
          });
          const verifyJson = (await verifyRes.json()) as {
            success?: boolean;
            credited?: boolean;
            fundedAmountMinor?: number;
            error?: string;
          };
          if (!verifyRes.ok || verifyJson.error || !verifyJson.success) {
            setError(verifyJson.error ?? "Funding verification failed.");
            setLoading(false);
            return;
          }

          if (verifyJson.credited && (verifyJson.fundedAmountMinor ?? 0) > 0) {
            setMessage(`Funded ${formatMinorAmount(verifyJson.fundedAmountMinor ?? 0, rewardCurrency)} successfully.`);
          } else {
            setMessage("Funding already recorded.");
          }
          setLoading(false);
          router.refresh();
        },
      });

      razorpay.on("payment.failed", () => {
        setError("Payment failed. Please try again.");
        setLoading(false);
      });

      razorpay.open();
    } catch {
      setError("Could not start funding checkout.");
      setLoading(false);
    }
  };

  const handleMarkInterest = async () => {
    if (!isCreator || funded || markingInterest) return;

    setMarkingInterest(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/payments/interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feature: "beta_reward_funding",
          context: {
            betaTestId,
            rewardCurrency,
            poolTotalMinor,
            poolFundedMinor,
            countryCode,
          },
        }),
      });

      const json = (await response.json()) as { success?: boolean; error?: string };
      if (!response.ok || !json.success) {
        setError(json.error ?? "Could not mark your interest right now.");
        setMarkingInterest(false);
        return;
      }

      setMessage("Marked. We will email you when payments are available in your country.");
      setMarkingInterest(false);
    } catch {
      setError("Could not mark your interest right now.");
      setMarkingInterest(false);
    }
  };

  return (
    <div className="mb-4 rounded border border-zinc-800 bg-zinc-800/60 p-3 text-left">
      <p className="text-sm font-medium text-zinc-300">Reward Pool</p>
      <p className="mt-1 text-xs text-zinc-500">
        Funded {formatMinorAmount(poolFundedMinor, rewardCurrency)} of{" "}
        {formatMinorAmount(poolTotalMinor, rewardCurrency)}
      </p>
      <p className="text-xs text-zinc-500">
        Remaining: {formatMinorAmount(remainingMinor, rewardCurrency)}
      </p>

      {isCreator ? (
        funded ? (
          <p className="mt-2 text-xs text-green-400">Fully funded. Testers can apply.</p>
        ) : !paymentsEnabledForCountry ? (
          <div className="mt-3">
            <p className="mb-2 text-xs text-amber-400">
              Payments are currently available only in India. Mark interested to get notified.
            </p>
            <Button
              size="sm"
              className="w-full bg-zinc-700 hover:bg-zinc-600"
              onClick={() => void handleMarkInterest()}
              disabled={markingInterest}
            >
              {markingInterest ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Marking...
                </>
              ) : (
                "Mark Interested"
              )}
            </Button>
          </div>
        ) : (
          <>
            <Button
              size="sm"
              className="mt-3 w-full bg-indigo-600 hover:bg-indigo-500"
              onClick={() => void handleFund()}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Opening checkout...
                </>
              ) : (
                `Fund ${formatMinorAmount(remainingMinor, rewardCurrency)}`
              )}
            </Button>
            <p className="mt-2 text-xs text-amber-400">
              Beta reward funding payments are final and non-refundable once paid.
            </p>
          </>
        )
      ) : funded ? (
        <p className="mt-2 text-xs text-green-400">Reward pool funded by creator.</p>
      ) : (
        <p className="mt-2 text-xs text-amber-400">Waiting for creator to fund rewards.</p>
      )}

      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
      {message && <p className="mt-2 text-xs text-green-400">{message}</p>}
    </div>
  );
}

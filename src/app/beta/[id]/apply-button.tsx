"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { applyAction } from "./actions";
import { CheckCircle, Loader2 } from "lucide-react";

interface Props {
  betaTestId: string;
  alreadyApplied: boolean;
  closed: boolean;
  blockedReason?: string;
  rewardType: "cash" | "premium_access" | string;
  savedUpiId?: string | null;
  savedEmail?: string | null;
}

export function ApplyButton({
  betaTestId,
  alreadyApplied,
  closed,
  blockedReason,
  rewardType,
  savedUpiId,
  savedEmail,
}: Props) {
  const [applied, setApplied] = useState(alreadyApplied);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [upiId, setUpiId] = useState(savedUpiId ?? "");
  const [email, setEmail] = useState(savedEmail ?? "");

  if (closed) {
    return <Button disabled className="w-full">Testing Closed</Button>;
  }

  if (blockedReason) {
    return (
      <div>
        <Button disabled className="w-full">Applications Locked</Button>
        <p className="mt-2 text-xs text-amber-400 text-center">{blockedReason}</p>
      </div>
    );
  }

  if (applied) {
    return (
      <Button disabled className="w-full bg-green-700 hover:bg-green-700 text-white">
        <CheckCircle className="mr-2 h-4 w-4" />Applied
      </Button>
    );
  }

  const handleClick = async () => {
    setLoading(true);
    setError("");

    if (rewardType === "cash" && !upiId.trim()) {
      setError("UPI ID is required to receive your cash reward.");
      setLoading(false);
      return;
    }
    if (rewardType === "premium_access" && !email.trim()) {
      setError("Email is required so the creator can grant you access.");
      setLoading(false);
      return;
    }

    const result = await applyAction(betaTestId, {
      upiId: rewardType === "cash" ? upiId.trim() : undefined,
      applicantEmail: rewardType === "premium_access" ? email.trim() : undefined,
    });

    if (result.error) {
      setError(result.error);
    } else {
      setApplied(true);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-3">
      {rewardType === "cash" && (
        <div>
          <label className="block text-xs text-zinc-400 mb-1">
            UPI ID <span className="text-zinc-500">(to receive cash reward)</span>
          </label>
          <Input
            value={upiId}
            onChange={(e) => setUpiId(e.target.value)}
            placeholder="yourname@upi"
            className="bg-zinc-950 border-zinc-700 text-sm"
          />
          {savedUpiId && (
            <p className="mt-1 text-xs text-zinc-500">Using your saved UPI ID — edit to change.</p>
          )}
        </div>
      )}

      {rewardType === "premium_access" && (
        <div>
          <label className="block text-xs text-zinc-400 mb-1">
            Email <span className="text-zinc-500">(creator will grant access here)</span>
          </label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="bg-zinc-950 border-zinc-700 text-sm"
          />
        </div>
      )}

      <Button
        className="w-full bg-indigo-600 hover:bg-indigo-500"
        onClick={handleClick}
        disabled={loading}
      >
        {loading ? (
          <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Applying...</>
        ) : (
          "Sign Up to Test"
        )}
      </Button>
      {error && <p className="text-xs text-red-400 text-center">{error}</p>}
    </div>
  );
}

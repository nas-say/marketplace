"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { submitOfferAction } from "./offer-actions";
import { CheckCircle, DollarSign, Loader2 } from "lucide-react";

interface OfferSectionProps {
  listingId: string;
  askingPriceCents: number;
  userId: string | null;
}

export function OfferSection({ listingId, askingPriceCents, userId }: OfferSectionProps) {
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (success) {
    return (
      <div className="mt-4 flex items-start gap-2 rounded-lg border border-green-500/20 bg-green-500/5 p-4">
        <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-400" />
        <p className="text-sm text-green-400">
          Offer submitted! The seller has been notified. Check your dashboard for updates.
        </p>
      </div>
    );
  }

  if (!showForm) {
    return (
      <div className="mt-4">
        <Button
          size="sm"
          variant="outline"
          className="w-full border-zinc-700 text-zinc-300 hover:border-indigo-500/50 hover:text-indigo-300"
          onClick={() => {
            if (!userId) {
              alert("Sign in to make an offer");
              return;
            }
            setShowForm(true);
          }}
        >
          <DollarSign className="mr-1.5 h-3.5 w-3.5" />
          Make an offer
        </Button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountCents = Math.round((Number(amount) || 0) * 100);
    if (!amountCents || amountCents <= 0) {
      setError("Enter a valid offer amount.");
      return;
    }
    setLoading(true);
    setError("");
    const result = await submitOfferAction(listingId, amountCents, message);
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }
    setSuccess(true);
    setLoading(false);
  };

  const suggestedPrice = Math.round(askingPriceCents / 100 * 0.9);

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 space-y-3 rounded-lg border border-zinc-700 bg-zinc-800/40 p-4"
    >
      <p className="text-sm font-medium text-zinc-300">Make an offer</p>
      <div>
        <label className="mb-1 block text-xs text-zinc-500">Your offer (USD)</label>
        <Input
          type="number"
          min="1"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={String(suggestedPrice)}
          className="bg-zinc-900 border-zinc-700 text-sm"
          required
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-zinc-500">Message (optional)</label>
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tell the seller about yourself and why you're interested..."
          className="bg-zinc-900 border-zinc-700 text-sm"
          rows={3}
          maxLength={500}
        />
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="border-zinc-700 text-zinc-400"
          onClick={() => setShowForm(false)}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          size="sm"
          className="flex-1 bg-indigo-600 hover:bg-indigo-500"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              Submitting...
            </>
          ) : (
            "Submit Offer"
          )}
        </Button>
      </div>
    </form>
  );
}

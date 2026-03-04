"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, ExternalLink, Loader2, Zap } from "lucide-react";
import Link from "next/link";
import { unlockListingAction } from "@/app/connects/actions";
import { toSafeWebsiteUrl } from "@/lib/validation/profile";

interface Props {
  listingId: string;
  canRevealContact: boolean;
  hasUnlocked: boolean;
  contactMode: "direct" | "proposal";
  proposalAccepted: boolean;
  website: string | null;
  userId: string | null;
  connectsBalance: number;
  unlockCost: number;
}

export function SellerWebsiteGate({
  listingId,
  canRevealContact,
  hasUnlocked,
  contactMode,
  proposalAccepted,
  website,
  userId,
  connectsBalance,
  unlockCost,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleUnlock = async () => {
    setLoading(true);
    setError("");
    const result = await unlockListingAction(listingId);
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }
    router.refresh();
  };

  if (!userId) {
    return (
      <Link href="/sign-in" className="flex items-center gap-1 hover:text-indigo-400 transition-colors">
        <Lock className="h-3 w-3" />
        Sign in to unlock
      </Link>
    );
  }

  if (canRevealContact) {
    const safeWebsite = toSafeWebsiteUrl(website);
    if (!safeWebsite) return <span className="text-zinc-600">No website listed</span>;
    return (
      <a href={safeWebsite} target="_blank" rel="noopener noreferrer" className="flex items-center gap-0.5 hover:text-indigo-400 transition-colors">
        Website <ExternalLink className="h-3 w-3" />
      </a>
    );
  }

  if (hasUnlocked && contactMode === "proposal" && !proposalAccepted) {
    return <span className="text-zinc-500">Pending seller acceptance</span>;
  }

  return (
    <span className="flex items-center gap-2">
      {connectsBalance >= unlockCost ? (
        <>
          <button
            onClick={handleUnlock}
            disabled={loading}
            className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition-colors disabled:opacity-50"
          >
            {loading
              ? <><Loader2 className="h-3 w-3 animate-spin" /> Unlocking...</>
              : <><Zap className="h-3 w-3" /> Unlock — {unlockCost} connects</>}
          </button>
          {error && <span className="text-red-400 text-[10px]">{error}</span>}
        </>
      ) : (
        <Link href="/connects" className="flex items-center gap-1 hover:text-indigo-400 transition-colors">
          <Lock className="h-3 w-3" />
          {userId ? "Buy connects to unlock" : "Sign in to unlock"}
        </Link>
      )}
    </span>
  );
}

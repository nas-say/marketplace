"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ShieldCheck, Github, Globe, ClipboardCheck } from "lucide-react";
import type { Listing } from "@/types/listing";
import type { ListingVerification } from "@/lib/db/listing-verifications";
import {
  requestManualReviewAction,
  startDomainVerificationAction,
  startRepoVerificationAction,
  verifyDomainOwnershipAction,
  verifyRepoOwnershipAction,
} from "./actions";

interface Props {
  listing: Listing;
  verifications: ListingVerification[];
}

function statusLabel(status: Listing["status"]) {
  if (status === "pending_verification") return "Pending Verification";
  if (status === "active") return "Live";
  if (status === "draft") return "Draft";
  return "Sold";
}

function methodBadge(method: Listing["ownershipVerificationMethod"]) {
  if (method === "repo") return "Repo Verified";
  if (method === "domain") return "Domain Verified";
  if (method === "manual") return "Manually Reviewed";
  return "Unverified";
}

export function VerifyListingClient({ listing, verifications }: Props) {
  const router = useRouter();
  const [repoUrl, setRepoUrl] = useState("");
  const [domain, setDomain] = useState("");
  const [manualNote, setManualNote] = useState("");
  const [loadingAction, setLoadingAction] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const pendingRepoChecks = useMemo(
    () => verifications.filter((item) => item.method === "repo" && item.status === "pending"),
    [verifications]
  );
  const pendingDomainChecks = useMemo(
    () => verifications.filter((item) => item.method === "domain" && item.status === "pending"),
    [verifications]
  );
  const manualRequests = useMemo(
    () => verifications.filter((item) => item.method === "manual"),
    [verifications]
  );

  const runAction = async (actionKey: string, fn: () => Promise<{ success?: boolean; error?: string }>) => {
    setLoadingAction(actionKey);
    setError("");
    setSuccess("");
    const result = await fn();
    if (result.error) {
      setError(result.error);
      setLoadingAction("");
      return false;
    }
    setLoadingAction("");
    router.refresh();
    return true;
  };

  const handleStartRepo = async () => {
    if (!repoUrl.trim()) {
      setError("Enter a GitHub repository URL or owner/repo.");
      return;
    }
    setLoadingAction("start-repo");
    setError("");
    setSuccess("");

    const result = await startRepoVerificationAction(listing.id, repoUrl);
    if (result.error) {
      setError(result.error);
      setLoadingAction("");
      return;
    }

    setSuccess(
      `Challenge created for ${result.normalizedRepo}. Add "${result.challengeText}" to repo description or README, then click Verify.`
    );
    setRepoUrl("");
    setLoadingAction("");
    router.refresh();
  };

  const handleVerifyRepo = async (verificationId: string) => {
    const ok = await runAction(`verify-repo-${verificationId}`, () =>
      verifyRepoOwnershipAction(listing.id, verificationId)
    );
    if (ok) {
      setSuccess("Repository verified successfully.");
    }
  };

  const handleStartDomain = async () => {
    if (!domain.trim()) {
      setError("Enter a domain.");
      return;
    }
    setLoadingAction("start-domain");
    setError("");
    setSuccess("");

    const result = await startDomainVerificationAction(listing.id, domain);
    if (result.error) {
      setError(result.error);
      setLoadingAction("");
      return;
    }

    setSuccess(
      `Challenge created for ${result.normalizedDomain}. Add TXT record "${result.challengeText}" and click Verify after DNS propagates.`
    );
    setDomain("");
    setLoadingAction("");
    router.refresh();
  };

  const handleVerifyDomain = async (verificationId: string) => {
    const ok = await runAction(`verify-domain-${verificationId}`, () =>
      verifyDomainOwnershipAction(listing.id, verificationId)
    );
    if (ok) {
      setSuccess("Domain verified successfully.");
    }
  };

  const handleManualReview = async () => {
    const ok = await runAction("manual-review", () => requestManualReviewAction(listing.id, manualNote));
    if (ok) {
      setSuccess("Manual review request submitted.");
      setManualNote("");
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 text-sm text-zinc-500">
        <Link href="/dashboard" className="hover:text-zinc-300">Dashboard</Link>
        <span className="mx-2">/</span>
        <Link href={`/listing/${listing.id}`} className="hover:text-zinc-300">{listing.title}</Link>
        <span className="mx-2">/</span>
        <span className="text-zinc-300">Verify Ownership</span>
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-50">Verify Listing Ownership</h1>
            <p className="mt-1 text-sm text-zinc-500">
              Prove you own this project before it goes live on the marketplace.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge className="bg-zinc-800 text-zinc-200 border-zinc-700">{statusLabel(listing.status)}</Badge>
            <Badge
              className={
                listing.ownershipVerified
                  ? "bg-green-500/10 text-green-400 border-green-500/30"
                  : "bg-amber-500/10 text-amber-400 border-amber-500/30"
              }
            >
              {methodBadge(listing.ownershipVerificationMethod)}
            </Badge>
          </div>
        </div>

        {error && <p className="mt-4 rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>}
        {success && (
          <p className="mt-4 rounded border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm text-green-400">{success}</p>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
          <div className="flex items-center gap-2">
            <Github className="h-4 w-4 text-indigo-400" />
            <h2 className="font-semibold text-zinc-50">1. Repo Verification (Recommended)</h2>
          </div>
          <p className="mt-2 text-sm text-zinc-500">
            Enter your GitHub repository and generate a challenge token.
          </p>

          <div className="mt-4 flex gap-2">
            <Input
              value={repoUrl}
              onChange={(event) => setRepoUrl(event.target.value)}
              placeholder="https://github.com/owner/repo"
              className="bg-zinc-950 border-zinc-700"
            />
            <Button onClick={() => void handleStartRepo()} disabled={loadingAction === "start-repo"}>
              {loadingAction === "start-repo" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Generate"}
            </Button>
          </div>

          {pendingRepoChecks.length > 0 && (
            <div className="mt-4 space-y-3">
              {pendingRepoChecks.map((item) => (
                <div key={item.id} className="rounded border border-zinc-700 bg-zinc-950 p-3">
                  <p className="text-xs text-zinc-400">Repo: <span className="text-zinc-200">{item.target}</span></p>
                  <p className="mt-1 text-xs text-zinc-400">Add this token:</p>
                  <code className="mt-1 block rounded bg-zinc-900 px-2 py-1 text-xs text-indigo-300">
                    sideflip-verify={item.challengeToken}
                  </code>
                  {item.lastError && <p className="mt-2 text-xs text-red-400">{item.lastError}</p>}
                  <Button
                    size="sm"
                    className="mt-3 bg-indigo-600 hover:bg-indigo-500"
                    onClick={() => void handleVerifyRepo(item.id)}
                    disabled={loadingAction === `verify-repo-${item.id}`}
                  >
                    {loadingAction === `verify-repo-${item.id}` ? (
                      <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Verifying...</>
                    ) : (
                      "Verify Repo"
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-emerald-400" />
            <h2 className="font-semibold text-zinc-50">2. Domain Verification</h2>
          </div>
          <p className="mt-2 text-sm text-zinc-500">
            Add a DNS TXT record with the challenge token.
          </p>

          <div className="mt-4 flex gap-2">
            <Input
              value={domain}
              onChange={(event) => setDomain(event.target.value)}
              placeholder="yourdomain.com"
              className="bg-zinc-950 border-zinc-700"
            />
            <Button onClick={() => void handleStartDomain()} disabled={loadingAction === "start-domain"}>
              {loadingAction === "start-domain" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Generate"}
            </Button>
          </div>

          {pendingDomainChecks.length > 0 && (
            <div className="mt-4 space-y-3">
              {pendingDomainChecks.map((item) => (
                <div key={item.id} className="rounded border border-zinc-700 bg-zinc-950 p-3">
                  <p className="text-xs text-zinc-400">Domain: <span className="text-zinc-200">{item.target}</span></p>
                  <p className="mt-1 text-xs text-zinc-400">TXT value:</p>
                  <code className="mt-1 block rounded bg-zinc-900 px-2 py-1 text-xs text-emerald-300">
                    sideflip-verify={item.challengeToken}
                  </code>
                  {item.lastError && <p className="mt-2 text-xs text-red-400">{item.lastError}</p>}
                  <Button
                    size="sm"
                    className="mt-3 bg-emerald-600 hover:bg-emerald-500"
                    onClick={() => void handleVerifyDomain(item.id)}
                    disabled={loadingAction === `verify-domain-${item.id}`}
                  >
                    {loadingAction === `verify-domain-${item.id}` ? (
                      <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Verifying...</>
                    ) : (
                      "Verify Domain"
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="mt-6 rounded-lg border border-zinc-800 bg-zinc-900 p-5">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="h-4 w-4 text-amber-400" />
          <h2 className="font-semibold text-zinc-50">3. Manual Review</h2>
        </div>
        <p className="mt-2 text-sm text-zinc-500">
          If you cannot complete repo/domain checks, request manual review and include context.
        </p>
        <Textarea
          value={manualNote}
          onChange={(event) => setManualNote(event.target.value)}
          className="mt-3 bg-zinc-950 border-zinc-700"
          rows={4}
          placeholder="Optional note: include links, screenshots, or proof context."
        />
        <Button
          className="mt-3 bg-amber-600 hover:bg-amber-500"
          onClick={() => void handleManualReview()}
          disabled={loadingAction === "manual-review"}
        >
          {loadingAction === "manual-review" ? (
            <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Submitting...</>
          ) : (
            "Request Manual Review"
          )}
        </Button>

        {manualRequests.length > 0 && (
          <div className="mt-4 space-y-2">
            {manualRequests.map((item) => (
              <div key={item.id} className="rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-zinc-400">
                <span className="text-zinc-200">Status:</span> {item.status}
                {item.note ? <span> | Note: {item.note}</span> : null}
              </div>
            ))}
          </div>
        )}
      </section>

      {listing.ownershipVerified && (
        <div className="mt-6 rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-400">
          <p className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            Ownership verified. Your listing can remain live on the marketplace.
          </p>
        </div>
      )}
    </div>
  );
}

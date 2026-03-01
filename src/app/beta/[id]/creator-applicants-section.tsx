"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { approveApplicationAction } from "./actions";
import type { CreatorBetaApplication } from "@/lib/db/applications";

interface Props {
  betaTestId: string;
  rewardType: "cash" | "premium_access";
  applicants: CreatorBetaApplication[];
}

function statusClassName(status: CreatorBetaApplication["status"]): string {
  if (status === "accepted") return "bg-green-500/10 text-green-400 border-green-500/30";
  if (status === "rejected") return "bg-red-500/10 text-red-400 border-red-500/30";
  return "bg-zinc-500/10 text-zinc-400 border-zinc-500/30";
}

export function CreatorApplicantsSection({ betaTestId, rewardType, applicants }: Props) {
  const [rows, setRows] = useState(applicants);
  const [approvingUserId, setApprovingUserId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const acceptedCount = useMemo(
    () => rows.filter((row) => row.status === "accepted").length,
    [rows]
  );

  const handleApprove = async (applicantUserId: string) => {
    setApprovingUserId(applicantUserId);
    setError("");

    const result = await approveApplicationAction(betaTestId, applicantUserId);

    setApprovingUserId(null);

    if (result.error) {
      setError(result.error);
      toast.error(result.error);
      return;
    }

    setRows((current) =>
      current.map((row) =>
        row.applicantUserId === applicantUserId
          ? { ...row, status: "accepted" as const }
          : row
      )
    );
    toast.success(result.notice ?? "Applicant approved.");
  };

  return (
    <div className="mt-8 rounded-lg border border-zinc-800 bg-zinc-900 p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-zinc-50">Applicants</h2>
        <div className="flex items-center gap-2 text-xs">
          <Badge className="bg-zinc-800 text-zinc-300 border-zinc-700">{rows.length} total</Badge>
          <Badge className="bg-green-500/10 text-green-400 border-green-500/30">{acceptedCount} approved</Badge>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-zinc-500">No applications yet.</p>
      ) : (
        <div className="space-y-3">
          {rows.map((applicant) => {
            const showPremiumInstruction =
              rewardType === "premium_access" && applicant.status === "accepted";
            const showCashInstruction =
              rewardType === "cash" && applicant.status === "accepted";

            return (
              <div key={applicant.applicantUserId} className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-zinc-200">
                      {applicant.applicantName ?? applicant.applicantUserId}
                    </p>
                    <p className="text-xs text-zinc-500">
                      Applied {new Date(applicant.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                    <p className="text-xs text-zinc-400">
                      Email:{" "}
                      {applicant.applicantEmail ? (
                        <a
                          href={`mailto:${applicant.applicantEmail}`}
                          className="text-indigo-300 hover:text-indigo-200"
                        >
                          {applicant.applicantEmail}
                        </a>
                      ) : (
                        <span className="text-zinc-500">Not provided</span>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge className={statusClassName(applicant.status)}>{applicant.status}</Badge>
                    {applicant.status !== "accepted" && (
                      <Button
                        size="sm"
                        className="bg-indigo-600 hover:bg-indigo-500"
                        disabled={approvingUserId === applicant.applicantUserId}
                        onClick={() => void handleApprove(applicant.applicantUserId)}
                      >
                        {approvingUserId === applicant.applicantUserId ? (
                          <>
                            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                            Approving...
                          </>
                        ) : (
                          "Approve"
                        )}
                      </Button>
                    )}
                  </div>
                </div>

                {showPremiumInstruction && (
                  <p className="mt-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-xs text-amber-300">
                    Give this user premium access now via{" "}
                    <span className="font-medium">
                      {applicant.applicantEmail ?? "their provided email"}
                    </span>
                    .
                  </p>
                )}

                {showCashInstruction && (
                  <p className="mt-2 rounded-md border border-green-500/30 bg-green-500/10 px-2 py-1 text-xs text-green-300">
                    Approved for SideFlip payout from the funded reward pool.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {error && <p className="mt-3 text-xs text-red-400">{error}</p>}
    </div>
  );
}

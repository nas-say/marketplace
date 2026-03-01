"use client";

import { useMemo, useState, useTransition } from "react";
import { Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { submitFeedbackAction } from "./actions";
import { toast } from "sonner";

interface FeedbackRow {
  id: string;
  rating: number;
  comment: string | null;
  feedbackType: string | null;
  createdAt: string;
}

interface Props {
  betaTestId: string;
  isAcceptedTester: boolean;
  existingFeedback: FeedbackRow[];
  isCreator: boolean;
  hasSubmittedFeedback?: boolean;
}

const FEEDBACK_TYPES = ["bug_report", "ux_review", "feature_request", "general"] as const;

function formatFeedbackType(type: string | null): string {
  if (!type) return "general";
  return type.replace(/_/g, " ");
}

export function FeedbackSection({
  betaTestId,
  isAcceptedTester,
  existingFeedback,
  isCreator,
  hasSubmittedFeedback = false,
}: Props) {
  const [rating, setRating] = useState(5);
  const [feedbackType, setFeedbackType] = useState<(typeof FEEDBACK_TYPES)[number]>("general");
  const [comment, setComment] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitted, setSubmitted] = useState(hasSubmittedFeedback);
  const [feedbackRows, setFeedbackRows] = useState(existingFeedback);
  const [submitting, startTransition] = useTransition();

  const shouldShowSection = isCreator || isAcceptedTester;
  const showForm = isAcceptedTester && !submitted;

  const hasFeedback = feedbackRows.length > 0;
  const canSeeList = isCreator || isAcceptedTester;
  const showEmptyForCreator = isCreator && !hasFeedback;

  const disabledSubmit = submitting || rating < 1 || rating > 5;
  const todayIso = useMemo(() => new Date().toISOString(), []);

  if (!shouldShowSection) return null;

  const handleSubmit = () => {
    setSubmitError("");

    startTransition(async () => {
      const result = await submitFeedbackAction(betaTestId, {
        rating,
        feedbackType,
        comment,
      });

      if (result.error) {
        setSubmitError(result.error);
        return;
      }

      setSubmitted(true);
      setFeedbackRows((rows) => [
        {
          id: `local-${todayIso}`,
          rating,
          comment: comment.trim() || null,
          feedbackType,
          createdAt: todayIso,
        },
        ...rows,
      ]);
      toast.success("Feedback submitted!");
    });
  };

  return (
    <div className="mt-8 space-y-4">
      <h2 className="text-xl font-semibold text-zinc-50">Feedback</h2>

      {showForm && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <p className="mb-3 text-sm text-zinc-400">Share your testing feedback.</p>

          <div className="mb-4">
            <p className="mb-2 text-sm text-zinc-400">Rating</p>
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }, (_, index) => {
                const value = index + 1;
                const active = value <= rating;
                return (
                  <button
                    key={value}
                    type="button"
                    aria-label={`Rate ${value} stars`}
                    onClick={() => setRating(value)}
                    className="rounded p-1 transition-colors hover:bg-zinc-800"
                  >
                    <Star className={`h-5 w-5 ${active ? "fill-amber-400 text-amber-400" : "text-zinc-600"}`} />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mb-4">
            <label className="mb-2 block text-sm text-zinc-400" htmlFor="feedback-type">
              Feedback type
            </label>
            <select
              id="feedback-type"
              value={feedbackType}
              onChange={(event) => setFeedbackType(event.target.value as (typeof FEEDBACK_TYPES)[number])}
              className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
            >
              {FEEDBACK_TYPES.map((type) => (
                <option key={type} value={type}>
                  {formatFeedbackType(type)}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="mb-2 block text-sm text-zinc-400" htmlFor="feedback-comment">
              Comment
            </label>
            <Textarea
              id="feedback-comment"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              maxLength={2000}
              rows={4}
              placeholder="Share bugs, UX issues, or suggestions."
              className="bg-zinc-950 border-zinc-700"
            />
            <p className="mt-1 text-right text-xs text-zinc-600">{comment.length}/2000</p>
          </div>

          <Button
            type="button"
            onClick={handleSubmit}
            className="bg-indigo-600 hover:bg-indigo-500"
            disabled={disabledSubmit}
          >
            {submitting ? "Submitting..." : "Submit feedback"}
          </Button>
          {submitError && <p className="mt-2 text-xs text-red-400">{submitError}</p>}
        </div>
      )}

      {canSeeList && hasFeedback && (
        <div className="space-y-3">
          {feedbackRows.map((feedback) => (
            <div key={feedback.id} className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }, (_, index) => (
                    <Star
                      key={`${feedback.id}-star-${index + 1}`}
                      className={`h-4 w-4 ${
                        index < feedback.rating ? "fill-amber-400 text-amber-400" : "text-zinc-700"
                      }`}
                    />
                  ))}
                </div>
                <Badge className="border-zinc-700 bg-zinc-800 text-zinc-300">
                  {formatFeedbackType(feedback.feedbackType)}
                </Badge>
              </div>
              {feedback.comment && <p className="text-sm text-zinc-300 whitespace-pre-wrap">{feedback.comment}</p>}
              <p className="mt-2 text-xs text-zinc-500">
                {new Date(feedback.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
          ))}
        </div>
      )}

      {showEmptyForCreator && (
        <p className="text-sm text-zinc-500">No feedback submitted yet.</p>
      )}
    </div>
  );
}

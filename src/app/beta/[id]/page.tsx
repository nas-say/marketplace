import { getBetaTestById, getUserById, getFeedbackByBetaTest, getBetaTests } from "@/lib/data";
import { FeedbackItem } from "@/components/beta/feedback-item";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";
import Link from "next/link";

interface BetaDetailPageProps {
  params: Promise<{ id: string }>;
}

export function generateStaticParams() {
  return getBetaTests().map((betaTest) => ({ id: betaTest.id }));
}

export default async function BetaDetailPage({ params }: BetaDetailPageProps) {
  const { id } = await params;
  const betaTest = getBetaTestById(id);

  if (!betaTest) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-zinc-50">Beta test not found</h1>
        <Link href="/beta" className="mt-4 text-indigo-400 hover:underline">Back to beta board</Link>
      </div>
    );
  }

  const creator = getUserById(betaTest.creatorId);
  const feedback = getFeedbackByBetaTest(betaTest.id);
  const spotsRemaining = betaTest.spots.total - betaTest.spots.filled;
  const fillPercent = (betaTest.spots.filled / betaTest.spots.total) * 100;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <div className="mb-6 text-sm text-zinc-500">
        <Link href="/" className="hover:text-zinc-300">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/beta" className="hover:text-zinc-300">Beta Tests</Link>
        <span className="mx-2">/</span>
        <span className="text-zinc-300">{betaTest.title}</span>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
        {/* Left column */}
        <div>
          <h1 className="text-3xl font-bold text-zinc-50">{betaTest.title}</h1>
          <div className="mt-3 flex flex-wrap gap-2">
            {betaTest.platform.map((p) => (
              <Badge key={p} variant="outline" className="border-zinc-700 text-zinc-400 capitalize">{p}</Badge>
            ))}
            {betaTest.feedbackTypes.map((ft) => (
              <Badge key={ft} variant="secondary" className="bg-zinc-800 text-zinc-300 text-xs capitalize">
                {ft.replace("_", " ")}
              </Badge>
            ))}
          </div>

          <p className="mt-6 text-zinc-300">{betaTest.description}</p>

          {/* Testing instructions */}
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-zinc-50 mb-4">Testing Instructions</h2>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
              {betaTest.testingInstructions.split("\n").map((line, i) => (
                <p key={i} className="text-sm text-zinc-300 py-0.5">{line}</p>
              ))}
            </div>
          </div>

          <div className="mt-4 text-sm text-zinc-500">
            <strong className="text-zinc-300">Requirements:</strong> {betaTest.requirements}
          </div>

          {/* Feedback section */}
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-zinc-50 mb-4">
              Feedback ({feedback.length})
            </h2>
            {feedback.length === 0 ? (
              <p className="text-zinc-500">No feedback yet. Be the first to test!</p>
            ) : (
              <div className="space-y-4">
                {feedback.map((fb) => (
                  <FeedbackItem key={fb.id} feedback={fb} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
            <div className="mb-4">
              <p className="text-sm text-zinc-500 mb-1">{betaTest.spots.filled} of {betaTest.spots.total} spots filled</p>
              <div className="h-2 rounded-full bg-zinc-800">
                <div className="h-2 rounded-full bg-indigo-600" style={{ width: `${fillPercent}%` }} />
              </div>
              <p className="mt-1 text-sm text-zinc-400">{spotsRemaining} spots remaining</p>
            </div>

            <div className="mb-4 rounded bg-zinc-800 p-3 text-center">
              <p className="text-sm text-zinc-500">Reward</p>
              <p className="text-lg font-bold text-violet-400">{betaTest.reward.description}</p>
            </div>

            <p className="mb-4 text-sm text-zinc-500">
              Deadline: {new Date(betaTest.deadline).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </p>

            {betaTest.status !== "closed" ? (
              <Button className="w-full bg-indigo-600 hover:bg-indigo-500">
                Sign Up to Test
              </Button>
            ) : (
              <Button disabled className="w-full">Testing Closed</Button>
            )}

            {/* Creator info */}
            {creator && (
              <div className="mt-6 border-t border-zinc-800 pt-4">
                <p className="text-sm text-zinc-500 mb-2">Created by</p>
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800">
                    <User className="h-4 w-4 text-zinc-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-50">{creator.displayName}</p>
                    <p className="text-xs text-zinc-500">{creator.bio}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

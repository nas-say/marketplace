"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/shared/page-header";
import { Loader2 } from "lucide-react";
import { createBetaTestAction } from "./actions";

const PLATFORMS = [
  { id: "web", label: "Web" },
  { id: "ios", label: "iOS" },
  { id: "android", label: "Android" },
  { id: "desktop", label: "Desktop" },
  { id: "chrome-extension", label: "Chrome Extension" },
];

export function CreateBetaForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [platforms, setPlatforms] = useState<string[]>(["web"]);
  const [rewardType, setRewardType] = useState<"cash" | "premium_access">("cash");

  const togglePlatform = (id: string) =>
    setPlatforms((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = formRef.current;
    if (!form) return;
    const fd = new FormData(form);

    setLoading(true);
    setError("");

    const result = await createBetaTestAction({
      title: fd.get("title") as string,
      description: fd.get("description") as string,
      spotsTotal: Number(fd.get("spotsTotal")) || 20,
      rewardDescription: fd.get("rewardDescription") as string,
      rewardType,
      rewardAmountInr: rewardType === "cash" ? Number(fd.get("rewardAmountInr")) || 0 : 0,
      testingInstructions: fd.get("testingInstructions") as string,
      requirements: (fd.get("requirements") as string) || "",
      deadline: fd.get("deadline") as string,
    });

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    router.push(`/beta/${result.betaTestId}`);
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <PageHeader
        title="Create Beta Test"
        description="Recruit testers to validate your project before launch."
      />

      {error && (
        <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-8">
        {/* Basics */}
        <section>
          <h2 className="text-lg font-semibold text-zinc-50 mb-4">Project Details</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Project / Test Name *</label>
              <Input
                name="title"
                required
                placeholder="e.g., TaskFlow — AI Task Manager"
                className="bg-zinc-900 border-zinc-800"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Description *</label>
              <Textarea
                name="description"
                required
                rows={4}
                placeholder="Briefly describe what your project does and what you want testers to focus on."
                className="bg-zinc-900 border-zinc-800"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Platform *</label>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => togglePlatform(p.id)}
                    className={`rounded-full px-3 py-1 text-sm border transition-colors ${
                      platforms.includes(p.id)
                        ? "border-indigo-500/50 bg-indigo-500/10 text-indigo-300"
                        : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Spots & Reward */}
        <section>
          <h2 className="text-lg font-semibold text-zinc-50 mb-4">Spots & Reward</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Number of Testers *</label>
              <Input
                name="spotsTotal"
                type="number"
                min="1"
                max="500"
                defaultValue="20"
                required
                className="bg-zinc-900 border-zinc-800"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Application Deadline *</label>
              <Input
                name="deadline"
                type="date"
                required
                className="bg-zinc-900 border-zinc-800"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm text-zinc-400 mb-2">Reward Type *</label>
            <div className="flex gap-2">
              {[
                { id: "cash", label: "Cash (INR)" },
                { id: "premium_access", label: "Premium Access" },
              ].map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setRewardType(option.id as "cash" | "premium_access")}
                  className={`flex-1 rounded-md px-3 py-2 text-sm border transition-colors ${
                    rewardType === option.id
                      ? "border-indigo-500/50 bg-indigo-500/10 text-indigo-300"
                      : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          {rewardType === "cash" ? (
            <div className="mt-4">
              <label className="block text-sm text-zinc-400 mb-1">Cash Reward per Tester (INR) *</label>
              <Input
                name="rewardAmountInr"
                type="number"
                min="1"
                step="1"
                required={rewardType === "cash"}
                placeholder="e.g., 300"
                className="bg-zinc-900 border-zinc-800"
              />
              <p className="mt-1 text-xs text-amber-400">
                Cash rewards are funded via Razorpay and are non-refundable once paid.
              </p>
            </div>
          ) : (
            <div className="mt-4">
              <label className="block text-sm text-zinc-400 mb-1">Access Description *</label>
              <Input
                name="rewardDescription"
                required
                placeholder="e.g., 3 months Pro access"
                maxLength={120}
                className="bg-zinc-900 border-zinc-800"
              />
              <p className="mt-1 text-xs text-zinc-500">
                You&apos;ll grant access manually to accepted testers via their provided email.
              </p>
            </div>
          )}
          {rewardType === "cash" && (
            <div className="mt-4">
              <label className="block text-sm text-zinc-400 mb-1">Reward Description *</label>
              <Input
                name="rewardDescription"
                required
                placeholder="e.g., ₹300 cash per completed test"
                className="bg-zinc-900 border-zinc-800"
              />
            </div>
          )}
        </section>

        {/* Instructions */}
        <section>
          <h2 className="text-lg font-semibold text-zinc-50 mb-4">Instructions</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Testing Instructions *</label>
              <Textarea
                name="testingInstructions"
                required
                rows={6}
                placeholder={`Step-by-step guide for testers:\n1. Sign up at ...\n2. Try creating a ...\n3. Submit feedback via ...`}
                className="bg-zinc-900 border-zinc-800"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Requirements <span className="text-zinc-600">(optional)</span></label>
              <Input
                name="requirements"
                placeholder="e.g., Must have an iOS device running 16+, prior SaaS experience"
                className="bg-zinc-900 border-zinc-800"
              />
            </div>
          </div>
        </section>

        <Button type="submit" size="lg" className="w-full bg-indigo-600 hover:bg-indigo-500" disabled={loading}>
          {loading ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</>
          ) : (
            "Launch Beta Test"
          )}
        </Button>
      </form>
    </div>
  );
}

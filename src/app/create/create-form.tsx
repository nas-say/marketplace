"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { CATEGORY_LABELS } from "@/lib/constants";
import { CheckCircle, X, Info, Loader2 } from "lucide-react";
import { createListingAction } from "./actions";

const ASSET_OPTIONS = [
  { id: "source_code", label: "Source Code" },
  { id: "domain", label: "Domain Name" },
  { id: "user_database", label: "User Database" },
  { id: "documentation", label: "Documentation" },
  { id: "hosting_setup", label: "Hosting Setup" },
  { id: "support_period", label: "30-day Support Period" },
];

export function CreateForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [techInput, setTechInput] = useState("");
  const [techStack, setTechStack] = useState<string[]>([]);
  const [includeBeta, setIncludeBeta] = useState(false);
  const [assets, setAssets] = useState<string[]>(["source_code", "documentation"]);
  const [mrr, setMrr] = useState("");
  const [askingPrice, setAskingPrice] = useState("");

  const addTech = () => {
    if (techInput.trim() && !techStack.includes(techInput.trim())) {
      setTechStack([...techStack, techInput.trim()]);
      setTechInput("");
    }
  };

  const removeTech = (tech: string) => setTechStack(techStack.filter((t) => t !== tech));
  const toggleAsset = (id: string) =>
    setAssets((prev) => (prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]));

  const mrrNum = Number(mrr);
  const priceNum = Number(askingPrice);
  const multiple = mrrNum > 0 && priceNum > 0 ? (priceNum / mrrNum).toFixed(1) : null;
  const multipleNum = multiple ? Number(multiple) : null;
  const multipleColor =
    multipleNum === null
      ? ""
      : multipleNum < 20
      ? "text-amber-400"
      : multipleNum > 50
      ? "text-red-400"
      : "text-green-400";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = formRef.current;
    if (!form) return;
    const fd = new FormData(form);

    setLoading(true);
    setError("");

    const result = await createListingAction({
      title: fd.get("title") as string,
      pitch: fd.get("pitch") as string,
      description: fd.get("description") as string,
      category: fd.get("category") as string,
      techStack,
      askingPrice: Number(fd.get("askingPrice")) || 0,
      openToOffers: fd.has("openToOffers"),
      mrr: Number(fd.get("mrr")) || 0,
      monthlyProfit: Number(fd.get("monthlyProfit")) || 0,
      monthlyVisitors: Number(fd.get("monthlyVisitors")) || 0,
      registeredUsers: Number(fd.get("registeredUsers")) || 0,
      assetsIncluded: assets,
      includeBeta,
      betaSpots: Number(fd.get("betaSpots")) || 20,
      betaReward: (fd.get("betaReward") as string) || "",
      betaInstructions: (fd.get("betaInstructions") as string) || "",
      betaDeadline: (fd.get("betaDeadline") as string) || "",
    });

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    if (result.requiresVerification) {
      router.push(`/listing/${result.listingId}/verify`);
      return;
    }
    router.push(`/listing/${result.listingId}`);
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <PageHeader title="List Your Project" description="Fill in the details to list your project on SideFlip." />

      {error && (
        <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-8">
        {/* Basics */}
        <section>
          <h2 className="text-lg font-semibold text-zinc-50 mb-4">Basics</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Project Name *</label>
              <Input name="title" required placeholder="My Awesome SaaS" className="bg-zinc-900 border-zinc-800" />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Category *</label>
              <select
                name="category"
                required
                className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-50 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">Select a category</option>
                {Object.entries(CATEGORY_LABELS).map(([slug, label]) => (
                  <option key={slug} value={slug}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">One-line Pitch *</label>
              <Input
                name="pitch"
                required
                maxLength={120}
                placeholder="A short, compelling description (120 chars max)"
                className="bg-zinc-900 border-zinc-800"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Full Description *</label>
              <Textarea
                name="description"
                required
                rows={8}
                placeholder="Describe your project in detail. Markdown is supported (## Heading, - List item)."
                className="bg-zinc-900 border-zinc-800"
              />
            </div>
          </div>
        </section>

        {/* Tech Stack */}
        <section>
          <h2 className="text-lg font-semibold text-zinc-50 mb-4">Tech Stack</h2>
          <div className="flex gap-2">
            <Input
              value={techInput}
              onChange={(e) => setTechInput(e.target.value)}
              placeholder="Add technology (e.g., React, Stripe)"
              className="bg-zinc-900 border-zinc-800"
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTech())}
            />
            <Button type="button" onClick={addTech} variant="outline" className="border-zinc-700">Add</Button>
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {techStack.map((tech) => (
              <Badge key={tech} variant="secondary" className="bg-zinc-800 text-zinc-300 gap-1">
                {tech}
                <button type="button" onClick={() => removeTech(tech)}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </section>

        {/* Metrics */}
        <section>
          <h2 className="text-lg font-semibold text-zinc-50 mb-4">Metrics</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Monthly Revenue ($)</label>
              <Input
                name="mrr"
                type="number"
                min="0"
                placeholder="0"
                value={mrr}
                onChange={(e) => setMrr(e.target.value)}
                className="bg-zinc-900 border-zinc-800"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Monthly Profit ($)</label>
              <Input name="monthlyProfit" type="number" min="0" placeholder="0" className="bg-zinc-900 border-zinc-800" />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Monthly Visitors</label>
              <Input name="monthlyVisitors" type="number" min="0" placeholder="0" className="bg-zinc-900 border-zinc-800" />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Registered Users</label>
              <Input name="registeredUsers" type="number" min="0" placeholder="0" className="bg-zinc-900 border-zinc-800" />
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section>
          <h2 className="text-lg font-semibold text-zinc-50 mb-4">Pricing</h2>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Asking Price ($) *</label>
            <Input
              name="askingPrice"
              required
              type="number"
              min="1"
              placeholder="5000"
              value={askingPrice}
              onChange={(e) => setAskingPrice(e.target.value)}
              className="bg-zinc-900 border-zinc-800"
            />
          </div>

          <div className="mt-3 rounded-lg border border-zinc-800 bg-zinc-900 p-3">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-zinc-500 mt-0.5 shrink-0" />
              <div className="text-xs text-zinc-500 space-y-1">
                <p>Typical SaaS multiples: <span className="text-zinc-300">20–40× monthly revenue</span></p>
                <p>E.g., $850/mo MRR → list at $17K–$34K for faster sales</p>
                {multiple && (
                  <p className="mt-1">
                    Your multiple:{" "}
                    <span className={`font-semibold ${multipleColor}`}>{multiple}×</span>
                    {multipleNum && multipleNum < 20 && " — may be underpriced"}
                    {multipleNum && multipleNum > 50 && " — may be hard to sell"}
                    {multipleNum && multipleNum >= 20 && multipleNum <= 50 && " — looks good"}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <input
              type="checkbox"
              id="open-to-offers"
              name="openToOffers"
              className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 accent-indigo-600"
            />
            <label htmlFor="open-to-offers" className="text-sm text-zinc-400">
              Open to offers below asking price
            </label>
          </div>
        </section>

        {/* Assets Included */}
        <section>
          <h2 className="text-lg font-semibold text-zinc-50 mb-1">Assets Included</h2>
          <p className="text-sm text-zinc-500 mb-4">Select everything that transfers to the buyer.</p>
          <div className="grid grid-cols-2 gap-2">
            {ASSET_OPTIONS.map((asset) => (
              <button
                key={asset.id}
                type="button"
                onClick={() => toggleAsset(asset.id)}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm text-left transition-colors ${
                  assets.includes(asset.id)
                    ? "border-indigo-500/50 bg-indigo-500/10 text-indigo-300"
                    : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300"
                }`}
              >
                <CheckCircle
                  className={`h-4 w-4 shrink-0 ${assets.includes(asset.id) ? "text-indigo-400" : "text-zinc-700"}`}
                />
                {asset.label}
              </button>
            ))}
          </div>
        </section>

        {/* Beta test toggle */}
        <section>
          <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            <div>
              <p className="font-medium text-zinc-50">Also list as Beta Test?</p>
              <p className="text-sm text-zinc-500">Recruit beta testers to validate this project</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={includeBeta}
              onClick={() => setIncludeBeta(!includeBeta)}
              className={`relative h-6 w-11 rounded-full transition-colors ${includeBeta ? "bg-indigo-600" : "bg-zinc-700"}`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${includeBeta ? "translate-x-5" : ""}`}
              />
            </button>
          </div>

          {includeBeta && (
            <div className="mt-3 space-y-4 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Number of Testers Needed</label>
                <Input name="betaSpots" type="number" min="1" placeholder="20" className="bg-zinc-900 border-zinc-700" />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Reward for Testers</label>
                <Input name="betaReward" placeholder="e.g., $10 per completed test, or Free Pro access" className="bg-zinc-900 border-zinc-700" />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Testing Instructions</label>
                <Textarea
                  name="betaInstructions"
                  rows={4}
                  placeholder="Step-by-step instructions for testers..."
                  className="bg-zinc-900 border-zinc-700"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Deadline</label>
                <Input name="betaDeadline" type="date" className="bg-zinc-900 border-zinc-700" />
              </div>
            </div>
          )}
        </section>

        <Button type="submit" size="lg" className="w-full bg-indigo-600 hover:bg-indigo-500" disabled={loading}>
          {loading ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating listing...</>
          ) : (
            "Create Listing"
          )}
        </Button>
      </form>
    </div>
  );
}

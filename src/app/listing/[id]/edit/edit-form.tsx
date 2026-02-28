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
import { Listing } from "@/types/listing";
import { updateListingAction } from "./actions";

const ASSET_OPTIONS = [
  { id: "source_code", label: "Source Code" },
  { id: "domain", label: "Domain Name" },
  { id: "user_database", label: "User Database" },
  { id: "documentation", label: "Documentation" },
  { id: "hosting_setup", label: "Hosting Setup" },
  { id: "support_period", label: "30-day Support Period" },
];

export function EditListingForm({ listing }: { listing: Listing }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [techInput, setTechInput] = useState("");
  const [techStack, setTechStack] = useState<string[]>(listing.techStack);
  const [assets, setAssets] = useState<string[]>(listing.assetsIncluded);
  // prices stored as dollars in state (DB is in cents)
  const [mrr, setMrr] = useState(String(listing.metrics.mrr / 100));
  const [askingPrice, setAskingPrice] = useState(String(listing.askingPrice / 100));

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
    multipleNum === null ? "" : multipleNum < 20 ? "text-amber-400" : multipleNum > 50 ? "text-red-400" : "text-green-400";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = formRef.current;
    if (!form) return;
    const fd = new FormData(form);

    setLoading(true);
    setError("");
    setSuccess(false);

    const result = await updateListingAction(listing.id, {
      title: fd.get("title") as string,
      pitch: fd.get("pitch") as string,
      description: fd.get("description") as string,
      category: fd.get("category") as string,
      techStack,
      askingPrice: Math.round((Number(fd.get("askingPrice")) || 0) * 100),
      openToOffers: fd.has("openToOffers"),
      mrr: Math.round((Number(fd.get("mrr")) || 0) * 100),
      monthlyProfit: Math.round((Number(fd.get("monthlyProfit")) || 0) * 100),
      monthlyVisitors: Number(fd.get("monthlyVisitors")) || 0,
      registeredUsers: Number(fd.get("registeredUsers")) || 0,
      assetsIncluded: assets,
    });

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
      setTimeout(() => router.push(`/listing/${listing.id}`), 1000);
    }
    setLoading(false);
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <PageHeader title="Edit Listing" description={listing.title} />

      {success && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-green-400">
          <CheckCircle className="h-5 w-5 shrink-0" />
          <span className="text-sm">Saved! Redirecting...</span>
        </div>
      )}
      {error && (
        <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">{error}</div>
      )}

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-8">
        <section>
          <h2 className="text-lg font-semibold text-zinc-50 mb-4">Basics</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Project Name *</label>
              <Input name="title" required defaultValue={listing.title} className="bg-zinc-900 border-zinc-800" />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Category *</label>
              <select
                name="category"
                required
                defaultValue={listing.category}
                className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-50 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {Object.entries(CATEGORY_LABELS).map(([slug, label]) => (
                  <option key={slug} value={slug}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">One-line Pitch *</label>
              <Input name="pitch" required maxLength={120} defaultValue={listing.pitch} className="bg-zinc-900 border-zinc-800" />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Full Description *</label>
              <Textarea name="description" required rows={8} defaultValue={listing.description} className="bg-zinc-900 border-zinc-800" />
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-50 mb-4">Tech Stack</h2>
          <div className="flex gap-2">
            <Input
              value={techInput}
              onChange={(e) => setTechInput(e.target.value)}
              placeholder="Add technology"
              className="bg-zinc-900 border-zinc-800"
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTech())}
            />
            <Button type="button" onClick={addTech} variant="outline" className="border-zinc-700">Add</Button>
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {techStack.map((tech) => (
              <Badge key={tech} variant="secondary" className="bg-zinc-800 text-zinc-300 gap-1">
                {tech}
                <button type="button" onClick={() => removeTech(tech)}><X className="h-3 w-3" /></button>
              </Badge>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-50 mb-4">Metrics</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Monthly Revenue ($)</label>
              <Input name="mrr" type="number" min="0" value={mrr} onChange={(e) => setMrr(e.target.value)} className="bg-zinc-900 border-zinc-800" />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Monthly Profit ($)</label>
              <Input name="monthlyProfit" type="number" min="0" defaultValue={listing.metrics.monthlyProfit / 100} className="bg-zinc-900 border-zinc-800" />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Monthly Visitors</label>
              <Input name="monthlyVisitors" type="number" min="0" defaultValue={listing.metrics.monthlyVisitors} className="bg-zinc-900 border-zinc-800" />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Registered Users</label>
              <Input name="registeredUsers" type="number" min="0" defaultValue={listing.metrics.registeredUsers} className="bg-zinc-900 border-zinc-800" />
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-zinc-50 mb-4">Pricing</h2>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Asking Price ($) *</label>
            <Input name="askingPrice" required type="number" min="1" value={askingPrice} onChange={(e) => setAskingPrice(e.target.value)} className="bg-zinc-900 border-zinc-800" />
          </div>
          <div className="mt-3 rounded-lg border border-zinc-800 bg-zinc-900 p-3">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-zinc-500 mt-0.5 shrink-0" />
              <div className="text-xs text-zinc-500 space-y-1">
                <p>Typical SaaS multiples: <span className="text-zinc-300">20–40× monthly revenue</span></p>
                {multiple && (
                  <p>Your multiple: <span className={`font-semibold ${multipleColor}`}>{multiple}×</span>
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
              defaultChecked={listing.openToOffers}
              className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 accent-indigo-600"
            />
            <label htmlFor="open-to-offers" className="text-sm text-zinc-400">Open to offers below asking price</label>
          </div>
        </section>

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
                <CheckCircle className={`h-4 w-4 shrink-0 ${assets.includes(asset.id) ? "text-indigo-400" : "text-zinc-700"}`} />
                {asset.label}
              </button>
            ))}
          </div>
        </section>

        <div className="flex gap-3">
          <Button type="button" variant="outline" className="border-zinc-700 text-zinc-300" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-500" disabled={loading}>
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}

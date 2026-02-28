"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { CATEGORY_LABELS } from "@/lib/constants";
import { CheckCircle, X } from "lucide-react";

export default function CreatePage() {
  const [submitted, setSubmitted] = useState(false);
  const [techInput, setTechInput] = useState("");
  const [techStack, setTechStack] = useState<string[]>([]);
  const [includeBeta, setIncludeBeta] = useState(false);

  const addTech = () => {
    if (techInput.trim() && !techStack.includes(techInput.trim())) {
      setTechStack([...techStack, techInput.trim()]);
      setTechInput("");
    }
  };

  const removeTech = (tech: string) => {
    setTechStack(techStack.filter((t) => t !== tech));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <PageHeader title="List Your Project" description="Fill in the details to list your project on SideFlip." />

      {submitted && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-green-400">
          <CheckCircle className="h-5 w-5" />
          Listing created! (This is a demo — no data is saved.)
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basics */}
        <section>
          <h2 className="text-lg font-semibold text-zinc-50 mb-4">Basics</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Project Name *</label>
              <Input required placeholder="My Awesome SaaS" className="bg-zinc-900 border-zinc-800" />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Category *</label>
              <select required className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-50">
                <option value="">Select a category</option>
                {Object.entries(CATEGORY_LABELS).map(([slug, label]) => (
                  <option key={slug} value={slug}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">One-line Pitch *</label>
              <Input required maxLength={120} placeholder="A short, compelling description (120 chars max)" className="bg-zinc-900 border-zinc-800" />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Full Description *</label>
              <Textarea required rows={8} placeholder="Describe your project in detail. Markdown supported." className="bg-zinc-900 border-zinc-800" />
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
              placeholder="Add technology (e.g., React)"
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

        {/* Metrics */}
        <section>
          <h2 className="text-lg font-semibold text-zinc-50 mb-4">Metrics</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Monthly Revenue ($)</label>
              <Input type="number" min="0" placeholder="0" className="bg-zinc-900 border-zinc-800" />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Monthly Profit ($)</label>
              <Input type="number" min="0" placeholder="0" className="bg-zinc-900 border-zinc-800" />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Monthly Visitors</label>
              <Input type="number" min="0" placeholder="0" className="bg-zinc-900 border-zinc-800" />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Registered Users</label>
              <Input type="number" min="0" placeholder="0" className="bg-zinc-900 border-zinc-800" />
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section>
          <h2 className="text-lg font-semibold text-zinc-50 mb-4">Pricing</h2>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Asking Price ($) *</label>
            <Input required type="number" min="1" placeholder="5000" className="bg-zinc-900 border-zinc-800" />
          </div>
        </section>

        {/* Beta test toggle */}
        <section>
          <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            <div>
              <p className="font-medium text-zinc-50">Also list as Beta Test?</p>
              <p className="text-sm text-zinc-500">Get beta testers for this project too</p>
            </div>
            <button
              type="button"
              onClick={() => setIncludeBeta(!includeBeta)}
              className={`relative h-6 w-11 rounded-full transition-colors ${includeBeta ? "bg-indigo-600" : "bg-zinc-700"}`}
            >
              <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${includeBeta ? "translate-x-5" : ""}`} />
            </button>
          </div>

          {includeBeta && (
            <div className="mt-4 space-y-4 rounded-lg border border-zinc-800 bg-zinc-900 p-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Number of Testers Needed</label>
                <Input type="number" min="1" placeholder="20" className="bg-zinc-900 border-zinc-700" />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Reward for Testers</label>
                <Input placeholder="e.g., $10 per completed test" className="bg-zinc-900 border-zinc-700" />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Testing Instructions</label>
                <Textarea rows={4} placeholder="Step-by-step instructions for testers..." className="bg-zinc-900 border-zinc-700" />
              </div>
            </div>
          )}
        </section>

        <Button type="submit" size="lg" className="w-full bg-indigo-600 hover:bg-indigo-500">
          Create Listing
        </Button>
      </form>
    </div>
  );
}

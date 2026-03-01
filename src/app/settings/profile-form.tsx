"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, Loader2 } from "lucide-react";
import { updateProfileAction } from "./actions";

interface Props {
  initialValues: {
    displayName: string;
    bio: string;
    location: string;
    website: string;
    twitter: string;
    github: string;
  };
}

export function ProfileForm({ initialValues }: Props) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [values, setValues] = useState(initialValues);

  const set =
    (field: keyof typeof values) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setValues((v) => ({ ...v, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);
    const result = await updateProfileAction(values);
    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {success && (
        <div className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-green-400">
          <CheckCircle className="h-4 w-4 shrink-0" />
          <span className="text-sm">Profile updated.</span>
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">{error}</div>
      )}

      <div>
        <label className="block text-sm text-zinc-400 mb-1">Display Name *</label>
        <Input value={values.displayName} onChange={set("displayName")} required className="bg-zinc-900 border-zinc-800" />
      </div>

      <div>
        <label className="block text-sm text-zinc-400 mb-1">Bio</label>
        <Textarea
          value={values.bio}
          onChange={set("bio")}
          rows={3}
          placeholder="Tell buyers about yourself and your projects..."
          className="bg-zinc-900 border-zinc-800"
        />
      </div>

      <div>
        <label className="block text-sm text-zinc-400 mb-1">Location</label>
        <Input value={values.location} onChange={set("location")} placeholder="e.g., San Francisco, CA" className="bg-zinc-900 border-zinc-800" />
      </div>

      <div>
        <label className="block text-sm text-zinc-400 mb-1">Website</label>
        <Input
          type="url"
          value={values.website}
          onChange={set("website")}
          placeholder="https://yoursite.com"
          className="bg-zinc-900 border-zinc-800"
        />
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
        <p className="text-sm font-medium text-zinc-300 mb-1">Social Profiles</p>
        <p className="text-xs text-zinc-500 mb-4">Used for identity verification only — not shown publicly to buyers.</p>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-sm text-zinc-500 w-16 shrink-0">Twitter</span>
            <Input
              value={values.twitter}
              onChange={set("twitter")}
              placeholder="handle (no @)"
              maxLength={15}
              className="bg-zinc-800 border-zinc-700"
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-zinc-500 w-16 shrink-0">GitHub</span>
            <Input
              value={values.github}
              onChange={set("github")}
              placeholder="username"
              maxLength={39}
              className="bg-zinc-800 border-zinc-700"
            />
          </div>
        </div>
      </div>

      <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500" disabled={loading}>
        {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : "Save Profile"}
      </Button>
    </form>
  );
}

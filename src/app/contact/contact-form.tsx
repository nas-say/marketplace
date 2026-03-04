"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { sendContactMessageAction } from "./actions";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;
    setStatus("sending");
    const result = await sendContactMessageAction({ name, email, message });
    setStatus(result.error ? "error" : "sent");
  };

  if (status === "sent") {
    return (
      <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-6 py-8 text-center">
        <p className="font-semibold text-emerald-300">Message sent!</p>
        <p className="mt-1 text-sm text-zinc-400">We&apos;ll get back to you within 24 hours.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-50 placeholder-zinc-600 focus:border-indigo-500 focus:outline-none"
          placeholder="Your name"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-50 placeholder-zinc-600 focus:border-indigo-500 focus:outline-none"
          placeholder="you@example.com"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1">Message</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          rows={5}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-50 placeholder-zinc-600 focus:border-indigo-500 focus:outline-none resize-none"
          placeholder="How can we help?"
        />
      </div>
      {status === "error" && (
        <p className="text-sm text-red-400">Something went wrong. Please email us directly.</p>
      )}
      <Button
        type="submit"
        disabled={status === "sending"}
        className="w-full bg-indigo-600 hover:bg-indigo-500"
      >
        {status === "sending" ? "Sending…" : "Send message"}
      </Button>
    </form>
  );
}

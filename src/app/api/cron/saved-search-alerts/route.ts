import { NextResponse } from "next/server";
import { getAllPendingSavedSearches, markSavedSearchesNotified } from "@/lib/db/saved-searches";
import { getListings } from "@/lib/db/listings";
import { absoluteUrl } from "@/lib/seo";
import { formatPrice } from "@/lib/formatting";

export const runtime = "nodejs";

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return process.env.NODE_ENV !== "production";
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.RESEND_API_KEY?.trim();
  const fromEmail = process.env.INTEREST_FROM_EMAIL?.trim() || "SideFlip <onboarding@resend.dev>";

  const [savedSearches, allListings] = await Promise.all([
    getAllPendingSavedSearches(),
    getListings(),
  ]);

  const cutoff = Date.now() - ONE_DAY_MS;
  const newListings = allListings.filter((l) => new Date(l.createdAt).getTime() > cutoff);

  if (newListings.length === 0 || savedSearches.length === 0) {
    await markSavedSearchesNotified(savedSearches.map((s) => s.id));
    return NextResponse.json({ ok: true, sent: 0, reason: "no_new_listings_or_searches" });
  }

  // Group searches by email
  const byEmail = new Map<string, typeof savedSearches>();
  for (const s of savedSearches) {
    const existing = byEmail.get(s.email) ?? [];
    existing.push(s);
    byEmail.set(s.email, existing);
  }

  let sent = 0;
  const processedIds: string[] = savedSearches.map((s) => s.id);

  if (apiKey) {
    for (const [email, searches] of byEmail) {
      // Find matching listings across all searches for this email
      const matched = new Map<string, (typeof newListings)[0]>();
      for (const search of searches) {
        for (const listing of newListings) {
          if (matched.has(listing.id)) continue;
          if (search.category && listing.category !== search.category) continue;
          if (search.maxPriceCents && listing.askingPrice > search.maxPriceCents) continue;
          matched.set(listing.id, listing);
        }
      }

      if (matched.size === 0) continue;

      const matchedListings = Array.from(matched.values());
      const count = matchedListings.length;
      const listingLines = matchedListings
        .map((l) => `• ${l.title} — ${formatPrice(l.askingPrice)}\n  ${absoluteUrl(`/listing/${l.id}`)}`)
        .join("\n\n");

      const body = `${count} new project${count !== 1 ? "s" : ""} listed on SideFlip match your saved search:\n\n${listingLines}\n\nBrowse all: ${absoluteUrl("/browse")}\nManage alerts in your dashboard settings.`;

      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [email],
          subject: `[SideFlip] ${count} new listing${count !== 1 ? "s" : ""} match your saved search`,
          text: body,
        }),
      }).catch(() => null);

      sent++;
    }
  }

  await markSavedSearchesNotified(processedIds);
  return NextResponse.json({ ok: true, sent });
}

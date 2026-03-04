import { NextResponse } from "next/server";
import { archiveStaleListings, getListingsToWarn, StaleListing } from "@/lib/db/listings";
import { clerkClient } from "@clerk/nextjs/server";
import { absoluteUrl } from "@/lib/seo";

export const runtime = "nodejs";

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return process.env.NODE_ENV !== "production";
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

async function getSellerEmail(sellerId: string): Promise<string | null> {
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(sellerId);
    return (
      user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress ?? null
    );
  } catch {
    return null;
  }
}

async function sendEmail(to: string, subject: string, text: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return;
  const from = process.env.INTEREST_FROM_EMAIL?.trim() || "SideFlip <onboarding@resend.dev>";
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [to], subject, text }),
  });
}

async function notifySellers(listings: StaleListing[], type: "warn" | "archived"): Promise<void> {
  // Group by sellerId to send one email per seller
  const bySeller = new Map<string, StaleListing[]>();
  for (const l of listings) {
    const group = bySeller.get(l.sellerId) ?? [];
    group.push(l);
    bySeller.set(l.sellerId, group);
  }

  for (const [sellerId, sellerListings] of bySeller) {
    const email = await getSellerEmail(sellerId);
    if (!email) continue;

    const listingLines = sellerListings
      .map((l) => `• ${l.title} — ${absoluteUrl(`/listing/${l.id}`)}`)
      .join("\n");

    if (type === "warn") {
      await sendEmail(
        email,
        `[SideFlip] Your listing${sellerListings.length > 1 ? "s" : ""} will be archived in 30 days`,
        `Hi,\n\nYour listing${sellerListings.length > 1 ? "s have" : " has"} not been updated in 60 days and will be automatically archived in 30 more days if no action is taken:\n\n${listingLines}\n\nIf your project is still for sale, log in and click "Keep active" in your dashboard to keep it visible to buyers.\n\n${absoluteUrl("/dashboard")}\n\n— The SideFlip Team`
      ).catch(() => null);
    } else {
      await sendEmail(
        email,
        `[SideFlip] Your listing${sellerListings.length > 1 ? "s have" : " has"} been archived`,
        `Hi,\n\nYour listing${sellerListings.length > 1 ? "s have" : " has"} been automatically archived after 90 days of inactivity:\n\n${listingLines}\n\nTo re-activate, log in to your dashboard and update your listing.\n\n${absoluteUrl("/dashboard")}\n\n— The SideFlip Team`
      ).catch(() => null);
    }
  }
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const [toWarn, archived] = await Promise.all([
    getListingsToWarn(),
    archiveStaleListings(),
  ]);

  // Fire-and-forget notifications
  Promise.all([
    notifySellers(toWarn, "warn"),
    notifySellers(archived, "archived"),
  ]).catch(() => null);

  return NextResponse.json({
    ok: true,
    warned: toWarn.length,
    archived: archived.length,
  });
}

import { Webhook } from "svix";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { upsertProfile } from "@/lib/db/profiles";

export async function POST(req: Request) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return new NextResponse("Webhook secret not configured", { status: 500 });
  }

  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new NextResponse("Missing svix headers", { status: 400 });
  }

  const body = await req.text();

  const wh = new Webhook(webhookSecret);
  let event: { type: string; data: Record<string, unknown> };

  try {
    event = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as typeof event;
  } catch {
    return new NextResponse("Invalid signature", { status: 400 });
  }

  if (event.type === "user.created" || event.type === "user.updated") {
    const data = event.data;
    const clerkUserId = data.id as string;
    const firstName = (data.first_name as string) ?? "";
    const lastName = (data.last_name as string) ?? "";
    const displayName = [firstName, lastName].filter(Boolean).join(" ") || "Anonymous";
    const emailAddresses = (data.email_addresses as Array<{ email_address: string }>) ?? [];
    const email = emailAddresses[0]?.email_address;

    await upsertProfile({ clerkUserId, displayName, email });
  }

  return new NextResponse("OK", { status: 200 });
}

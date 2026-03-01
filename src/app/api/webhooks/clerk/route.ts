import { Webhook } from "svix";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { upsertProfile } from "@/lib/db/profiles";
import { createServiceClient } from "@/lib/supabase";

async function deleteUserData(clerkUserId: string): Promise<boolean> {
  const client = createServiceClient();
  const deletions = await Promise.all([
    client.from("watchlist").delete().eq("clerk_user_id", clerkUserId),
    client.from("unlocked_listings").delete().eq("clerk_user_id", clerkUserId),
    client.from("connects_transactions").delete().eq("clerk_user_id", clerkUserId),
    client.from("connects_balance").delete().eq("clerk_user_id", clerkUserId),
    client.from("beta_applications").delete().eq("clerk_user_id", clerkUserId),
    client.from("beta_reward_payments").delete().eq("creator_id", clerkUserId),
    client.from("profiles").delete().eq("clerk_user_id", clerkUserId),
  ]);

  const failed = deletions.find((result) => result.error);
  if (failed?.error) {
    console.error("[clerk/webhook] failed to delete user data", {
      clerkUserId,
      code: failed.error.code,
      message: failed.error.message,
    });
    return false;
  }

  return true;
}

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

    try {
      await upsertProfile({ clerkUserId, displayName, email });
    } catch (error) {
      console.error("[clerk/webhook] failed to upsert profile", {
        clerkUserId,
        error: error instanceof Error ? error.message : String(error),
      });
      return new NextResponse("Profile sync failed", { status: 500 });
    }
  }

  if (event.type === "user.deleted") {
    const data = event.data;
    const clerkUserId = data.id as string | undefined;
    if (!clerkUserId) {
      return new NextResponse("Missing user id in delete event", { status: 400 });
    }

    const deleted = await deleteUserData(clerkUserId);
    if (!deleted) {
      return new NextResponse("User cleanup failed", { status: 500 });
    }
  }

  return new NextResponse("OK", { status: 200 });
}

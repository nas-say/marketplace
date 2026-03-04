import "server-only";

import { createServiceClient } from "@/lib/supabase";
import { UserNotificationItem } from "@/types/notification";

interface RawNotificationRow {
  id?: string;
  type?: string | null;
  title?: string | null;
  message?: string | null;
  href?: string | null;
  read_at?: string | null;
  created_at?: string | null;
}

function isMissingTableError(error: { code?: string } | null | undefined): boolean {
  return error?.code === "42P01";
}

function rowToNotification(row: RawNotificationRow): UserNotificationItem | null {
  if (!row.id || !row.title || !row.created_at) return null;
  return {
    id: String(row.id),
    type: typeof row.type === "string" && row.type.trim().length > 0 ? row.type : "general",
    title: String(row.title),
    message: typeof row.message === "string" ? row.message : null,
    href: typeof row.href === "string" ? row.href : null,
    readAt: typeof row.read_at === "string" ? row.read_at : null,
    createdAt: String(row.created_at),
  };
}

export async function createUserNotification(input: {
  clerkUserId: string;
  type: string;
  title: string;
  message?: string | null;
  href?: string | null;
}): Promise<boolean> {
  if (!input.clerkUserId || !input.title.trim()) return false;
  const client = createServiceClient();
  const { error } = await client.from("notifications").insert({
    clerk_user_id: input.clerkUserId,
    type: input.type.trim() || "general",
    title: input.title.trim(),
    message: input.message?.trim() || null,
    href: input.href ?? null,
  });
  if (error) {
    if (!isMissingTableError(error)) {
      console.error("[notifications] create failed", { code: error.code, message: error.message });
    }
    return false;
  }
  return true;
}

export async function getUserNotifications(
  clerkUserId: string,
  limit = 12
): Promise<UserNotificationItem[]> {
  if (!clerkUserId) return [];
  const client = createServiceClient();
  const safeLimit = Math.min(Math.max(Math.floor(limit), 1), 50);
  const { data, error } = await client
    .from("notifications")
    .select("id, type, title, message, href, read_at, created_at")
    .eq("clerk_user_id", clerkUserId)
    .order("created_at", { ascending: false })
    .limit(safeLimit);

  if (error || !data) {
    if (error && !isMissingTableError(error)) {
      console.error("[notifications] list failed", { code: error.code, message: error.message });
    }
    return [];
  }

  return (data as RawNotificationRow[])
    .map(rowToNotification)
    .filter((item): item is UserNotificationItem => item !== null);
}

export async function getUnreadUserNotificationCount(clerkUserId: string): Promise<number> {
  if (!clerkUserId) return 0;
  const client = createServiceClient();
  const { count, error } = await client
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("clerk_user_id", clerkUserId)
    .is("read_at", null);

  if (error) {
    if (!isMissingTableError(error)) {
      console.error("[notifications] count failed", { code: error.code, message: error.message });
    }
    return 0;
  }
  return count ?? 0;
}

export async function markAllUserNotificationsRead(clerkUserId: string): Promise<boolean> {
  if (!clerkUserId) return false;
  const client = createServiceClient();
  const nowIso = new Date().toISOString();
  const { error } = await client
    .from("notifications")
    .update({ read_at: nowIso })
    .eq("clerk_user_id", clerkUserId)
    .is("read_at", null);
  if (error) {
    if (!isMissingTableError(error)) {
      console.error("[notifications] mark-all-read failed", {
        code: error.code,
        message: error.message,
      });
    }
    return false;
  }
  return true;
}


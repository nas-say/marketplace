"use server";

import { auth } from "@clerk/nextjs/server";
import {
  getUnreadUserNotificationCount,
  getUserNotifications,
  markAllUserNotificationsRead,
} from "@/lib/db/notifications";
import { getConnectsBalance } from "@/lib/db/connects";
import { revalidatePath } from "next/cache";
import { UserNotificationItem } from "@/types/notification";

export async function getNotificationsSnapshotAction(): Promise<{
  error?: string;
  unread: number;
  notifications: UserNotificationItem[];
}> {
  const { userId } = await auth();
  if (!userId) return { error: "Not authenticated", unread: 0, notifications: [] };

  const [unread, notifications] = await Promise.all([
    getUnreadUserNotificationCount(userId),
    getUserNotifications(userId, 12),
  ]);

  return { unread, notifications };
}

export async function getNavbarMetaAction(): Promise<{
  error?: string;
  unread: number;
  connectsBalance: number | null;
}> {
  const { userId } = await auth();
  if (!userId) return { error: "Not authenticated", unread: 0, connectsBalance: null };

  const [unread, connectsBalance] = await Promise.all([
    getUnreadUserNotificationCount(userId),
    getConnectsBalance(userId),
  ]);

  return { unread, connectsBalance };
}

export async function markAllNotificationsReadAction(): Promise<{
  success?: boolean;
  error?: string;
}> {
  const { userId } = await auth();
  if (!userId) return { error: "Not authenticated" };

  const ok = await markAllUserNotificationsRead(userId);
  if (!ok) return { error: "Could not mark notifications as read." };

  revalidatePath("/");
  return { success: true };
}

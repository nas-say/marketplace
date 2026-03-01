import "server-only";

import { createServiceClient } from "@/lib/supabase";

export type AdminNotificationLevel = "critical" | "warning" | "info" | "success";
export type AdminNotificationStatus = "open" | "snoozed" | "resolved";

interface RawAdminNotificationRow {
  id?: string;
  dedupe_key?: string | null;
  source?: string | null;
  level?: string;
  title?: string;
  message?: string;
  href?: string | null;
  status?: string;
  snoozed_until?: string | null;
  resolved_at?: string | null;
  resolved_by?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at?: string;
  updated_at?: string;
}

export interface AdminNotificationItem {
  id: string;
  dedupeKey: string | null;
  source: string;
  level: AdminNotificationLevel;
  title: string;
  message: string;
  href: string | null;
  status: AdminNotificationStatus;
  snoozedUntil: string | null;
  resolvedAt: string | null;
  resolvedBy: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

function isMissingTableError(error: { code?: string } | null | undefined): boolean {
  return error?.code === "42P01";
}

function normalizeLevel(input: unknown): AdminNotificationLevel {
  if (input === "critical") return "critical";
  if (input === "warning") return "warning";
  if (input === "success") return "success";
  return "info";
}

function normalizeStatus(input: unknown): AdminNotificationStatus {
  if (input === "snoozed") return "snoozed";
  if (input === "resolved") return "resolved";
  return "open";
}

export async function getActiveAdminNotifications(limit = 100): Promise<{
  available: boolean;
  items: AdminNotificationItem[];
}> {
  const client = createServiceClient();
  const { data, error } = await client
    .from("admin_notifications")
    .select(
      "id, dedupe_key, source, level, title, message, href, status, snoozed_until, resolved_at, resolved_by, metadata, created_at, updated_at"
    )
    .in("status", ["open", "snoozed"])
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    if (!isMissingTableError(error)) {
      console.error("[admin-notifications] failed to query notifications", {
        code: error.code,
        message: error.message,
      });
    }
    return { available: !isMissingTableError(error), items: [] };
  }

  const rows = (data ?? []) as RawAdminNotificationRow[];
  const items = rows
    .filter((row) => row.id && row.title && row.message && row.created_at)
    .map((row): AdminNotificationItem => ({
      id: String(row.id),
      dedupeKey: typeof row.dedupe_key === "string" ? row.dedupe_key : null,
      source: typeof row.source === "string" && row.source.trim().length > 0 ? row.source : "manual",
      level: normalizeLevel(row.level),
      title: String(row.title),
      message: String(row.message),
      href: typeof row.href === "string" ? row.href : null,
      status: normalizeStatus(row.status),
      snoozedUntil: typeof row.snoozed_until === "string" ? row.snoozed_until : null,
      resolvedAt: typeof row.resolved_at === "string" ? row.resolved_at : null,
      resolvedBy: typeof row.resolved_by === "string" ? row.resolved_by : null,
      metadata:
        row.metadata && typeof row.metadata === "object"
          ? (row.metadata as Record<string, unknown>)
          : null,
      createdAt: String(row.created_at),
      updatedAt: typeof row.updated_at === "string" ? row.updated_at : String(row.created_at),
    }));

  return { available: true, items };
}

export async function upsertAdminNotificationByDedupeKey(input: {
  dedupeKey: string;
  source: string;
  level: AdminNotificationLevel;
  title: string;
  message: string;
  href?: string | null;
  metadata?: Record<string, unknown> | null;
}): Promise<boolean> {
  if (!input.dedupeKey) return false;
  const client = createServiceClient();
  const payload = {
    dedupe_key: input.dedupeKey,
    source: input.source,
    level: input.level,
    title: input.title,
    message: input.message,
    href: input.href ?? null,
    status: "open",
    snoozed_until: null,
    resolved_at: null,
    resolved_by: null,
    metadata: input.metadata ?? null,
    updated_at: new Date().toISOString(),
  };
  const { error } = await client
    .from("admin_notifications")
    .upsert(payload, { onConflict: "dedupe_key" });
  if (error) {
    if (!isMissingTableError(error)) {
      console.error("[admin-notifications] failed to upsert notification", {
        dedupeKey: input.dedupeKey,
        code: error.code,
        message: error.message,
      });
    }
    return false;
  }
  return true;
}

export async function resolveAdminNotificationById(
  notificationId: string,
  adminUserId: string
): Promise<boolean> {
  const client = createServiceClient();
  const nowIso = new Date().toISOString();
  const { error } = await client
    .from("admin_notifications")
    .update({
      status: "resolved",
      resolved_at: nowIso,
      resolved_by: adminUserId,
      snoozed_until: null,
      updated_at: nowIso,
    })
    .eq("id", notificationId);
  if (error) {
    if (!isMissingTableError(error)) {
      console.error("[admin-notifications] failed to resolve notification", {
        notificationId,
        code: error.code,
        message: error.message,
      });
    }
    return false;
  }
  return true;
}

export async function reopenAdminNotificationById(notificationId: string): Promise<boolean> {
  const client = createServiceClient();
  const nowIso = new Date().toISOString();
  const { error } = await client
    .from("admin_notifications")
    .update({
      status: "open",
      resolved_at: null,
      resolved_by: null,
      snoozed_until: null,
      updated_at: nowIso,
    })
    .eq("id", notificationId);
  if (error) {
    if (!isMissingTableError(error)) {
      console.error("[admin-notifications] failed to reopen notification", {
        notificationId,
        code: error.code,
        message: error.message,
      });
    }
    return false;
  }
  return true;
}

export async function snoozeAdminNotificationById(
  notificationId: string,
  snoozeUntilIso: string
): Promise<boolean> {
  const client = createServiceClient();
  const nowIso = new Date().toISOString();
  const { error } = await client
    .from("admin_notifications")
    .update({
      status: "snoozed",
      snoozed_until: snoozeUntilIso,
      resolved_at: null,
      resolved_by: null,
      updated_at: nowIso,
    })
    .eq("id", notificationId);
  if (error) {
    if (!isMissingTableError(error)) {
      console.error("[admin-notifications] failed to snooze notification", {
        notificationId,
        code: error.code,
        message: error.message,
      });
    }
    return false;
  }
  return true;
}

export async function resolveAdminNotificationByDedupeKey(
  dedupeKey: string,
  adminUserId: string
): Promise<boolean> {
  if (!dedupeKey) return false;
  const client = createServiceClient();
  const nowIso = new Date().toISOString();
  const { error } = await client
    .from("admin_notifications")
    .update({
      status: "resolved",
      resolved_at: nowIso,
      resolved_by: adminUserId,
      snoozed_until: null,
      updated_at: nowIso,
    })
    .eq("dedupe_key", dedupeKey);
  if (error) {
    if (!isMissingTableError(error)) {
      console.error("[admin-notifications] failed to resolve by dedupe key", {
        dedupeKey,
        code: error.code,
        message: error.message,
      });
    }
    return false;
  }
  return true;
}

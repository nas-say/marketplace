const ADMIN_IDS_ENV = "ADMIN_CLERK_USER_IDS";

export function parseAdminIds(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

export function getConfiguredAdminIds(raw: string | undefined = process.env[ADMIN_IDS_ENV]): string[] {
  return parseAdminIds(raw);
}

export function isConfiguredAdminUser(
  userId: string | null | undefined,
  raw: string | undefined = process.env[ADMIN_IDS_ENV]
): boolean {
  if (!userId) return false;
  return getConfiguredAdminIds(raw).includes(userId);
}

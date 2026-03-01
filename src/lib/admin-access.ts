import "server-only";

const ADMIN_IDS_ENV = "ADMIN_CLERK_USER_IDS";

function parseAdminIds(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

export function getConfiguredAdminIds(): string[] {
  return parseAdminIds(process.env[ADMIN_IDS_ENV]);
}

export function isAdminUser(userId: string | null | undefined): boolean {
  if (!userId) return false;
  const adminIds = getConfiguredAdminIds();
  return adminIds.includes(userId);
}


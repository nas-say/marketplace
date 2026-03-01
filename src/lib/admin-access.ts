import "server-only";

import { getConfiguredAdminIds, isConfiguredAdminUser } from "@/lib/admin-access-shared";

export function getConfiguredAdminIdsFromEnv(): string[] {
  return getConfiguredAdminIds();
}

export function isAdminUser(userId: string | null | undefined): boolean {
  return isConfiguredAdminUser(userId);
}

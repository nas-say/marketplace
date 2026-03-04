const WAITLIST_VIEW_TTL_MS = 12 * 60 * 60 * 1000;
const STORAGE_PREFIX = "sideflip_waitlist_view";

function buildStorageKey(key: string): string {
  return `${STORAGE_PREFIX}:${key}`;
}

export function shouldTrackWaitlistViewClient(key: string): boolean {
  if (typeof window === "undefined") return false;

  try {
    const storageKey = buildStorageKey(key);
    const lastTrackedRaw = localStorage.getItem(storageKey);
    const lastTracked = lastTrackedRaw ? Number(lastTrackedRaw) : 0;
    const now = Date.now();

    if (Number.isFinite(lastTracked) && lastTracked > 0 && now - lastTracked < WAITLIST_VIEW_TTL_MS) {
      return false;
    }

    localStorage.setItem(storageKey, String(now));
    return true;
  } catch {
    // If storage is unavailable, still allow tracking.
    return true;
  }
}

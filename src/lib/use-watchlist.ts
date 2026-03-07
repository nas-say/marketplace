"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import {
  toggleWatchlistAction,
  getWatchlistIdsAction,
  mergeWatchlistIdsAction,
} from "./watchlist-actions";

const STORAGE_KEY = "sideflip_watchlist";
let bootstrapUserId: string | null = null;
let bootstrapPromise: Promise<string[] | null> | null = null;

function getLocalWatchlist(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveLocalWatchlist(ids: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

function clearLocalWatchlist() {
  localStorage.removeItem(STORAGE_KEY);
}

function loadLocalWatchlistAsync(setter: (ids: string[]) => void) {
  const ids = getLocalWatchlist();
  queueMicrotask(() => setter(ids));
}

async function loadServerWatchlist(userId: string): Promise<string[] | null> {
  if (bootstrapPromise && bootstrapUserId === userId) {
    return bootstrapPromise;
  }

  const nextPromise = (async () => {
    const localIds = Array.from(new Set(getLocalWatchlist()));
    if (localIds.length > 0) {
      const mergedIds = await mergeWatchlistIdsAction(localIds);
      if (mergedIds !== null) {
        clearLocalWatchlist();
      }
      return mergedIds;
    }
    return getWatchlistIdsAction();
  })();

  bootstrapUserId = userId;
  bootstrapPromise = nextPromise;

  try {
    return await nextPromise;
  } finally {
    if (bootstrapPromise === nextPromise) {
      bootstrapPromise = null;
      bootstrapUserId = null;
    }
  }
}

export function useWatchlist(listingId: string) {
  const { userId, isLoaded } = useAuth();
  const [watchlist, setWatchlist] = useState<string[]>([]);

  useEffect(() => {
    if (!isLoaded) return;
    if (!userId) {
      loadLocalWatchlistAsync(setWatchlist);
    } else {
      loadServerWatchlist(userId).then((ids) => {
        if (ids !== null) setWatchlist(ids);
      });
    }
  }, [isLoaded, userId]);

  const isWatchlisted = watchlist.includes(listingId);

  const toggle = useCallback(async () => {
    if (!userId) {
      const current = getLocalWatchlist();
      const updated = current.includes(listingId)
        ? current.filter((id) => id !== listingId)
        : [...current, listingId];
      saveLocalWatchlist(updated);
      setWatchlist(updated);
    } else {
      const previous = watchlist;
      const optimistic = previous.includes(listingId)
        ? previous.filter((id) => id !== listingId)
        : [...previous, listingId];
      setWatchlist(optimistic);

      const nextState = await toggleWatchlistAction(listingId);
      if (nextState === null) {
        setWatchlist(previous);
        return;
      }

      setWatchlist((current) =>
        nextState
          ? current.includes(listingId)
            ? current
            : [...current, listingId]
          : current.filter((id) => id !== listingId)
      );
    }
  }, [listingId, userId, watchlist]);

  return { isWatchlisted, toggle };
}

export function useAllWatchlisted() {
  const { userId, isLoaded } = useAuth();
  const [watchlist, setWatchlist] = useState<string[]>([]);

  useEffect(() => {
    if (!isLoaded) return;
    if (!userId) {
      loadLocalWatchlistAsync(setWatchlist);
    } else {
      loadServerWatchlist(userId).then((ids) => {
        if (ids !== null) setWatchlist(ids);
      });
    }
  }, [isLoaded, userId]);

  return watchlist;
}

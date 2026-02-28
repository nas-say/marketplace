"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "sideflip_watchlist";

function getWatchlist(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveWatchlist(ids: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

export function useWatchlist(listingId: string) {
  const [watchlist, setWatchlist] = useState<string[]>([]);

  useEffect(() => {
    setWatchlist(getWatchlist());
  }, []);

  const isWatchlisted = watchlist.includes(listingId);

  const toggle = useCallback(() => {
    const current = getWatchlist();
    const updated = current.includes(listingId)
      ? current.filter((id) => id !== listingId)
      : [...current, listingId];
    saveWatchlist(updated);
    setWatchlist(updated);
  }, [listingId]);

  return { isWatchlisted, toggle };
}

export function useAllWatchlisted() {
  const [watchlist, setWatchlist] = useState<string[]>([]);

  useEffect(() => {
    setWatchlist(getWatchlist());
  }, []);

  return watchlist;
}

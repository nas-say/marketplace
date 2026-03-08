"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bell, CheckCheck, Loader2, Menu, Rocket, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NAV_LINKS, SITE_NAME } from "@/lib/constants";
import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import {
  getNavbarMetaAction,
  getNotificationsSnapshotAction,
  markAllNotificationsReadAction,
} from "./notification-actions";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
  useAuth,
} from "@clerk/nextjs";
import type { UserNotificationItem } from "@/types/notification";

interface NavbarProps {
  connectsBalance?: number | null;
  unreadNotifications: number;
  notifications: UserNotificationItem[];
}

function formatNotificationTime(input: string): string {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function Navbar({ connectsBalance, unreadNotifications, notifications }: NavbarProps) {
  const { isLoaded, userId } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [markingRead, setMarkingRead] = useState(false);
  const [localConnectsBalance, setLocalConnectsBalance] = useState(connectsBalance ?? null);
  const [localUnreadCount, setLocalUnreadCount] = useState(unreadNotifications);
  const [localNotifications, setLocalNotifications] = useState(notifications);
  const [localStateUserId, setLocalStateUserId] = useState<string | null>(null);
  const pathname = usePathname();
  const isLocalStateFresh = Boolean(userId) && localStateUserId === userId;
  const resolvedConnectsBalance = isLocalStateFresh ? localConnectsBalance : connectsBalance ?? null;
  const resolvedUnreadCount = isLocalStateFresh ? localUnreadCount : unreadNotifications;
  const resolvedNotifications = isLocalStateFresh ? localNotifications : notifications;

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(href));

  const handleToggleNotifications = async () => {
    if (notificationsOpen) {
      setNotificationsOpen(false);
      return;
    }
    setNotificationsOpen(true);
    setLoadingNotifications(true);
    const snapshot = await getNotificationsSnapshotAction();
    setLoadingNotifications(false);
    if (snapshot.error) return;
    setLocalStateUserId(userId ?? null);
    setLocalUnreadCount(snapshot.unread);
    setLocalNotifications(snapshot.notifications);
  };

  const handleMarkAllRead = async () => {
    if (markingRead || resolvedUnreadCount === 0) return;
    setMarkingRead(true);
    const result = await markAllNotificationsReadAction();
    setMarkingRead(false);
    if (result.error) return;
    const nowIso = new Date().toISOString();
    setLocalStateUserId(userId ?? null);
    setLocalUnreadCount(0);
    setLocalNotifications((prev) =>
      prev.map((item) => ({ ...item, readAt: item.readAt ?? nowIso }))
    );
  };

  useEffect(() => {
    if (!isLoaded || !userId || localStateUserId === userId) return;

    let cancelled = false;
    const run = async () => {
      const snapshot = await getNavbarMetaAction();
      if (cancelled || snapshot.error) return;
      setLocalStateUserId(userId);
      setLocalConnectsBalance(snapshot.connectsBalance);
      setLocalUnreadCount(snapshot.unread);
    };

    let clearScheduledRun = () => {};

    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      const idleHandle = window.requestIdleCallback(run, { timeout: 1200 });
      clearScheduledRun = () => window.cancelIdleCallback(idleHandle);
    } else {
      const timeoutHandle = globalThis.setTimeout(run, 150);
      clearScheduledRun = () => globalThis.clearTimeout(timeoutHandle);
    }

    return () => {
      cancelled = true;
      clearScheduledRun();
    };
  }, [isLoaded, localStateUserId, userId]);

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#060a13]/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <Rocket className="h-6 w-6 text-sky-300" />
          <span className="font-display text-lg font-semibold text-zinc-50">{SITE_NAME}</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`relative pb-1 text-sm transition-colors ${
                isActive(link.href) ? "text-zinc-50" : "text-zinc-400 hover:text-zinc-50"
              }`}
            >
              {link.label}
              {isActive(link.href) && (
                <motion.span
                  layoutId="desktop-nav-underline"
                  className="absolute -bottom-[5px] left-0 right-0 h-0.5 rounded-full bg-sky-400"
                />
              )}
            </Link>
          ))}

          <SignedOut>
            <SignInButton mode="modal">
              <Button size="sm" variant="outline" className="border-white/10 bg-white/5 text-slate-200 hover:bg-white/10">
                Sign In
              </Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-500">
                Sign Up
              </Button>
            </SignUpButton>
          </SignedOut>

          <SignedIn>
            {[
              { href: "/dashboard", label: "Dashboard" },
              { href: "/connects", label: "Connects" },
              { href: "/how-it-works", label: "How It Works" },
              { href: "/settings", label: "Settings" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`relative pb-1 text-sm transition-colors ${
                  isActive(link.href) ? "text-zinc-50" : "text-zinc-400 hover:text-zinc-50"
                }`}
              >
                {link.label}
                {isActive(link.href) && (
                  <motion.span
                    layoutId="desktop-nav-underline"
                    className="absolute -bottom-[5px] left-0 right-0 h-0.5 rounded-full bg-sky-400"
                  />
                )}
              </Link>
            ))}
            {resolvedConnectsBalance != null && (
              <Link
                href="/connects"
                className="inline-flex items-center gap-1 rounded-full border border-amber-300/25 bg-amber-300/10 px-2.5 py-1 text-xs font-medium text-amber-200 transition-colors hover:bg-amber-300/20"
                title="Your Connects balance"
              >
                <Zap className="h-3 w-3" />
                {resolvedConnectsBalance}
              </Link>
            )}
            <div className="relative">
              <button
                type="button"
                onClick={handleToggleNotifications}
                className="relative inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-300 transition-colors hover:border-white/20 hover:text-zinc-100"
                title="Notifications"
              >
                <Bell className="h-4 w-4" />
                {resolvedUnreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-semibold text-white">
                    {resolvedUnreadCount > 9 ? "9+" : resolvedUnreadCount}
                  </span>
                )}
              </button>
              <AnimatePresence>
                {notificationsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.16 }}
                    className="absolute right-0 top-10 z-50 w-80 rounded-xl border border-white/10 bg-[#09101b] p-2 shadow-2xl"
                  >
                    <div className="mb-1 flex items-center justify-between px-2 py-1">
                      <p className="text-sm font-medium text-zinc-100">Notifications</p>
                      <button
                        type="button"
                        onClick={handleMarkAllRead}
                        disabled={markingRead || resolvedUnreadCount === 0}
                        className="inline-flex items-center gap-1 text-xs text-zinc-400 transition-colors hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {markingRead ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <CheckCheck className="h-3 w-3" />
                        )}
                        Mark all read
                      </button>
                    </div>
                    {loadingNotifications ? (
                      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 text-sm text-zinc-500">
                        Loading...
                      </div>
                    ) : resolvedNotifications.length === 0 ? (
                      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 text-sm text-zinc-500">
                        No notifications yet.
                      </div>
                    ) : (
                      <div className="max-h-96 space-y-1 overflow-y-auto">
                        {resolvedNotifications.map((item) => {
                          const content = (
                            <div className="flex items-start gap-2 rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 transition-colors hover:border-zinc-700">
                              {!item.readAt ? (
                                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-indigo-500" />
                              ) : (
                                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-zinc-700" />
                              )}
                              <div className="min-w-0">
                                <p className="text-sm text-zinc-200">{item.title}</p>
                                {item.message && (
                                  <p className="mt-0.5 line-clamp-2 text-xs text-zinc-500">{item.message}</p>
                                )}
                                <p className="mt-1 text-[11px] text-zinc-600">{formatNotificationTime(item.createdAt)}</p>
                              </div>
                            </div>
                          );

                          return item.href ? (
                            <Link key={item.id} href={item.href} onClick={() => setNotificationsOpen(false)}>
                              {content}
                            </Link>
                          ) : (
                            <div key={item.id}>{content}</div>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <UserButton appearance={{ elements: { avatarBox: "h-8 w-8" } }} />
          </SignedIn>
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden text-zinc-400"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          <AnimatePresence mode="wait" initial={false}>
            {mobileOpen ? (
              <motion.span
                key="close"
                initial={{ opacity: 0, rotate: -80 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: 80 }}
                transition={{ duration: 0.16 }}
                className="block"
              >
                <X className="h-6 w-6" />
              </motion.span>
            ) : (
              <motion.span
                key="menu"
                initial={{ opacity: 0, rotate: 80 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: -80 }}
                transition={{ duration: 0.16 }}
                className="block"
              >
                <Menu className="h-6 w-6" />
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* Mobile nav */}
      <AnimatePresence initial={false}>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-zinc-800 bg-zinc-950 px-4 pb-4 md:hidden"
          >
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`block py-3 text-sm transition-colors ${
                  isActive(link.href) ? "text-zinc-50" : "text-zinc-400 hover:text-zinc-50"
                }`}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-3 flex flex-col gap-2">
              <SignedOut>
                <SignInButton mode="modal">
                  <Button size="sm" variant="outline" className="w-full border-zinc-700 text-zinc-300">
                    Sign In
                  </Button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <Button size="sm" className="w-full bg-indigo-600 hover:bg-indigo-500">
                    Sign Up
                  </Button>
                </SignUpButton>
              </SignedOut>
              <SignedIn>
                {[
                  { href: "/dashboard", label: "Dashboard" },
                  { href: "/connects", label: "Connects" },
                  { href: "/how-it-works", label: "How It Works" },
                  { href: "/settings", label: "Settings" },
                ].map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`block py-2 text-sm transition-colors ${
                      isActive(link.href) ? "text-zinc-50" : "text-zinc-400 hover:text-zinc-50"
                    }`}
                    onClick={() => setMobileOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="flex items-center justify-between py-2 text-sm">
                    <span className="text-zinc-400">Notifications</span>
                    <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-indigo-500/20 px-1.5 py-0.5 text-xs text-indigo-300">
                    {resolvedUnreadCount}
                  </span>
                </div>
                <div className="flex items-center gap-3 py-2">
                  <UserButton />
                  <span className="text-sm text-zinc-400">My Account</span>
                  {resolvedConnectsBalance != null && (
                    <Link
                      href="/connects"
                      className="ml-auto inline-flex items-center gap-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-1 text-xs font-medium text-indigo-300"
                      onClick={() => setMobileOpen(false)}
                    >
                      <Zap className="h-3 w-3" />
                      {resolvedConnectsBalance}
                    </Link>
                  )}
                </div>
              </SignedIn>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

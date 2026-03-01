"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NAV_LINKS, SITE_NAME } from "@/lib/constants";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <Rocket className="h-6 w-6 text-indigo-500" />
          <span className="text-lg font-bold text-zinc-50">{SITE_NAME}</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-zinc-400 transition-colors hover:text-zinc-50"
            >
              {link.label}
            </Link>
          ))}

          <SignedOut>
            <SignInButton mode="modal">
              <Button size="sm" variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                Sign In
              </Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-500">
                Sign Up
              </Button>
            </SignUpButton>
          </SignedOut>

          <SignedIn>
            <Link href="/dashboard" className="text-sm text-zinc-400 transition-colors hover:text-zinc-50">Dashboard</Link>
            <Link href="/connects" className="text-sm text-zinc-400 transition-colors hover:text-zinc-50">Connects</Link>
            <Link href="/settings" className="text-sm text-zinc-400 transition-colors hover:text-zinc-50">Settings</Link>
            <UserButton appearance={{ elements: { avatarBox: "h-8 w-8" } }} />
          </SignedIn>
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden text-zinc-400"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="border-t border-zinc-800 bg-zinc-950 px-4 pb-4 md:hidden">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block py-3 text-sm text-zinc-400 hover:text-zinc-50"
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
              <div className="flex items-center gap-3 py-2">
                <UserButton />
                <span className="text-sm text-zinc-400">My Account</span>
              </div>
            </SignedIn>
          </div>
        </div>
      )}
    </nav>
  );
}

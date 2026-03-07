import Link from "next/link";
import { Rocket } from "lucide-react";
import { SITE_NAME } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#050912]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <Rocket className="h-5 w-5 text-sky-300" />
              <span className="font-display text-lg font-semibold text-zinc-50">{SITE_NAME}</span>
            </div>
            <p className="mt-3 text-sm leading-7 text-slate-500">
              The marketplace where founders buy, sell, and beta-test indie products and online businesses.
            </p>
          </div>

          <div>
            <h3 className="eyebrow">Marketplace</h3>
            <ul className="mt-3 space-y-2">
              <li><Link href="/browse" className="text-sm text-slate-400 hover:text-zinc-50">Browse Projects</Link></li>
              <li><Link href="/create" className="text-sm text-slate-400 hover:text-zinc-50">List a Project</Link></li>
              <li><Link href="/how-it-works" className="text-sm text-slate-400 hover:text-zinc-50">How It Works</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="eyebrow">Beta Testing</h3>
            <ul className="mt-3 space-y-2">
              <li><Link href="/beta" className="text-sm text-slate-400 hover:text-zinc-50">Find Beta Tests</Link></li>
              <li><Link href="/create" className="text-sm text-slate-400 hover:text-zinc-50">Post a Beta Test</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="eyebrow">Company</h3>
            <ul className="mt-3 space-y-2">
              <li><Link href="/how-it-works" className="text-sm text-slate-400 hover:text-zinc-50">About</Link></li>
              <li><Link href="/terms" className="text-sm text-slate-400 hover:text-zinc-50">Terms of Service</Link></li>
              <li><Link href="/privacy" className="text-sm text-slate-400 hover:text-zinc-50">Privacy Policy</Link></li>
              <li><Link href="/refund" className="text-sm text-slate-400 hover:text-zinc-50">Refund Policy</Link></li>
              <li><Link href="/contact" className="text-sm text-slate-400 hover:text-zinc-50">Contact Us</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-white/10 pt-8 text-center text-sm text-slate-500">
          &copy; {new Date().getFullYear()} {SITE_NAME}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

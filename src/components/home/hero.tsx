import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap } from "lucide-react";

export function Hero() {
  return (
    <section className="gradient-hero py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-sm text-indigo-400 mb-6">
          <Zap className="h-3.5 w-3.5" />
          The marketplace for indie hackers
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-zinc-50 sm:text-6xl">
          Buy, Sell &amp; Beta-Test
          <br />
          <span className="text-indigo-500">Side Projects</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-400">
          The marketplace where indie hackers trade projects and find beta testers.
          Build, test, improve, sell — all in one place.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link href="/browse">
            <Button size="lg" className="bg-indigo-600 hover:bg-indigo-500">
              Browse Projects
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/create">
            <Button size="lg" variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
              List Your Project
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

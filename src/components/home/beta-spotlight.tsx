import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getActiveBetaTests } from "@/lib/db/beta-tests";
import { BetaCard } from "@/components/beta/beta-card";

export async function BetaSpotlight() {
  const betaTests = (await getActiveBetaTests()).slice(0, 3);

  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-bold text-zinc-50">Projects Seeking Beta Testers</h2>
            <p className="mt-2 text-zinc-400">Help shape products before they launch and earn rewards.</p>
          </div>
          <Link
            href="/beta"
            className="hidden sm:flex items-center gap-1 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            View all beta tests
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          {betaTests.map((bt) => (
            <BetaCard key={bt.id} betaTest={bt} />
          ))}
        </div>
        <div className="mt-6 sm:hidden">
          <Link
            href="/beta"
            className="flex items-center gap-1 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            View all beta tests
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

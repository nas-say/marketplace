import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getActiveBetaTests } from "@/lib/db/beta-tests";
import { BetaCard } from "@/components/beta/beta-card";

export async function BetaSpotlight() {
  const betaTests = (await getActiveBetaTests()).slice(0, 3);

  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="eyebrow">Beta testing board</p>
            <h2 className="mt-3 text-4xl font-semibold text-zinc-50 sm:text-5xl">Programs looking for thoughtful testers.</h2>
            <p className="mt-3 text-[15px] leading-7 text-slate-400">
              Cash pools, premium-access rewards, and structured approval flows that feel more like real ops than a public shout.
            </p>
          </div>
          <Link
            href="/beta"
            className="hidden items-center gap-1 text-sm text-sky-300 transition-colors hover:text-sky-200 sm:flex"
          >
            View all beta tests
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
          {betaTests.map((bt) => (
            <BetaCard key={bt.id} betaTest={bt} />
          ))}
        </div>
        <div className="mt-6 sm:hidden">
          <Link
            href="/beta"
            className="flex items-center gap-1 text-sm text-sky-300 transition-colors hover:text-sky-200"
          >
            View all beta tests
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

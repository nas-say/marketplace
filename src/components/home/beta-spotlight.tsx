import { getActiveBetaTests } from "@/lib/data";
import { BetaCard } from "@/components/beta/beta-card";

export function BetaSpotlight() {
  const betaTests = getActiveBetaTests().slice(0, 3);

  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-zinc-50">Projects Seeking Beta Testers</h2>
        <p className="mt-2 text-zinc-400">Help shape products before they launch and earn rewards.</p>
        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          {betaTests.map((bt) => (
            <BetaCard key={bt.id} betaTest={bt} />
          ))}
        </div>
      </div>
    </section>
  );
}

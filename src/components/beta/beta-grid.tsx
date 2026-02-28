import { BetaTest } from "@/types/beta-test";
import { BetaCard } from "./beta-card";

interface BetaGridProps {
  betaTests: BetaTest[];
}

export function BetaGrid({ betaTests }: BetaGridProps) {
  if (betaTests.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-zinc-500">No beta tests found matching your filters.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {betaTests.map((bt) => (
        <BetaCard key={bt.id} betaTest={bt} />
      ))}
    </div>
  );
}

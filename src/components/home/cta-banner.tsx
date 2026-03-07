import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function CtaBanner() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="surface-panel rounded-[34px] p-8 sm:p-12">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="max-w-2xl">
              <p className="eyebrow">For operators</p>
              <h2 className="mt-3 text-4xl font-semibold text-zinc-50 sm:text-5xl">Ready to sell your side project?</h2>
              <p className="mt-4 text-[15px] leading-7 text-slate-400">
                List in minutes, add trust signals, and let buyers self-select through direct or proposal-gated contact.
              </p>
            </div>
            <Link href="/create">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-500">
                List Your Project
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
